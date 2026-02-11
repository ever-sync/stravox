<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { getLastMessage } from 'dashboard/helper/conversationHelper';
import { frontendURL, conversationUrl } from 'dashboard/helper/URLHelper';
import Avatar from 'next/avatar/Avatar.vue';
import MessagePreview from 'dashboard/components/widgets/conversation/MessagePreview.vue';
import InboxName from 'dashboard/components/widgets/InboxName.vue';
import TimeAgo from 'dashboard/components/ui/TimeAgo.vue';
import CardLabels from 'dashboard/components/widgets/conversation/conversationCardComponents/CardLabels.vue';
import PriorityMark from 'dashboard/components/widgets/conversation/PriorityMark.vue';

const props = defineProps({
  chat: { type: Object, required: true },
  showAssignee: { type: Boolean, default: true },
});

const emit = defineEmits(['openContextMenu']);

const { t } = useI18n();
const router = useRouter();
const store = useStore();

const accountId = useMapGetter('getCurrentAccountId');
const activeInbox = useMapGetter('getSelectedInbox');

const chatMetadata = computed(() => props.chat.meta || {});
const assignee = computed(() => chatMetadata.value.assignee || {});
const senderId = computed(() => chatMetadata.value.sender?.id);

const currentContact = computed(() => {
  return senderId.value
    ? store.getters['contacts/getContact'](senderId.value)
    : {};
});

const unreadCount = computed(() => props.chat.unread_count || 0);
const hasUnread = computed(() => unreadCount.value > 0);

const lastMessageInChat = computed(() => getLastMessage(props.chat));

const inbox = computed(() => {
  const inboxId = props.chat.inbox_id;
  return inboxId ? store.getters['inboxes/getInbox'](inboxId) : {};
});

const showLabelsSection = computed(
  () => props.chat.labels?.length > 0
);

// --- CRM Pipeline fields ---
const customAttrs = computed(() => props.chat.custom_attributes || {});
const dealValue = computed(() => customAttrs.value.deal_value || 0);
const temperature = computed(() => customAttrs.value.temperature || '');

const hasDealValue = computed(() => dealValue.value > 0);

const formattedDealValue = computed(() => {
  if (!hasDealValue.value) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dealValue.value);
});

const temperatureConfig = computed(() => {
  switch (temperature.value) {
    case 'hot':
      return {
        label: t('CONVERSATION.PIPELINE.TEMPERATURE_HOT'),
        icon: 'i-lucide-flame',
        gradient: 'from-red-500 to-orange-400',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-200 dark:border-red-800/40',
      };
    case 'warm':
      return {
        label: t('CONVERSATION.PIPELINE.TEMPERATURE_WARM'),
        icon: 'i-lucide-sun',
        gradient: 'from-amber-400 to-yellow-300',
        textColor: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        borderColor: 'border-amber-200 dark:border-amber-800/40',
      };
    case 'cold':
      return {
        label: t('CONVERSATION.PIPELINE.TEMPERATURE_COLD'),
        icon: 'i-lucide-snowflake',
        gradient: 'from-blue-400 to-cyan-300',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        borderColor: 'border-blue-200 dark:border-blue-800/40',
      };
    default:
      return null;
  }
});

const conversationPath = computed(() =>
  frontendURL(
    conversationUrl({
      accountId: accountId.value,
      activeInbox: activeInbox.value,
      id: props.chat.id,
    })
  )
);

const onCardClick = e => {
  const path = conversationPath.value;
  if (!path) return;
  if (e.metaKey || e.ctrlKey) {
    e.preventDefault();
    window.open(
      `${window.stravoxConfig.hostURL}${path}`,
      '_blank',
      'noopener,noreferrer'
    );
    return;
  }
  router.push({ path });
};

const onContextMenu = e => {
  e.preventDefault();
  emit('openContextMenu', e, props.chat);
};
</script>

<template>
  <div
    class="group relative flex flex-col gap-2 p-3 bg-n-background border border-n-weak rounded-xl shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-n-slate-7 hover:-translate-y-0.5"
    @click="onCardClick"
    @contextmenu="onContextMenu"
  >
    <!-- Temperature strip -->
    <div
      v-if="temperatureConfig"
      class="absolute top-0 left-0 w-full h-1 rounded-t-xl bg-gradient-to-r"
      :class="temperatureConfig.gradient"
    />

    <!-- Header: Contact + Time -->
    <div class="flex items-start justify-between gap-2 min-w-0">
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        <Avatar
          :name="currentContact.name"
          :src="currentContact.thumbnail"
          :size="32"
          :status="currentContact.availability_status"
          hide-offline-status
          rounded-full
        />
        <div class="min-w-0 flex-1">
          <h4
            class="text-sm text-n-slate-12 truncate leading-tight"
            :class="hasUnread ? 'font-semibold' : 'font-medium'"
          >
            {{ currentContact.name }}
          </h4>
          <span class="text-xxs text-n-slate-10 leading-tight">
            #{{ chat.id }}
          </span>
        </div>
      </div>
      <div class="flex flex-col items-end flex-shrink-0 gap-1">
        <TimeAgo
          :last-activity-timestamp="chat.timestamp"
          :created-at-timestamp="chat.created_at"
          class="text-xxs text-n-slate-10 whitespace-nowrap"
        />
        <span
          v-if="hasUnread"
          class="rounded-full text-xxs font-semibold h-4 leading-4 min-w-[1rem] px-1 text-center text-white bg-gradient-to-r from-n-teal-9 to-n-teal-8 shadow-sm"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </div>
    </div>

    <!-- Message preview -->
    <div class="min-w-0">
      <MessagePreview
        v-if="lastMessageInChat"
        :message="lastMessageInChat"
        class="text-xs leading-5 text-n-slate-11 line-clamp-2"
        :show-message-type="true"
      />
      <p v-else class="text-xs text-n-slate-10 italic">
        {{ t('CHAT_LIST.NO_MESSAGES') }}
      </p>
    </div>

    <!-- Labels -->
    <CardLabels
      v-if="showLabelsSection"
      :conversation-labels="chat.labels"
      class="mt-0"
    />

    <!-- Deal value + Temperature badge row -->
    <div
      v-if="hasDealValue || temperatureConfig"
      class="flex items-center justify-between gap-2"
    >
      <!-- Temperature badge -->
      <div
        v-if="temperatureConfig"
        class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-semibold border"
        :class="[temperatureConfig.bgColor, temperatureConfig.textColor, temperatureConfig.borderColor]"
      >
        <span :class="temperatureConfig.icon" class="text-xs" />
        {{ temperatureConfig.label }}
      </div>
      <div v-else />

      <!-- Deal value -->
      <span
        v-if="hasDealValue"
        class="text-sm font-bold text-n-green-11 whitespace-nowrap"
      >
        {{ formattedDealValue }}
      </span>
    </div>

    <!-- Footer: Inbox + Assignee + Priority -->
    <div class="flex items-center justify-between gap-1 pt-1.5 border-t border-n-weak/50">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <InboxName :inbox="inbox" class="text-xxs min-w-0 truncate" />
        <div
          v-if="showAssignee && assignee.name"
          class="flex items-center gap-0.5 text-xxs text-n-slate-11 truncate"
        >
          <fluent-icon icon="person" size="10" class="text-n-slate-10 flex-shrink-0" />
          <span class="truncate">{{ assignee.name }}</span>
        </div>
      </div>
      <PriorityMark :priority="chat.priority" class="flex-shrink-0" />
    </div>
  </div>
</template>
