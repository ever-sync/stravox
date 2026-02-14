<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  format,
  isToday as isDateToday,
} from 'date-fns';
import CalendarDayCell from './CalendarDayCell.vue';

const props = defineProps({
  currentDate: { type: Date, required: true },
  conversationsByDay: { type: Object, default: () => ({}) },
  selectedDay: { type: Date, default: null },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['selectDay']);

useI18n();

const weekDays = computed(() => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return days;
});

const calendarDays = computed(() => {
  const monthStart = startOfMonth(props.currentDate);
  const monthEnd = endOfMonth(props.currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: calStart, end: calEnd });
});

const weeks = computed(() => {
  const days = calendarDays.value;
  const result = [];
  for (let i = 0; i < days.length; i += 7) {
    result.push(days.slice(i, i + 7));
  }
  return result;
});

const getConversationsForDay = day => {
  const key = format(day, 'yyyy-MM-dd');
  return props.conversationsByDay[key] || [];
};

const isSelected = day => {
  return props.selectedDay && isSameDay(day, props.selectedDay);
};

const onSelectDay = day => emit('selectDay', day);
</script>

<template>
  <div class="flex flex-col flex-1 overflow-hidden">
    <!-- Week day headers -->
    <div class="grid grid-cols-7 border-b border-n-weak">
      <div
        v-for="day in weekDays"
        :key="day"
        class="px-2 py-2 text-center text-xs font-semibold text-n-slate-10 uppercase tracking-wider"
      >
        {{ day }}
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="grid grid-cols-7 flex-1">
      <div
        v-for="i in 35"
        :key="i"
        class="border border-n-weak/50 p-2 min-h-[100px]"
      >
        <div class="animate-pulse">
          <div class="w-6 h-6 rounded-full bg-n-alpha-3 mb-2" />
          <div class="h-3 bg-n-alpha-3 rounded w-3/4 mb-1" />
          <div class="h-3 bg-n-alpha-3 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Calendar grid -->
    <div v-else class="flex-1 overflow-y-auto">
      <div
        v-for="(week, weekIdx) in weeks"
        :key="weekIdx"
        class="grid grid-cols-7"
      >
        <CalendarDayCell
          v-for="day in week"
          :key="day.toISOString()"
          :day="day"
          :current-month="currentDate"
          :conversations="getConversationsForDay(day)"
          :is-today="isDateToday(day)"
          :selected="isSelected(day)"
          @select="onSelectDay"
        />
      </div>
    </div>
  </div>
</template>
