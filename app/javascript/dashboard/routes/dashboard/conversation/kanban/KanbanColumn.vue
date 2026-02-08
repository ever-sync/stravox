<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import KanbanCard from './KanbanCard.vue';

const props = defineProps({
  title: { type: String, required: true },
  statusKey: { type: String, required: true },
  conversations: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  color: { type: String, default: 'bg-n-slate-9' },
});

const emit = defineEmits(['update:conversations', 'change', 'openContextMenu']);

const { t } = useI18n();

const count = computed(() => props.conversations.length);

const localConversations = computed({
  get: () => props.conversations,
  set: val => emit('update:conversations', val),
});

const onDragChange = evt => {
  if (evt.added) {
    emit('change', {
      conversation: evt.added.element,
      newStatus: props.statusKey,
      newIndex: evt.added.newIndex,
    });
  }
};

const onOpenContextMenu = (event, chat) => {
  emit('openContextMenu', event, chat);
};
</script>

<template>
  <div class="flex flex-col flex-shrink-0 w-80 rounded-xl overflow-hidden">
    <!-- Column header -->
    <div class="flex items-center gap-2 px-3 py-2.5 bg-n-alpha-1 border border-n-weak rounded-t-xl">
      <span :class="color" class="w-2.5 h-2.5 rounded-full flex-shrink-0" />
      <h3 class="font-semibold text-xs uppercase tracking-wider text-n-slate-11 flex-1">
        {{ title }}
      </h3>
      <span class="text-xxs font-semibold text-n-slate-10 bg-n-alpha-2 rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
        {{ count }}
      </span>
    </div>

    <!-- Draggable area -->
    <div class="flex-1 overflow-y-auto bg-n-alpha-1/50 border-x border-b border-n-weak rounded-b-xl p-2 min-h-[200px]">
      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col gap-2">
        <div
          v-for="i in 3"
          :key="i"
          class="animate-pulse p-3 bg-n-background rounded-lg border border-n-weak"
        >
          <div class="flex items-center gap-2 mb-2">
            <div class="w-7 h-7 rounded-full bg-n-alpha-3" />
            <div class="flex-1">
              <div class="h-3 bg-n-alpha-3 rounded w-3/4 mb-1" />
              <div class="h-2 bg-n-alpha-3 rounded w-1/4" />
            </div>
          </div>
          <div class="h-3 bg-n-alpha-3 rounded w-full mb-1" />
          <div class="h-3 bg-n-alpha-3 rounded w-2/3" />
        </div>
      </div>

      <!-- Draggable list -->
      <Draggable
        v-else
        v-model="localConversations"
        group="kanban"
        item-key="id"
        :animation="200"
        ghost-class="kanban-ghost"
        drag-class="kanban-drag"
        chosen-class="kanban-chosen"
        class="flex flex-col gap-2 min-h-[150px]"
        @change="onDragChange"
      >
        <template #item="{ element }">
          <KanbanCard
            :chat="element"
            @open-context-menu="onOpenContextMenu"
          />
        </template>
        <template #footer>
          <div
            v-if="!count && !loading"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <fluent-icon
              icon="chat"
              size="32"
              class="text-n-slate-8 mb-2"
            />
            <p class="text-xs text-n-slate-10">
              {{ t('CONVERSATION.KANBAN.EMPTY_COLUMN') }}
            </p>
            <p class="text-xxs text-n-slate-9 mt-1">
              {{ t('CONVERSATION.KANBAN.DRAG_HINT') }}
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
  border-radius: 0.5rem;
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
