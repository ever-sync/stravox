<script setup>
import { ref, computed, watch, onMounted, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import wootConstants from 'dashboard/constants/globals';
import { emitter } from 'shared/helpers/mitt';
import { BUS_EVENTS } from 'shared/constants/busEvents';
import KanbanHeader from './kanban/KanbanHeader.vue';
import KanbanColumn from './kanban/KanbanColumn.vue';
import OutcomeDropZones from './kanban/OutcomeDropZones.vue';
import OutcomeSummaryBar from './kanban/OutcomeSummaryBar.vue';
import PipelineConfigModal from './kanban/PipelineConfigModal.vue';
import ContextMenu from 'dashboard/components/ui/ContextMenu.vue';
import ConversationContextMenu from 'dashboard/components/widgets/conversation/contextMenu/Index.vue';
import SnoozeModal from './kanban/SnoozeModal.vue';

const { ASSIGNEE_TYPE, SORT_BY_TYPE, STATUS_TYPE } = wootConstants;

const { t } = useI18n();
const store = useStore();

// --- Pipeline config persistence ---
const accountId = useMapGetter('getCurrentAccountId');

const STORAGE_KEY = computed(() => `cw-pipelines-${accountId.value}`);

const DEFAULT_PIPELINE = {
  id: 'default',
  name: 'Pipeline de Vendas',
  stages: [
    { id: 'lead', name: 'Novo Lead', color: '#3B82F6' },
    { id: 'contact', name: 'Contato Feito', color: '#8B5CF6' },
    { id: 'qualified', name: 'Qualificado', color: '#F59E0B' },
    { id: 'proposal', name: 'Proposta Enviada', color: '#EF4444' },
    { id: 'negotiation', name: 'Negociacao', color: '#EC4899' },
    { id: 'closing', name: 'Fechamento', color: '#10B981' },
  ],
};

const loadPipelines = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY.value);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.pipelines?.length) return data;
    }
  } catch {
    // ignore
  }
  return { pipelines: [DEFAULT_PIPELINE], activePipelineId: 'default' };
};

const savePipelines = (pipelines, activePipelineId) => {
  localStorage.setItem(
    STORAGE_KEY.value,
    JSON.stringify({ pipelines, activePipelineId })
  );
};

// --- Reactive state ---
const pipelineData = ref(loadPipelines());
const pipelines = computed(() => pipelineData.value.pipelines);
const activePipelineId = ref(pipelineData.value.activePipelineId);

const activePipeline = computed(
  () =>
    pipelines.value.find(p => p.id === activePipelineId.value) ||
    pipelines.value[0]
);

const assigneeTab = ref(ASSIGNEE_TYPE.ME);
const sortKey = ref(SORT_BY_TYPE.LAST_ACTIVITY_AT_DESC);
const searchQuery = ref('');
const selectedInboxId = ref('');
const loading = ref(false);
const isDragging = ref(false);
const showConfigModal = ref(false);

// Context menu state
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuChat = ref(null);

// Snooze modal state
const showSnoozeModal = ref(false);
const pendingSnoozeConversation = ref(null);

// --- Store getters ---
const allConversations = useMapGetter('getAllConversations');
const currentUser = useMapGetter('getCurrentUser');
const inboxes = useMapGetter('inboxes/getInboxes');

// --- Pipeline-filtered conversations ---
const pipelineConversations = computed(() => {
  let result = allConversations.value || [];
  const pipelineId = activePipelineId.value;

  // Filter by pipeline_id in custom_attributes
  result = result.filter(c => {
    const attrs = c.custom_attributes || {};
    // Include conversations assigned to this pipeline
    // Also include conversations with no pipeline assigned (for "default" pipeline)
    if (pipelineId === 'default') {
      return !attrs.pipeline_id || attrs.pipeline_id === 'default';
    }
    return attrs.pipeline_id === pipelineId;
  });

  // Exclude archived/outcome conversations from board
  result = result.filter(c => {
    const outcome = c.custom_attributes?.outcome;
    return !outcome;
  });

  // Filter by assignee
  if (assigneeTab.value === ASSIGNEE_TYPE.ME) {
    const userId = currentUser.value?.id;
    result = result.filter(c => c.meta?.assignee?.id === userId);
  } else if (assigneeTab.value === ASSIGNEE_TYPE.UNASSIGNED) {
    result = result.filter(c => !c.meta?.assignee);
  }

  // Filter by inbox
  if (selectedInboxId.value) {
    const inboxId = Number(selectedInboxId.value);
    result = result.filter(c => c.inbox_id === inboxId);
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(c => {
      const contactName = (c.meta?.sender?.name || '').toLowerCase();
      const id = String(c.id);
      const lastMsg =
        c.last_non_activity_message?.content || '';
      return (
        contactName.includes(query) ||
        id.includes(query) ||
        lastMsg.toLowerCase().includes(query)
      );
    });
  }

  return result;
});

