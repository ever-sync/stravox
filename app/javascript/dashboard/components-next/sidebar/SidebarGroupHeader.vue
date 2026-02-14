<script setup>
import { computed } from 'vue';
import { useMapGetter } from 'dashboard/composables/store.js';
import Icon from 'next/icon/Icon.vue';

const props = defineProps({
  to: { type: [Object, String], default: '' },
  label: { type: String, default: '' },
  icon: { type: [String, Object], default: null },
  expandable: { type: Boolean, default: false },
  isExpanded: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  hasActiveChild: { type: Boolean, default: false },
  getterKeys: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['toggle']);

const showBadge = useMapGetter(props.getterKeys.badge);
const dynamicCount = useMapGetter(props.getterKeys.count);
const count = computed(() =>
  dynamicCount.value > 99 ? '99+' : dynamicCount.value
);
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    class="flex items-center gap-2 px-1.5 py-1 rounded-xl h-9 min-w-0 transition-all duration-200 ease-out"
    role="button"
    draggable="false"
    :to="to"
    :title="label"
    :class="{
      'text-white bg-white/[0.07] font-medium shadow-[inset_0_0_0_1px_rgba(139,92,246,0.15)]':
        isActive && !hasActiveChild,
      'text-white font-medium': hasActiveChild,
      'text-white/60 hover:bg-white/[0.04] hover:text-white':
        !isActive && !hasActiveChild,
    }"
    @click.stop="emit('toggle')"
  >
    <div v-if="icon" class="relative flex items-center gap-2">
      <div
        class="flex items-center justify-center size-7 rounded-lg transition-all duration-200"
        :class="{
          'bg-violet-500/20 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.3)]':
            isActive || hasActiveChild,
          'bg-white/[0.06] text-white/50': !isActive && !hasActiveChild,
        }"
      >
        <Icon :icon="icon" class="size-4" />
      </div>
      <span
        v-if="showBadge"
        class="size-2.5 -top-0.5 ltr:-right-0.5 rtl:-left-0.5 bg-gradient-to-br from-n-ruby-9 to-n-ruby-10 absolute rounded-full border-2 border-[#0c0c12] animate-pulse"
      />
    </div>
    <div class="flex items-center gap-1.5 flex-grow min-w-0 flex-1">
      <span
        class="truncate text-[13px]"
        :class="{
          '': !isActive,
          'font-medium': isActive || hasActiveChild,
        }"
      >
        {{ label }}
      </span>
      <span
        v-if="dynamicCount && !expandable"
        class="rounded-md capitalize text-xs leading-5 font-semibold text-center px-1.5 flex-shrink-0 bg-violet-500/20 text-violet-300"
      >
        {{ count }}
      </span>
    </div>
    <span
      v-if="expandable"
      v-show="isExpanded"
      class="i-lucide-chevron-up size-3 text-white/30"
      @click.stop="emit('toggle')"
    />
  </component>
</template>
