<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { subDays, getUnixTime, startOfDay, endOfDay, format } from 'date-fns';
import Avatar from 'next/avatar/Avatar.vue';

const { t } = useI18n();
const store = useStore();

// --- State ---
const loading = ref(true);

// --- Store getters ---
const accountSummary = useMapGetter('reports/getAccountSummary');
const accountConversationMetric = useMapGetter('getAccountConversationMetric');
const agentConversationMetric = useMapGetter('getAgentConversationMetric');
const allConversations = useMapGetter('getAllConversations');
const inboxesList = useMapGetter('inboxes/getInboxes');
const agents = useMapGetter('agents/getAgents');

// --- KPI Cards ---
const kpiCards = computed(() => {
  const conversations = allConversations.value || [];
  const openCount = conversations.filter(c => c.status === 'open').length;
  const resolvedToday = conversations.filter(c => {
    if (c.status !== 'resolved') return false;
    const resolvedAt = c.last_activity_at || c.timestamp;
    if (!resolvedAt) return false;
    const date = new Date(resolvedAt * 1000);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }).length;
  const pendingCount = conversations.filter(c => c.status === 'pending').length;
  const snoozedCount = conversations.filter(c => c.status === 'snoozed').length;

  const metric = accountConversationMetric.value || {};

  return [
    {
      label: t('CONVERSATION.DASHBOARD.OPEN_CONVERSATIONS'),
      value: metric.open || openCount,
      icon: 'i-lucide-message-circle',
      color: 'text-n-teal-9',
      bgColor: 'bg-n-teal-3/30',
    },
    {
      label: t('CONVERSATION.DASHBOARD.RESOLVED_TODAY'),
      value: resolvedToday,
      icon: 'i-lucide-check-circle',
      color: 'text-n-green-9',
      bgColor: 'bg-n-green-3/30',
    },
    {
      label: 'Pending',
      value: metric.pending || pendingCount,
      icon: 'i-lucide-clock',
      color: 'text-n-amber-9',
      bgColor: 'bg-n-amber-3/30',
    },
    {
      label: 'Snoozed',
      value: metric.snoozed || snoozedCount,
      icon: 'i-lucide-bell-off',
      color: 'text-n-violet-9',
      bgColor: 'bg-n-violet-3/30',
    },
  ];
});

