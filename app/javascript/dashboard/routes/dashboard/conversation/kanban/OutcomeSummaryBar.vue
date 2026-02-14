<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  conversations: { type: Array, default: () => [] },
});

const { t } = useI18n();

const formatCurrency = value => {
  if (!value) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const activeCount = computed(
  () => props.conversations.filter(c => !c.custom_attributes?.outcome).length
);

const wonDeals = computed(() =>
  props.conversations.filter(c => c.custom_attributes?.outcome === 'won')
);

const lostDeals = computed(() =>
  props.conversations.filter(c => c.custom_attributes?.outcome === 'lost')
);

const abandonedDeals = computed(() =>
  props.conversations.filter(c => c.custom_attributes?.outcome === 'abandoned')
);

const wonTotal = computed(() =>
  wonDeals.value.reduce(
    (sum, c) => sum + (c.custom_attributes?.deal_value || 0),
    0
  )
);

const activeTotal = computed(() =>
  props.conversations
    .filter(c => !c.custom_attributes?.outcome)
    .reduce((sum, c) => sum + (c.custom_attributes?.deal_value || 0), 0)
);

const metrics = computed(() => [
  {
    label: t('CONVERSATION.PIPELINE.ACTIVE'),
    value: activeCount.value,
    subValue: formatCurrency(activeTotal.value),
    icon: 'i-lucide-activity',
    color: 'text-n-violet-11',
    bgColor: 'bg-n-violet-3/30',
  },
  {
    label: t('CONVERSATION.PIPELINE.OUTCOME_WON'),
    value: wonDeals.value.length,
    subValue: formatCurrency(wonTotal.value),
    icon: 'i-lucide-check-circle',
    color: 'text-n-green-11',
    bgColor: 'bg-n-green-3/30',
  },
  {
    label: t('CONVERSATION.PIPELINE.OUTCOME_LOST'),
    value: lostDeals.value.length,
    icon: 'i-lucide-x-circle',
    color: 'text-n-ruby-11',
    bgColor: 'bg-n-ruby-3/30',
  },
  {
    label: t('CONVERSATION.PIPELINE.OUTCOME_ABANDONED'),
    value: abandonedDeals.value.length,
    icon: 'i-lucide-ban',
    color: 'text-n-slate-11',
    bgColor: 'bg-n-slate-3/30',
  },
]);
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-3 flex-wrap border-b border-n-weak mb-2"
  >
    <div
      v-for="metric in metrics"
      :key="metric.label"
      class="flex items-center gap-2 px-4 py-2 rounded-lg border border-n-weak bg-n-background flex-1 min-w-[140px]"
    >
      <div
        class="flex items-center justify-center w-7 h-7 rounded-md"
        :class="metric.bgColor"
      >
        <span :class="[metric.icon, metric.color]" class="text-sm" />
      </div>
      <div class="flex flex-col">
        <div class="flex items-baseline gap-1.5">
          <span class="text-sm font-bold text-n-slate-12">
            {{ metric.value }}
          </span>
          <span class="text-xxs text-n-slate-10">
            {{ metric.label }}
          </span>
        </div>
        <span
          v-if="metric.subValue"
          class="text-xxs font-medium"
          :class="metric.color"
        >
          {{ metric.subValue }}
        </span>
      </div>
    </div>
  </div>
</template>
