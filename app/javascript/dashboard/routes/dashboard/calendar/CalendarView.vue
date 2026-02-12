<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday as isDateToday,
} from 'date-fns';
import CalendarGrid from './CalendarGrid.vue';
import CalendarEventCard from './CalendarEventCard.vue';

const { t } = useI18n();
const store = useStore();

// --- State ---
const currentDate = ref(new Date());
const selectedDay = ref(null);
const viewMode = ref('month');
const loading = ref(false);

// --- Store getters ---
const allConversations = useMapGetter('getAllConversations');

// --- Date navigation ---
const headerTitle = computed(() => {
  if (viewMode.value === 'day' && selectedDay.value) {
    return format(selectedDay.value, 'EEEE, MMMM d, yyyy');
  }
  if (viewMode.value === 'week') {
    const weekStart = startOfWeek(currentDate.value, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate.value, { weekStartsOn: 1 });
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  }
  return format(currentDate.value, 'MMMM yyyy');
});

const goToToday = () => {
  currentDate.value = new Date();
  selectedDay.value = new Date();
};

const goPrev = () => {
  if (viewMode.value === 'month') {
    currentDate.value = subMonths(currentDate.value, 1);
  } else if (viewMode.value === 'week') {
    currentDate.value = subWeeks(currentDate.value, 1);
  } else {
    selectedDay.value = subDays(selectedDay.value || new Date(), 1);
    currentDate.value = selectedDay.value;
  }
};

const goNext = () => {
  if (viewMode.value === 'month') {
    currentDate.value = addMonths(currentDate.value, 1);
  } else if (viewMode.value === 'week') {
    currentDate.value = addWeeks(currentDate.value, 1);
  } else {
    selectedDay.value = addDays(selectedDay.value || new Date(), 1);
    currentDate.value = selectedDay.value;
  }
};

// --- Group conversations by day ---
const getDateKey = date => format(date, 'yyyy-MM-dd');

const conversationsByDay = computed(() => {
  const map = {};
  const conversations = allConversations.value || [];

  conversations.forEach(conv => {
    const ts = conv.last_activity_at || conv.timestamp || conv.created_at;
    if (!ts) return;

    const date = new Date(ts * 1000);
    const key = getDateKey(date);
    if (!map[key]) map[key] = [];
    map[key].push(conv);

    // Also map snoozed conversations to their snoozed_until date
    if (conv.snoozed_until) {
      const snoozedDate = new Date(conv.snoozed_until);
      const snoozedKey = getDateKey(snoozedDate);
      if (snoozedKey !== key) {
        if (!map[snoozedKey]) map[snoozedKey] = [];
        map[snoozedKey].push(conv);
      }
    }
  });

  return map;
});

// --- Selected day conversations ---
const selectedDayConversations = computed(() => {
  if (!selectedDay.value) return [];
  const key = getDateKey(selectedDay.value);
  return conversationsByDay.value[key] || [];
});