// All conversations for pipeline metrics (including outcomes)
const allPipelineConversations = computed(() => {
  const result = allConversations.value || [];
  const pipelineId = activePipelineId.value;
  return result.filter(c => {
    const attrs = c.custom_attributes || {};
    if (pipelineId === 'default') {
      return !attrs.pipeline_id || attrs.pipeline_id === 'default';
    }
    return attrs.pipeline_id === pipelineId;
  });
});

const totalFilteredCount = computed(() => pipelineConversations.value.length);

// --- Local mutable arrays per stage (vuedraggable requires mutability) ---
const stageConversations = ref({});

// Sort helper
const sortComparator = (a, b) => {
  if (sortKey.value === SORT_BY_TYPE.CREATED_AT_DESC) {
    return (b.created_at || 0) - (a.created_at || 0);
  }
  if (sortKey.value === SORT_BY_TYPE.PRIORITY_DESC) {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  }
  return (
    (b.timestamp || b.last_activity_at || 0) -
    (a.timestamp || a.last_activity_at || 0)
  );
};

// Sync store → local arrays grouped by stage
const syncFromStore = () => {
  const stages = activePipeline.value?.stages || [];
  const grouped = {};
  stages.forEach(s => {
    grouped[s.id] = [];
  });

  pipelineConversations.value.forEach(c => {
    const stageId = c.custom_attributes?.pipeline_stage || stages[0]?.id || 'lead';
    if (grouped[stageId]) {
      grouped[stageId].push(c);
    } else {
      // Conversation is in a stage that no longer exists — put in first stage
      const firstStage = stages[0]?.id;
      if (firstStage && grouped[firstStage]) {
        grouped[firstStage].push(c);
      }
    }
  });

  // Sort each stage
  Object.keys(grouped).forEach(key => {
    grouped[key].sort(sortComparator);
  });

  stageConversations.value = grouped;
};

// Watch for store changes and re-sync
watch(
  () => [pipelineConversations.value, sortKey.value, activePipeline.value],
  () => syncFromStore(),
  { deep: true }
);

// --- Drag & drop handler (stage change) ---
const onColumnChange = async ({ conversation, newStageId }) => {
  if (!conversation) return;
  const currentStage = conversation.custom_attributes?.pipeline_stage;
  if (currentStage === newStageId) return;

  try {
    await store.dispatch('updateCustomAttributes', {
      conversationId: conversation.id,
      custom_attributes: {
        pipeline_stage: newStageId,
      },
    });
  } catch {
    syncFromStore();
  }
};

// --- Outcome handler ---
const onOutcome = async ({ conversation, outcome }) => {
  if (!conversation) return;

  const outcomeMessages = {
    won: t('CONVERSATION.PIPELINE.OUTCOME_WON_MSG'),
    lost: t('CONVERSATION.PIPELINE.OUTCOME_LOST_MSG'),
    abandoned: t('CONVERSATION.PIPELINE.OUTCOME_ABANDONED_MSG'),
  };

  try {
    await store.dispatch('updateCustomAttributes', {
      conversationId: conversation.id,
      custom_attributes: {
        outcome,
        outcome_at: new Date().toISOString(),
        pipeline_stage: '__archived__',
      },
    });

    emitter.emit(BUS_EVENTS.SHOW_TOAST, {
      message: outcomeMessages[outcome] || `Deal: ${outcome}`,
      action: { type: 'link' },
    });
  } catch {
    syncFromStore();
  }
};

// --- Drag state ---
const onDragStart = () => {
  isDragging.value = true;
};

const onDragEnd = () => {
  isDragging.value = false;
};

// --- Pipeline config ---
const onOpenConfig = () => {
  showConfigModal.value = true;
};

const onCloseConfig = () => {
  showConfigModal.value = false;
};

const onSaveConfig = (newPipelines, newActivePipelineId) => {
  pipelineData.value = {
    pipelines: newPipelines,
    activePipelineId: newActivePipelineId,
  };
  activePipelineId.value = newActivePipelineId;
  savePipelines(newPipelines, newActivePipelineId);
  showConfigModal.value = false;
  syncFromStore();
};

const onChangePipeline = id => {
  activePipelineId.value = id;
  savePipelines(pipelines.value, id);
};

// --- Snooze ---
const onSnoozeConfirm = async snoozedUntil => {
  const conv = pendingSnoozeConversation.value;
  showSnoozeModal.value = false;
  if (!conv) return;
  try {
    await store.dispatch('toggleStatus', {
      conversationId: conv.id,
      status: STATUS_TYPE.SNOOZED,
      snoozedUntil,
    });
  } catch {
    syncFromStore();
  }
  pendingSnoozeConversation.value = null;
};

const onSnoozeCancel = () => {
  showSnoozeModal.value = false;
  pendingSnoozeConversation.value = null;
  syncFromStore();
};

// --- Context menu ---
const openCardContextMenu = (event, chat) => {
  contextMenuPosition.value = {
    x: event.pageX || event.clientX,
    y: event.pageY || event.clientY,
  };
  contextMenuChat.value = chat;
  showContextMenu.value = true;
};