// --- Conversations by inbox ---
const conversationsByInbox = computed(() => {
  const conversations = allConversations.value || [];
  const inboxMap = {};
  conversations.forEach(c => {
    const inboxId = c.inbox_id;
    if (!inboxId) return;
    if (!inboxMap[inboxId]) inboxMap[inboxId] = { count: 0, inbox: null };
    inboxMap[inboxId].count++;
  });

  // Merge with inbox info
  const inboxList = inboxesList.value || [];
  return Object.entries(inboxMap)
    .map(([id, data]) => {
      const inbox = inboxList.find(i => i.id === Number(id)) || {};
      return {
        id: Number(id),
        name: inbox.name || `Inbox #${id}`,
        channelType: inbox.channel_type || '',
        count: data.count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});

const maxInboxCount = computed(() => {
  if (conversationsByInbox.value.length === 0) return 1;
  return Math.max(...conversationsByInbox.value.map(i => i.count));
});

// --- Agent performance ---
const agentMetrics = computed(() => {
  const metrics = agentConversationMetric.value || [];
  const agentList = agents.value || [];
  return metrics
    .map(m => {
      const agent = agentList.find(a => a.id === m.id) || {};
      return {
        ...m,
        name: agent.name || m.name || 'Unknown',
        thumbnail: agent.thumbnail,
        availabilityStatus: agent.availability_status,
      };
    })
    .sort((a, b) => (b.metric?.open || 0) - (a.metric?.open || 0))
    .slice(0, 10);
});

// --- Conversations by status (for pie-like display) ---
const statusBreakdown = computed(() => {
  const conversations = allConversations.value || [];
  const counts = { open: 0, pending: 0, snoozed: 0, resolved: 0 };
  conversations.forEach(c => {
    const s = c.status || 'open';
    if (counts[s] !== undefined) counts[s]++;
  });
  const total = conversations.length || 1;
  return [
    { label: 'Open', count: counts.open, pct: Math.round((counts.open / total) * 100), color: 'bg-n-teal-9' },
    { label: 'Pending', count: counts.pending, pct: Math.round((counts.pending / total) * 100), color: 'bg-n-amber-9' },
    { label: 'Snoozed', count: counts.snoozed, pct: Math.round((counts.snoozed / total) * 100), color: 'bg-n-violet-9' },
    { label: 'Resolved', count: counts.resolved, pct: Math.round((counts.resolved / total) * 100), color: 'bg-n-slate-9' },
  ];
});

const totalConversations = computed(() => (allConversations.value || []).length);

// --- Fetch data ---
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      store.dispatch('fetchAllConversations', {}),
      store.dispatch('fetchAccountConversationMetric', {}),
      store.dispatch('fetchAgentConversationMetric'),
      store.dispatch('agents/get'),
      store.dispatch('inboxes/get'),
    ]);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-full overflow-y-auto bg-n-background p-6 gap-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-n-slate-12">
        {{ t('CONVERSATION.DASHBOARD.TITLE') }}
      </h1>
    </header>

    <!-- KPI Cards -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(card, idx) in kpiCards"
        :key="idx"
        class="flex items-center gap-3 p-4 rounded-xl border border-n-weak bg-n-background transition-all duration-200 hover:shadow-md"
      >
        <div
          class="flex items-center justify-center w-10 h-10 rounded-lg"
          :class="card.bgColor"
        >
          <span :class="[card.icon, card.color]" class="text-lg" />
        </div>
        <div>
          <p class="text-2xl font-bold text-n-slate-12 leading-tight">
            <template v-if="loading">
              <span class="inline-block w-8 h-6 bg-n-alpha-3 rounded animate-pulse" />
            </template>
            <template v-else>{{ card.value }}</template>
          </p>
          <p class="text-xs text-n-slate-10 mt-0.5">{{ card.label }}</p>
        </div>
      </div>
    </section>

    <!-- Status breakdown bar -->
    <section class="rounded-xl border border-n-weak bg-n-background p-4">
      <h2 class="text-sm font-semibold text-n-slate-12 mb-3">
        Status ({{ totalConversations }})
      </h2>
      <!-- Stacked bar -->
      <div v-if="!loading" class="flex h-3 rounded-full overflow-hidden bg-n-alpha-2 mb-3">
        <div
          v-for="s in statusBreakdown"
          :key="s.label"
          :class="s.color"
          :style="{ width: `${s.pct}%` }"
          class="transition-all duration-300"
          :title="`${s.label}: ${s.count} (${s.pct}%)`"
        />
      </div>
      <div v-else class="h-3 rounded-full bg-n-alpha-3 animate-pulse mb-3" />
      <!-- Legend -->
      <div class="flex items-center gap-4 flex-wrap">
        <div
          v-for="s in statusBreakdown"
          :key="s.label"
          class="flex items-center gap-1.5"
        >
          <span :class="s.color" class="w-2.5 h-2.5 rounded-full" />
          <span class="text-xs text-n-slate-11">{{ s.label }}</span>
          <span class="text-xs font-semibold text-n-slate-12">{{ s.count }}</span>
          <span class="text-xxs text-n-slate-9">({{ s.pct }}%)</span>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Conversations by Inbox -->
      <section class="rounded-xl border border-n-weak bg-n-background p-4">
        <h2 class="text-sm font-semibold text-n-slate-12 mb-4">
          {{ t('CONVERSATION.DASHBOARD.BY_INBOX') }}
        </h2>
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="animate-pulse">
            <div class="h-3 bg-n-alpha-3 rounded w-1/3 mb-1" />
            <div class="h-5 bg-n-alpha-3 rounded w-full" />
          </div>
        </div>
        <div v-else-if="conversationsByInbox.length === 0" class="flex flex-col items-center py-8">
          <fluent-icon icon="inbox" size="32" class="text-n-slate-8 mb-2" />
          <p class="text-xs text-n-slate-10">{{ t('CONVERSATION.DASHBOARD.NO_DATA') }}</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="inbox in conversationsByInbox"
            :key="inbox.id"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-n-slate-11 truncate">{{ inbox.name }}</span>
              <span class="text-xs font-semibold text-n-slate-12">{{ inbox.count }}</span>
            </div>
            <div class="h-2 bg-n-alpha-2 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-n-violet-8 to-n-violet-9 rounded-full transition-all duration-500"
                :style="{ width: `${(inbox.count / maxInboxCount) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Agent Performance -->
      <section class="rounded-xl border border-n-weak bg-n-background p-4">
        <h2 class="text-sm font-semibold text-n-slate-12 mb-4">
          {{ t('CONVERSATION.DASHBOARD.AGENT_PERFORMANCE') }}
        </h2>
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="animate-pulse flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-n-alpha-3" />
            <div class="flex-1">
              <div class="h-3 bg-n-alpha-3 rounded w-1/2 mb-1" />
              <div class="h-2 bg-n-alpha-3 rounded w-1/4" />
            </div>
          </div>
        </div>
        <div v-else-if="agentMetrics.length === 0" class="flex flex-col items-center py-8">
          <fluent-icon icon="people" size="32" class="text-n-slate-8 mb-2" />
          <p class="text-xs text-n-slate-10">{{ t('CONVERSATION.DASHBOARD.NO_DATA') }}</p>
        </div>
        <div v-else class="space-y-2">
          <!-- Table header -->
          <div class="grid grid-cols-4 gap-2 px-2 pb-2 border-b border-n-weak">
            <span class="text-xxs font-semibold text-n-slate-10 uppercase col-span-2">
              {{ t('CONVERSATION.DASHBOARD.AGENT') }}
            </span>
            <span class="text-xxs font-semibold text-n-slate-10 uppercase text-center">
              {{ t('CONVERSATION.DASHBOARD.ACTIVE_CHATS') }}
            </span>
            <span class="text-xxs font-semibold text-n-slate-10 uppercase text-center">
              Status
            </span>
          </div>
          <!-- Agent rows -->
          <div
            v-for="agent in agentMetrics"
            :key="agent.id"
            class="grid grid-cols-4 gap-2 items-center px-2 py-1.5 rounded-lg hover:bg-n-alpha-1 transition-colors"
          >
            <div class="flex items-center gap-2 col-span-2 min-w-0">
              <Avatar
                :name="agent.name"
                :src="agent.thumbnail"
                :size="28"
                :status="agent.availabilityStatus"
                rounded-full
              />
              <span class="text-xs text-n-slate-12 truncate">{{ agent.name }}</span>
            </div>
            <span class="text-sm font-semibold text-n-slate-12 text-center">
              {{ agent.metric?.open || 0 }}
            </span>
            <div class="flex justify-center">
              <span
                class="px-2 py-0.5 rounded-full text-xxs font-medium"
                :class="
                  agent.availabilityStatus === 'online'
                    ? 'bg-n-green-3/30 text-n-green-11'
                    : agent.availabilityStatus === 'busy'
                      ? 'bg-n-ruby-3/30 text-n-ruby-11'
                      : 'bg-n-slate-3/30 text-n-slate-11'
                "
              >
                {{ agent.availabilityStatus || 'offline' }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
