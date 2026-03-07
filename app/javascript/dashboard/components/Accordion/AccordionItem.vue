<script setup>
import EmojiOrIcon from 'shared/components/EmojiOrIcon.vue';
import { defineEmits } from 'vue';

defineProps({
  title: {
    type: String,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: '',
  },
  emoji: {
    type: String,
    default: '',
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['toggle']);

const onToggle = () => {
  emit('toggle');
};
</script>

<template>
  <div class="text-sm rounded-2xl border border-n-weak/80 bg-n-slate-1 shadow-[0_12px_30px_rgba(15,23,42,0.05)] overflow-hidden">
    <button
      class="drag-handle m-0 flex w-full cursor-grab select-none items-center justify-between bg-gradient-to-r from-n-slate-1 via-n-alpha-1 to-n-slate-1 px-4 py-3"
      @click.stop="onToggle"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-n-alpha-2 text-n-slate-11">
          <EmojiOrIcon class="inline-block w-5" :icon="icon" :emoji="emoji" />
        </span>
        <h5 class="mb-0 truncate py-0 pl-0 pr-2 text-sm font-semibold text-n-slate-12">
          {{ title }}
        </h5>
      </div>
      <div class="flex flex-row items-center gap-2">
        <slot name="button" />
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-n-alpha-2 text-n-slate-11 cursor-pointer">
          <fluent-icon v-if="isOpen" size="24" icon="subtract" type="solid" />
          <fluent-icon v-else size="24" icon="add" type="solid" />
        </div>
      </div>
    </button>
    <div
      v-if="isOpen"
      class="border-t border-n-weak/80 bg-white/70"
      :class="compact ? 'p-0' : 'px-3 py-4'"
    >
      <slot />
    </div>
  </div>
</template>
