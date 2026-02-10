<script setup>
import { useI18n } from 'vue-i18n';
import wootConstants from 'dashboard/constants/globals';

const { ASSIGNEE_TYPE, SORT_BY_TYPE } = wootConstants;

const props = defineProps({
  activeAssigneeTab: { type: String, default: 'me' },
  activeSort: { type: String, default: 'last_activity_at_desc' },
  searchQuery: { type: String, default: '' },
  selectedInboxId: { type: [Number, String], default: '' },
  inboxes: { type: Array, default: () => [] },
  totalCount: { type: Number, default: 0 },
});

const emit = defineEmits([
  'changeAssignee',
  'changeSort',
  'updateSearch',
  'changeInbox',
]);

const { t } = useI18n();

const assigneeTabs = [
  { key: ASSIGNEE_TYPE.ME, label: 'CONVERSATION.KANBAN.FILTER_MINE' },
  { key: ASSIGNEE_TYPE.UNASSIGNED, label: 'CONVERSATION.KANBAN.FILTER_UNASSIGNED' },
  { key: ASSIGNEE_TYPE.ALL, label: 'CONVERSATION.KANBAN.FILTER_ALL' },
];

const sortOptions = [
  { key: SORT_BY_TYPE.LAST_ACTIVITY_AT_DESC, label: 'CONVERSATION.KANBAN.SORT_LATEST' },
  { key: SORT_BY_TYPE.CREATED_AT_DESC, label: 'CONVERSATION.KANBAN.SORT_CREATED' },
  { key: SORT_BY_TYPE.PRIORITY_DESC, label: 'CONVERSATION.KANBAN.SORT_PRIORITY' },
];

const onChangeAssignee = key => emit('changeAssignee', key);
const onChangeSort = e => emit('changeSort', e.target.value);
const onSearchInput = e => emit('updateSearch', e.target.value);
const onChangeInbox = e => emit('changeInbox', e.target.value);
</script>

<template>
  <header class="flex flex-col gap-3 mb-4">
    <!-- Top row: Title + Controls -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <!-- Title + Count -->
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-semibold text-n-slate-12">
          {{ t('CONVERSATION.KANBAN.TITLE') }}
        </h1>
        <span
          v-if="totalCount > 0"
          class="text-sm font-medium text-n-slate-10 bg-n-alpha-2 rounded-full px-2.5 py-0.5"
        >
          {{ totalCount }}
        </span>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Search -->
        <div class="relative">
          <fluent-icon
            icon="search"
            size="14"
            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-n-slate-10"
          />
          <input
            type="text"
            :value="searchQuery"
            :placeholder="t('CONVERSATION.KANBAN.SEARCH_PLACEHOLDER')"
            class="bg-n-alpha-1 border border-n-weak rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-n-slate-12 placeholder:text-n-slate-9 w-52 focus:outline-none focus:ring-2 focus:ring-n-violet-7/30 focus:border-n-violet-7 transition-all"
            @input="onSearchInput"
          />
        </div>

        <!-- Inbox filter -->
        <div class="relative">
          <select
            :value="selectedInboxId"
            class="appearance-none bg-n-alpha-1 border border-n-weak rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-n-slate-11 cursor-pointer hover:border-n-slate-7 focus:outline-none focus:ring-2 focus:ring-n-violet-7/30"
            @change="onChangeInbox"
          >
            <option value="">
              {{ t('CONVERSATION.KANBAN.FILTER_INBOX') }}
            </option>
            <option
              v-for="inbox in inboxes"
              :key="inbox.id"
              :value="inbox.id"
            >
              {{ inbox.name }}
            </option>
          </select>
          <fluent-icon
            icon="chevron-down"
            size="12"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-n-slate-10 pointer-events-none"
          />
        </div>

        <!-- Assignee tabs -->
        <div class="flex items-center bg-n-alpha-1 rounded-lg border border-n-weak p-0.5">
          <button
            v-for="tab in assigneeTabs"
            :key="tab.key"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150"
            :class="
              activeAssigneeTab === tab.key
                ? 'bg-n-background text-n-slate-12 shadow-sm'
                : 'text-n-slate-10 hover:text-n-slate-12'
            "
            @click="onChangeAssignee(tab.key)"
          >
            {{ t(tab.label) }}
          </button>
        </div>

        <!-- Sort dropdown -->
        <div class="relative">
          <select
            :value="activeSort"
            class="appearance-none bg-n-alpha-1 border border-n-weak rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-n-slate-11 cursor-pointer hover:border-n-slate-7 focus:outline-none focus:ring-2 focus:ring-n-violet-7/30"
            @change="onChangeSort"
          >
            <option
              v-for="opt in sortOptions"
              :key="opt.key"
              :value="opt.key"
            >
              {{ t(opt.label) }}
            </option>
          </select>
          <fluent-icon
            icon="chevron-down"
            size="12"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-n-slate-10 pointer-events-none"
          />
        </div>
      </div>
    </div>
  </header>
</template>
