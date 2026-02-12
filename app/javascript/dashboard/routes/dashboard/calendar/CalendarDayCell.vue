<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { isSameMonth } from 'date-fns';
import CalendarEventCard from './CalendarEventCard.vue';

const props = defineProps({
  day: { type: Date, required: true },
  currentMonth: { type: Date, required: true },
  conversations: { type: Array, default: () => [] },
  isToday: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);

const { t: _t } = useI18n();

const isCurrentMonth = computed(() =>
  isSameMonth(props.day, props.currentMonth)
);
const dayNumber = computed(() => props.day.getDate());

const statusCounts = computed(() => {
  const counts = { open: 0, pending: 0, snoozed: 0, resolved: 0 };
  props.conversations.forEach(c => {
    const s = c.status || 'open';
    if (counts[s] !== undefined) counts[s] += 1;
  });
  return counts;
});

const hasDots = computed(
  () => props.conversations.length > 0
);

const visibleConversations = computed(
  () => props.conversations.slice(0, 3)
);

const moreCount = computed(
  () => Math.max(0, props.conversations.length - 3)
);

const onSelect = () => emit('select', props.day);
</script>
<template>
  <div
    class="flex flex-col border border-n-weak/50 p-1 min-h-[100px] cursor-pointer transition-colors duration-150 hover:bg-n-alpha-1"
    :class="[
      isCurrentMonth ? 'bg-n-background' : 'bg-n-alpha-1/30',
      selected ? 'ring-2 ring-n-violet-7 bg-n-violet-3/10' : '',
    ]"
    @click="onSelect"
  >
    <!-- Day number -->
    <div class="flex items-center justify-between mb-1">
      <span
        class="text-xs font-medium leading-6 w-6 h-6 flex items-center justify-center rounded-full"
        :class="[
          isToday
            ? 'bg-n-violet-9 text-white'
            : isCurrentMonth
              ? 'text-n-slate-12'
              : 'text-n-slate-8',
        ]"
      >
        {{ dayNumber }}
      </span>
      <!-- Status dots -->
      <div v-if="hasDots" class="flex gap-0.5">
        <span
          v-if="statusCounts.open"
          class="w-1.5 h-1.5 rounded-full bg-n-teal-9"
          :title="`${statusCounts.open} open`"
        />
        <span
          v-if="statusCounts.pending"
          class="w-1.5 h-1.5 rounded-full bg-n-amber-9"
          :title="`${statusCounts.pending} pending`"
        />
        <span
          v-if="statusCounts.snoozed"
          class="w-1.5 h-1.5 rounded-full bg-n-violet-9"
          :title="`${statusCounts.snoozed} snoozed`"
        />
        <span
          v-if="statusCounts.resolved"
          class="w-1.5 h-1.5 rounded-full bg-n-slate-9"
          :title="`${statusCounts.resolved} resolved`"
        />
      </div>
    </div>

    <!-- Mini conversation list -->
    <div class="flex flex-col gap-0.5 flex-1 overflow-hidden">
      <CalendarEventCard
        v-for="conv in visibleConversations"
        :key="conv.id"
        :conversation="conv"
      />
      <span v-if="moreCount > 0" class="text-xxs text-n-slate-10 pl-1">
        +{{ moreCount }}
      </span>
    </div>
  </div>
</template>
