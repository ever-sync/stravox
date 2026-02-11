<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMapGetter } from 'dashboard/composables/store';
import { useStore } from 'vuex';
import { frontendURL, conversationUrl } from 'dashboard/helper/URLHelper';
import Avatar from 'next/avatar/Avatar.vue';
import InboxName from 'dashboard/components/widgets/InboxName.vue';

const props = defineProps({
  conversation: { type: Object, required: true },
});

const router = useRouter();
const store = useStore();
const accountId = useMapGetter('getCurrentAccountId');
const activeInbox = useMapGetter('getSelectedInbox');

const contact = computed(() => {
  const senderId = props.conversation.meta?.sender?.id;
  return senderId
    ? store.getters['contacts/getContact'](senderId)
    : props.conversation.meta?.sender || {};
});

const inbox = computed(() => {
  const inboxId = props.conversation.inbox_id;
  return inboxId ? store.getters['inboxes/getInbox'](inboxId) : {};
});

const statusColorMap = {
  open: 'bg-n-teal-9',
  pending: 'bg-n-amber-9',
  snoozed: 'bg-n-violet-9',
  resolved: 'bg-n-slate-9',
};

const statusColor = computed(
  () => statusColorMap[props.conversation.status] || 'bg-n-slate-9'
);

const onClick = e => {
  const path = frontendURL(
    conversationUrl({
      accountId: accountId.value,
      activeInbox: activeInbox.value,
      id: props.conversation.id,
    })
  );
  if (e.metaKey || e.ctrlKey) {
    window.open(path, '_blank', 'noopener,noreferrer');
    return;
  }
  router.push({ path });
};
</script>

<template>
  <div
    class="flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-all duration-150 hover:bg-n-alpha-2 group"
    @click="onClick"
  >
    <span :class="statusColor" class="w-1.5 h-1.5 rounded-full flex-shrink-0" />
    <Avatar
      :name="contact.name"
      :src="contact.thumbnail"
      :size="20"
      rounded-full
    />
    <div class="min-w-0 flex-1">
      <p class="text-xs text-n-slate-12 truncate leading-tight">
        {{ contact.name || `#${conversation.id}` }}
      </p>
    </div>
    <InboxName :inbox="inbox" class="text-xxs hidden group-hover:block flex-shrink-0" />
  </div>
</template>