const closeContextMenu = () => {
  showContextMenu.value = false;
  contextMenuChat.value = null;
};

const onUpdateConversation = (conversationId, status, snoozedUntil) => {
  closeContextMenu();
  store.dispatch('toggleStatus', { conversationId, status, snoozedUntil });
};

const onAssignAgent = (agent, conversationIds) => {
  closeContextMenu();
  store.dispatch('assignAgent', {
    conversationId: conversationIds[0],
    agentId: agent.id,
  });
};

const onAssignLabel = (labels, conversationIds) => {
  closeContextMenu();
  store.dispatch('conversationLabels/update', {
    conversationId: conversationIds[0],
    labels,
  });
};

const onAssignTeam = (team, conversationId) => {
  closeContextMenu();
  store.dispatch('assignTeam', {
    conversationId,
    teamId: team.id,
  });
};

const onAssignPriority = (priority, conversationId) => {
  closeContextMenu();
  store.dispatch('assignPriority', { conversationId, priority });
};

const onMarkAsUnread = conversationId => {
  closeContextMenu();
  store.dispatch('markMessagesUnread', { id: conversationId });
};

const onMarkAsRead = conversationId => {
  closeContextMenu();
  store.dispatch('markMessagesRead', { id: conversationId });
};

// Provide context menu actions for child components
provide('onAssignAgent', onAssignAgent);
provide('onAssignLabel', onAssignLabel);
provide('onAssignTeam', onAssignTeam);
provide('onAssignPriority', onAssignPriority);
provide('onUpdateConversation', onUpdateConversation);

// --- Fetch conversations on mount ---
onMounted(async () => {
  loading.value = true;
  try {
    await store.dispatch('fetchAllConversations', {});
  } finally {
    loading.value = false;
    syncFromStore();
  }
});

// --- Handlers ---
const onChangeAssignee = key => {
  assigneeTab.value = key;
};

const onChangeSort = key => {
  sortKey.value = key;
};

const onUpdateSearch = query => {
  searchQuery.value = query;
};

const onChangeInbox = inboxId => {
  selectedInboxId.value = inboxId;
};
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-n-background p-4">
    <KanbanHeader
      :active-assignee-tab="assigneeTab"
      :active-sort="sortKey"
      :search-query="searchQuery"
      :selected-inbox-id="selectedInboxId"
      :inboxes="inboxes"
      :total-count="totalFilteredCount"
      :pipelines="pipelines"
      :active-pipeline-id="activePipelineId"
      @change-assignee="onChangeAssignee"
      @change-sort="onChangeSort"
      @update-search="onUpdateSearch"
      @change-inbox="onChangeInbox"
      @change-pipeline="onChangePipeline"
      @open-config="onOpenConfig"
    />

    <!-- Outcome summary bar -->
    <OutcomeSummaryBar :conversations="allPipelineConversations" />

    <!-- Pipeline columns -->
    <main class="flex-grow overflow-x-auto overflow-y-hidden">
      <div class="flex gap-4 h-full pb-4">
        <KanbanColumn
          v-for="stage in activePipeline?.stages || []"
          :key="stage.id"
          :title="stage.name"
          :stage-id="stage.id"
          :conversations="stageConversations[stage.id] || []"
          :loading="loading"
          :color="stage.color"
          @update:conversations="val => (stageConversations[stage.id] = val)"
          @change="onColumnChange"
          @open-context-menu="openCardContextMenu"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
        />
      </div>
    </main>

    <!-- Outcome drop zones (appear on drag) -->
    <OutcomeDropZones
      :visible="isDragging"
      @outcome="onOutcome"
    />

    <!-- Pipeline config modal -->
    <PipelineConfigModal
      :show="showConfigModal"
      :pipelines="pipelines"
      :active-pipeline-id="activePipelineId"
      @close="onCloseConfig"
      @save="onSaveConfig"
    />

    <!-- Context menu -->
    <ContextMenu
      v-if="showContextMenu && contextMenuChat"
      :x="contextMenuPosition.x"
      :y="contextMenuPosition.y"
      @close="closeContextMenu"
    >
      <ConversationContextMenu
        :status="contextMenuChat.status"
        :inbox-id="contextMenuChat.inbox_id"
        :priority="contextMenuChat.priority"
        :chat-id="contextMenuChat.id"
        :has-unread-messages="(contextMenuChat.unread_count || 0) > 0"
        @update-conversation="onUpdateConversation"
        @assign-agent="onAssignAgent"
        @assign-label="onAssignLabel"
        @assign-team="onAssignTeam"
        @mark-as-unread="onMarkAsUnread"
        @mark-as-read="onMarkAsRead"
        @assign-priority="onAssignPriority"
        @close="closeContextMenu"
      />
    </ContextMenu>

    <!-- Snooze modal -->
    <SnoozeModal
      v-if="showSnoozeModal"
      :show="showSnoozeModal"
      @confirm="onSnoozeConfirm"
      @cancel="onSnoozeCancel"
    />
  </div>
</template>
