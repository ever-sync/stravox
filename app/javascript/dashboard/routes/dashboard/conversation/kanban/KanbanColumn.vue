<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import KanbanCard from './KanbanCard.vue';

const props = defineProps({
  title: { type: String, required: true },
  stageId: { type: String, required: true },
  conversations: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  color: { type: String, default: '#6366F1' },
});

const emit = defineEmits([
  'update:conversations',
  'change',
  'openContextMenu',
  'dragStart',
  'dragEnd',
]);

const { t } = useI18n();

const count = computed(() => props.conversations.length);

// Total deal value sum
const totalValue = computed(() =>
  props.conversations.reduce(
    (sum, c) => sum + (c.custom_attributes?.deal_value || 0),
    0
  )
);

const formattedTotalValue = computed(() => {
  if (totalValue.value === 0) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalValue.value);
});

const localConversations = computed({
  get: () => props.conversations,
  set: val => emit('update:conversations', val),
});

const onDragChange = evt => {
  if (evt.added) {
    emit('change', {
      conversation: evt.added.element,
      newStageId: props.stageId,
      newIndex: evt.added.newIndex,
    });
  }
};

const onDragStart = () => emit('dragStart');
const onDragEnd = () => emit('dragEnd');

const onOpenContextMenu = (event, chat) => {
  emit('openContextMenu', event, chat);
};
</script>

<template>
  <div
    class="flex flex-col flex-shrink-0 w-72 min-w-[260px] rounded-xl overflow-hidden"
  >
    <!-- Column header -->
    <div
      class="flex items-center gap-2.5 px-3 py-2.5 bg-n-alpha-1 border border-n-weak rounded-t-xl"
    >
      <span
        class="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
        :style="{ backgroundColor: color }"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3
            class="font-semibold text-xs uppercase tracking-wider text-n-slate-11 truncate"
          >
            {{ title }}
          </h3>
          <span
            class="text-xxs font-semibold text-n-slate-10 bg-n-alpha-2 rounded-full px-2 py-0.5 min-w-[1.5rem] text-center flex-shrink-0"
          >
            {{ count }}
          </span>
        </div>
        <p
          v-if="formattedTotalValue"
          class="text-xxs font-medium text-n-green-11 mt-0.5"
        >
          {{ formattedTotalValue }}
          <span class="text-n-slate-10 font-normal">
            {{ t('CONVERSATION.PIPELINE.IN_DEALS', { count }) }}
          </span>
        </p>
      </div>
    </div>

    <!-- Draggable area -->
    <div
      class="flex-1 overflow-y-auto bg-n-alpha-1/50 border-x border-b border-n-weak rounded-b-xl p-2"
    >
      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col gap-2">
        <div
          v-for="i in 3"
          :key="i"
          class="animate-pulse p-3 bg-n-background rounded-xl border border-n-weak"
        >
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-full bg-n-alpha-3" />
            <div class="flex-1">
              <div class="h-3 bg-n-alpha-3 rounded w-3/4 mb-1" />
              <div class="h-2 bg-n-alpha-3 rounded w-1/4" />
            </div>
          </div>
          <div class="h-3 bg-n-alpha-3 rounded w-full mb-1" />
          <div class="h-3 bg-n-alpha-3 rounded w-2/3 mb-2" />
          <div class="flex justify-between">
            <div class="h-4 bg-n-alpha-3 rounded w-16" />
            <div class="h-4 bg-n-alpha-3 rounded w-20" />
          </div>
        </div>
      </div>

      <!-- Draggable list -->
      <Draggable
        v-else
        v-model="localConversations"
        group="pipeline"
        item-key="id"
        :animation="200"
        ghost-class="kanban-ghost"
        drag-class="kanban-drag"
        chosen-class="kanban-chosen"
        class="flex flex-col gap-2 min-h-[150px]"
        @change="onDragChange"
        @start="onDragStart"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <KanbanCard :chat="element" @open-context-menu="onOpenContextMenu" />
        </template>
        <template #footer>
          <div
            v-if="!count && !loading"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <fluent-icon icon="chat" size="32" class="text-n-slate-8 mb-2" />
            <p class="text-xs text-n-slate-10">
              {{ t('CONVERSATION.PIPELINE.EMPTY_STAGE') }}
            </p>
            <p class="text-xxs text-n-slate-9 mt-1">
              {{ t('CONVERSATION.PIPELINE.DRAG_HINT') }}
            </p>
          </div>
        </template>
      </Draggable>
    </div>
  </div>
</template>

<style scoped>
.kanban-ghost {
  opacity: 0.4;
  border: 2px dashed var(--n-violet-8, #8b5cf6);
  border-radius: 0.75rem;
  background: var(--n-violet-3, #f5f3ff);
}

.kanban-drag {
  opacity: 0.9;
  transform: rotate(2deg);
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.15);
  z-index: 50;
}

.kanban-chosen {
  box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.1);
}
</style>
