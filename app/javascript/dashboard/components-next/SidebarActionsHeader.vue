<script setup>
import Button from './button/Button.vue';
defineProps({
  title: {
    type: String,
    required: true,
  },
  buttons: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['click', 'close']);

const handleButtonClick = button => {
  emit('click', button.key);
};
</script>

<template>
  <div
    class="flex h-16 items-center justify-between border-b border-n-weak/80 bg-n-slate-1/80 px-5 py-3 backdrop-blur"
  >
    <div class="flex items-center justify-between gap-2 flex-1">
      <div class="flex min-w-0 flex-col">
        <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-n-slate-10">
          Workspace
        </span>
        <span class="truncate text-sm font-semibold text-n-slate-12">
          {{ title }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <Button
          v-for="button in buttons"
          :key="button.key"
          v-tooltip="button.tooltip"
          :icon="button.icon"
          ghost
          sm
          @click="handleButtonClick(button)"
        />
        <Button
          v-tooltip="$t('GENERAL.CLOSE')"
          icon="i-lucide-x"
          ghost
          sm
          @click="$emit('close')"
        />
      </div>
    </div>
  </div>
</template>
