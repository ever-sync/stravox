<script setup>
import { ref, computed, watch, onMounted, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import wootConstants from 'dashboard/constants/globals';
import KanbanHeader from './kanban/KanbanHeader.vue';
import KanbanColumn from './kanban/KanbanColumn.vue';
import ContextMenu from 'dashboard/components/ui/ContextMenu.vue';
import ConversationContextMenu from 'dashboard/components/widgets/conversation/contextMenu/Index.vue';
import SnoozeModal from './kanban/SnoozeModal.vue';

const { ASSIGNEE_TYPE, SORT_BY_TYPE, STATUS_TYPE } = wootConstants;

const { t } = useI18n();
const store = useStore();

// --- Reactive state ---
const assigneeTab = ref(ASSIGNEE_TYPE.ME);
const sortKey = ref(SORT_BY_TYPE.LAST_ACTIVITY_AT_DESC);
const searchQuery = ref('');
const selectedInboxId = ref('');
const loading = ref(false);

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

// --- Column definitions ---
const columns = [
  {
    key: STATUS_TYPE.OPEN,
    labelKey: 'CONVERSATION.KANBAN.STATUS_OPEN',
    color: 'bg-n-teal-9',
  },
  {
    key: STATUS_TYPE.PENDING,
    labelKey: 'CONVERSATION.KANBAN.STATUS_PENDING',
    color: 'bg-n-amber-9',
  },
  {
    key: STATUS_TYPE.SNOOZED,
    labelKey: 'CONVERSATION.KANBAN.STATUS_SNOOZED',
    color: 'bg-n-violet-9',
  },
  {
    key: STATUS_TYPE.RESOLVED,
    labelKey: 'CONVERSATION.KANBAN.STATUS_RESOLVED',
    color: 'bg-n-slate-9',
  },
];

// --- Filtered conversations (by assignee, inbox, search) ---
const filteredConversations = computed(() => {
  let result = allConversations.value || [];

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
      const lastMsg = (c.last_non_activity_message?.content || '').toLowerCase();
      return contactName.includes(query) || id.includes(query) || lastMsg.includes(query);
    });
  }

  return result;
});

const totalFilteredCount = computed(() => filteredConversations.value.length);

// --- Local mutable arrays per column (vuedraggable requires mutability) ---
const openConversations = ref([]);
const pendingConversations = ref([]);
const snoozedConversations = ref([]);
const resolvedConversations = ref([]);

const columnDataMap = {
  [STATUS_TYPE.OPEN]: openConversations,
  [STATUS_TYPE.PENDING]: pendingConversations,
  [STATUS_TYPE.SNOOZED]: snoozedConversations,
  [STATUS_TYPE.RESOLVED]: resolvedConversations,
};

// Sort helper
const sortComparator = (a, b) => {
  if (sortKey.value === SORT_BY_TYPE.CREATED_AT_DESC) {
    return (b.created_at || 0) - (a.created_at || 0);
  }
  if (sortKey.value === SORT_BY_TYPE.PRIORITY_DESC) {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  }
  // Default: last_activity_at_desc
  return (b.timestamp || b.last_activity_at || 0) - (a.timestamp || a.last_activity_at || 0);
};

// Sync store → local arrays
const syncFromStore = () => {
  const grouped = { open: [], pending: [], snoozed: [], resolved: [] };
  filteredConversations.value.forEach(c => {
    const status = c.status || 'open';
    if (grouped[status]) grouped[status].push(c);
  });
  openConversations.value = grouped.open.sort(sortComparator);
  pendingConversations.value = grouped.pending.sort(sortComparator);
  snoozedConversations.value = grouped.snoozed.sort(sortComparator);
  resolvedConversations.value = grouped.resolved.sort(sortComparator);
};

// Watch for store changes and re-sync
watch(
  () => [filteredConversations.value, sortKey.value],
  () => syncFromStore(),
  { deep: true }
);

// --- Drag & drop handler ---
const onColumnChange = async ({ conversation, newStatus }) => {
  if (!conversation || conversation.status === newStatus) return;

  // Snoozed requires a snooze duration
  if (newStatus === STATUS_TYPE.SNOOZED) {
    pendingSnoozeConversation.value = conversation;
    showSnoozeModal.value = true;
    // Revert optimistic move — will re-sync after modal action
    syncFromStore();
    return;
  }

  // Optimistic: already moved by vuedraggable
  try {
    await store.dispatch('toggleStatus', {
      conversationId: conversation.id,
      status: newStatus,
    });
  } catch {
    // Revert on failure
    syncFromStore();
  }
};

// Snooze confirmation
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

// Provide context menu actions for child components (matching ChatList pattern)
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

// --- Assignee / Sort / Search / Inbox change handlers ---
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
      @change-assignee="onChangeAssignee"
      @change-sort="onChangeSort"
      @update-search="onUpdateSearch"
      @change-inbox="onChangeInbox"
    />

    <main class="flex-grow overflow-x-auto overflow-y-hidden">
      <div class="flex gap-4 h-full pb-4">
        <KanbanColumn
          v-for="col in columns"
          :key="col.key"
          :title="t(col.labelKey)"
          :status-key="col.key"
          :conversations="columnDataMap[col.key].value"
          :loading="loading"
          :color="col.color"
          @update:conversations="val => (columnDataMap[col.key].value = val)"
          @change="onColumnChange"
          @open-context-menu="openCardContextMenu"
        />
      </div>
    </main>

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
