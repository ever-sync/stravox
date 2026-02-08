<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import wootConstants from 'dashboard/constants/globals';

const { SNOOZE_OPTIONS } = wootConstants;
import {
  findSnoozeTime,
} from 'dashboard/helper/snoozeHelpers';

defineProps({
  show: { type: Boolean, default: false },
});

const emit = defineEmits(['confirm', 'cancel']);

const { t } = useI18n();

const snoozeOptions = [
  { key: SNOOZE_OPTIONS.AN_HOUR_FROM_NOW, label: 'CONVERSATION.KANBAN.SNOOZE_1H' },
  { key: SNOOZE_OPTIONS.UNTIL_TOMORROW, label: 'CONVERSATION.KANBAN.SNOOZE_TOMORROW' },
  { key: SNOOZE_OPTIONS.UNTIL_NEXT_WEEK, label: 'CONVERSATION.KANBAN.SNOOZE_NEXT_WEEK' },
  { key: SNOOZE_OPTIONS.UNTIL_NEXT_MONTH, label: 'CONVERSATION.KANBAN.SNOOZE_NEXT_MONTH' },
];

const selectedOption = ref(SNOOZE_OPTIONS.UNTIL_TOMORROW);

const onConfirm = () => {
  const snoozedUntil = findSnoozeTime(selectedOption.value);
  emit('confirm', snoozedUntil);
};

const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        @click="onCancel"
      />

      <!-- Modal -->
      <div class="relative bg-n-background border border-n-weak rounded-xl shadow-2xl p-6 w-96 max-w-[90vw] z-10">
        <h3 class="text-lg font-semibold text-n-slate-12 mb-1">
          {{ t('CONVERSATION.KANBAN.SNOOZE_TITLE') }}
        </h3>
        <p class="text-sm text-n-slate-10 mb-4">
          {{ t('CONVERSATION.KANBAN.SNOOZE_DESCRIPTION') }}
        </p>

        <div class="flex flex-col gap-2 mb-6">
          <label
            v-for="opt in snoozeOptions"
            :key="opt.key"
            class="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all"
            :class="
              selectedOption === opt.key
                ? 'border-n-violet-8 bg-n-violet-3/30'
                : 'border-n-weak hover:border-n-slate-7'
            "
          >
            <input
              v-model="selectedOption"
              type="radio"
              :value="opt.key"
              class="accent-n-violet-9"
            />
            <span class="text-sm text-n-slate-12">{{ t(opt.label) }}</span>
          </label>
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 text-sm font-medium text-n-slate-11 bg-n-alpha-1 border border-n-weak rounded-lg hover:bg-n-alpha-2 transition-colors"
            @click="onCancel"
          >
            {{ t('CONVERSATION.KANBAN.CANCEL') }}
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-n-violet-9 rounded-lg hover:bg-n-violet-10 transition-colors shadow-sm"
            @click="onConfirm"
          >
            {{ t('CONVERSATION.KANBAN.SNOOZE_CONFIRM') }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
