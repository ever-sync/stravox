<script setup>
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';

defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['outcome']);

const { t } = useI18n();

const zones = [
  {
    key: 'abandoned',
    labelKey: 'CONVERSATION.PIPELINE.DROP_ABANDONED',
    icon: 'i-lucide-ban',
    bgClass: 'bg-n-slate-3 border-n-slate-7 hover:bg-n-slate-4',
    activeClass: 'bg-n-slate-5 border-n-slate-8 scale-105',
    iconColor: 'text-n-slate-11',
  },
  {
    key: 'lost',
    labelKey: 'CONVERSATION.PIPELINE.DROP_LOST',
    icon: 'i-lucide-x-circle',
    bgClass: 'bg-n-ruby-3/40 border-n-ruby-7 hover:bg-n-ruby-3/60',
    activeClass: 'bg-n-ruby-4 border-n-ruby-8 scale-105',
    iconColor: 'text-n-ruby-11',
  },
  {
    key: 'won',
    labelKey: 'CONVERSATION.PIPELINE.DROP_WON',
    icon: 'i-lucide-check-circle',
    bgClass: 'bg-n-green-3/40 border-n-green-7 hover:bg-n-green-3/60',
    activeClass: 'bg-n-green-4 border-n-green-8 scale-105',
    iconColor: 'text-n-green-11',
  },
];

const onOutcomeDrop = (outcome, evt) => {
  if (evt.added) {
    emit('outcome', {
      conversation: evt.added.element,
      outcome,
    });
  }
};
</script>

<template>
  <teleport to="body">
    <transition name="slide-up">
      <div
        v-if="visible"
        class="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-center gap-4 px-6 pb-6 pt-3"
        style="
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.15) 0%,
            transparent 100%
          );
        "
      >
        <div v-for="zone in zones" :key="zone.key" class="flex-1 max-w-xs">
          <Draggable
            :list="[]"
            group="pipeline"
            item-key="id"
            :animation="150"
            class="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all duration-200 min-h-[90px]"
            :class="zone.bgClass"
            @change="onOutcomeDrop(zone.key, $event)"
          >
            <template #header>
              <span :class="[zone.icon, zone.iconColor]" class="text-2xl" />
              <span class="text-sm font-semibold" :class="zone.iconColor">
                <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys -->
                {{ t(zone.labelKey) }}
              </span>
            </template>
            <template #item="{ element }">
              <div class="hidden">{{ element.id }}</div>
            </template>
          </Draggable>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
