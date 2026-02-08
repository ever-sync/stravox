<script setup>
import { useI18n } from 'vue-i18n';
import wootConstants from 'dashboard/constants/globals';

const { ASSIGNEE_TYPE, SORT_BY_TYPE } = wootConstants;

const props = defineProps({
  activeAssigneeTab: { type: String, default: 'me' },
  activeSort: { type: String, default: 'last_activity_at_desc' },
});

const emit = defineEmits(['changeAssignee', 'changeSort']);

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
</script>

<template>
  <header class="flex items-center justify-between gap-4 mb-4 flex-wrap">
    <!-- Title -->
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-semibold text-n-slate-12">
        {{ t('CONVERSATION.KANBAN.TITLE') }}
      </h1>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-3">
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
  </header>
</template>