// --- Week view days ---
const weekDays = computed(() => {
  const weekStart = startOfWeek(currentDate.value, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate.value, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
});

const getConversationsForDay = day => {
  const key = getDateKey(day);
  return conversationsByDay.value[key] || [];
};

const onSelectDay = day => {
  selectedDay.value = day;
};

const closeDayPanel = () => {
  selectedDay.value = null;
};

// --- Fetch data on mount ---
onMounted(async () => {
  loading.value = true;
  try {
    await store.dispatch('fetchAllConversations', {});
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-n-background">
    <!-- Header -->
    <header class="flex items-center justify-between gap-4 px-4 py-3 border-b border-n-weak flex-wrap">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-semibold text-n-slate-12">
          {{ t('CONVERSATION.CALENDAR.TITLE') }}
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <!-- View mode tabs -->
        <div class="flex items-center bg-n-alpha-1 rounded-lg border border-n-weak p-0.5">
          <button
            v-for="mode in ['month', 'week', 'day']"
            :key="mode"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150"
            :class="
              viewMode === mode
                ? 'bg-n-background text-n-slate-12 shadow-sm'
                : 'text-n-slate-10 hover:text-n-slate-12'
            "
            @click="viewMode = mode"
          >
            <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys -->
            {{ t(`CONVERSATION.CALENDAR.${mode.toUpperCase()}`) }}
          </button>
        </div>

        <!-- Navigation -->
        <div class="flex items-center gap-1">
          <button
            class="p-1.5 rounded-lg text-n-slate-11 hover:bg-n-alpha-2 transition-colors"
            @click="goPrev"
          >
            <fluent-icon icon="chevron-left" size="16" />
          </button>
          <button
            class="px-3 py-1.5 text-sm font-medium text-n-slate-12 min-w-[180px] text-center"
          >
            {{ headerTitle }}
          </button>
          <button
            class="p-1.5 rounded-lg text-n-slate-11 hover:bg-n-alpha-2 transition-colors"
            @click="goNext"
          >
            <fluent-icon icon="chevron-right" size="16" />
          </button>
        </div>

        <!-- Today button -->
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-lg border border-n-weak text-n-slate-11 hover:bg-n-alpha-2 transition-colors"
          @click="goToToday"
        >
          {{ t('CONVERSATION.CALENDAR.TODAY') }}
        </button>
      </div>
    </header>

    <!-- Content area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Month view -->
      <CalendarGrid
        v-if="viewMode === 'month'"
        :current-date="currentDate"
        :conversations-by-day="conversationsByDay"
        :selected-day="selectedDay"
        :loading="loading"
        class="flex-1"
        @select-day="onSelectDay"
      />

      <!-- Week view -->
      <div v-else-if="viewMode === 'week'" class="flex-1 overflow-x-auto">
        <div class="grid grid-cols-7 h-full min-w-[700px]">
          <div
            v-for="day in weekDays"
            :key="day.toISOString()"
            class="flex flex-col border-r border-n-weak last:border-r-0 overflow-hidden"
          >
            <div
              class="px-2 py-2 text-center border-b border-n-weak"
              :class="isDateToday(day) ? 'bg-n-violet-3/20' : 'bg-n-alpha-1'"
            >
              <p class="text-xs font-medium text-n-slate-10 uppercase">
                {{ format(day, 'EEE') }}
              </p>
              <p
                class="text-lg font-semibold"
                :class="isDateToday(day) ? 'text-n-violet-9' : 'text-n-slate-12'"
              >
                {{ format(day, 'd') }}
              </p>
            </div>
            <div class="flex-1 overflow-y-auto p-1 space-y-0.5">
              <CalendarEventCard
                v-for="conv in getConversationsForDay(day)"
                :key="conv.id"
                :conversation="conv"
              />
              <p
                v-if="getConversationsForDay(day).length === 0"
                class="text-xxs text-n-slate-9 text-center py-4"
              >
                {{ t('CONVERSATION.CALENDAR.NO_EVENTS') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Day view -->
      <div v-else-if="viewMode === 'day'" class="flex-1 overflow-y-auto p-4">
        <div v-if="selectedDayConversations.length === 0" class="flex flex-col items-center justify-center py-16">
          <fluent-icon icon="calendar" size="48" class="text-n-slate-8 mb-3" />
          <p class="text-sm text-n-slate-10">
            {{ t('CONVERSATION.CALENDAR.NO_EVENTS') }}
          </p>
        </div>
        <div v-else class="max-w-2xl mx-auto space-y-1">
          <CalendarEventCard
            v-for="conv in selectedDayConversations"
            :key="conv.id"
            :conversation="conv"
          />
        </div>
      </div>

      <!-- Selected day side panel (month view) -->
      <transition name="slide-panel">
        <div
          v-if="viewMode === 'month' && selectedDay"
          class="w-80 border-l border-n-weak bg-n-background flex flex-col overflow-hidden flex-shrink-0"
        >
          <div class="flex items-center justify-between px-3 py-2.5 border-b border-n-weak">
            <div>
              <p class="text-sm font-semibold text-n-slate-12">
                {{ format(selectedDay, 'EEEE') }}
              </p>
              <p class="text-xs text-n-slate-10">
                {{ format(selectedDay, 'MMMM d, yyyy') }}
              </p>
            </div>
            <button
              class="p-1 rounded-md hover:bg-n-alpha-2 text-n-slate-10 transition-colors"
              @click="closeDayPanel"
            >
              <fluent-icon icon="dismiss" size="16" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            <div
              v-if="selectedDayConversations.length === 0"
              class="flex flex-col items-center justify-center py-8 text-center"
            >
              <fluent-icon icon="calendar" size="32" class="text-n-slate-8 mb-2" />
              <p class="text-xs text-n-slate-10">
                {{ t('CONVERSATION.CALENDAR.NO_EVENTS') }}
              </p>
            </div>
            <div v-else class="space-y-1">
              <CalendarEventCard
                v-for="conv in selectedDayConversations"
                :key="conv.id"
                :conversation="conv"
              />
            </div>
          </div>
          <div class="px-3 py-2 border-t border-n-weak text-center">
            <span class="text-xxs text-n-slate-10">
              {{ selectedDayConversations.length }}
              {{ selectedDayConversations.length === 1 ? 'conversation' : 'conversations' }}
            </span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.2s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
