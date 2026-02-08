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
    class="flex items-center gap-2 px-1.5 py-1 rounded-xl h-8 min-w-0 transition-all duration-200 ease-out"
    role="button"
    draggable="false"
    :to="to"
    :title="label"
    :class="{
      'text-n-slate-12 bg-gradient-to-r from-n-violet-5/60 via-n-violet-4/40 to-transparent font-medium shadow-[inset_0_0_0_1px_rgba(135,105,230,0.25)]': isActive && !hasActiveChild,
      'text-n-slate-12 font-medium': hasActiveChild,
      'text-n-slate-11 hover:bg-gradient-to-r hover:from-n-violet-4/40 hover:via-n-violet-3/30 hover:to-transparent': !isActive && !hasActiveChild,
    }"
    @click.stop="emit('toggle')"
  >
    <div v-if="icon" class="relative flex items-center gap-2">
      <div 
        class="flex items-center justify-center size-6 rounded-md transition-all duration-200"
        :class="{
          'bg-gradient-to-br from-n-violet-8 to-n-iris-9 text-white shadow-md shadow-n-violet-9/30': isActive || hasActiveChild,
          'bg-n-violet-4/40 text-n-violet-11 group-hover:bg-n-violet-5/50': !isActive && !hasActiveChild,
        }"
      >
        <Icon :icon="icon" class="size-3.5" />
      </div>
      <span
        v-if="showBadge"
        class="size-2.5 -top-0.5 ltr:-right-0.5 rtl:-left-0.5 bg-gradient-to-br from-n-ruby-9 to-n-ruby-10 absolute rounded-full border-2 border-n-solid-2 animate-pulse"
      />
    </div>
    <div class="flex items-center gap-1.5 flex-grow min-w-0 flex-1">
      <span
        class="truncate"
        :class="{
          'text-body-main': !isActive,
          'font-medium text-sm': isActive || hasActiveChild,
        }"
      >
        {{ label }}
      </span>
      <span
        v-if="dynamicCount && !expandable"
        class="rounded-md capitalize text-xs leading-5 font-semibold text-center px-1.5 flex-shrink-0 bg-n-violet-5/50 text-n-violet-11"
        :class="{
          'bg-gradient-to-r from-n-violet-6/60 to-n-violet-5/40 text-n-slate-12': isActive,
        }"
      >
        {{ count }}
      </span>
    </div>
    <span
      v-if="expandable"
      v-show="isExpanded"
      class="i-lucide-chevron-up size-3"
      @click.stop="emit('toggle')"
    />
  </component>
</template>
