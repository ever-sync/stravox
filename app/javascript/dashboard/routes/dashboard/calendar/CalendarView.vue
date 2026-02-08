<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col h-full overflow-auto bg-n-background p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-n-slate-12">
        {{ t('CONVERSATION.SIDEBAR.CALENDAR') }}
      </h1>
    </div>
    <div
      class="flex items-center justify-center h-64 border-2 border-dashed border-n-weak rounded-lg"
    >
      <p class="text-n-slate-10">
        {{ t('CONVERSATION.SIDEBAR.CALENDAR') }} - Coming Soon
      </p>
    </div>
  </div>
</template>
