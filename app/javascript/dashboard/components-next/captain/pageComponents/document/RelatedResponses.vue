<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCaptainResponses } from 'dashboard/composables/useCaptainResponses';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';
import Dialog from 'dashboard/components-next/dialog/Dialog.vue';
import ResponseCard from '../../assistant/ResponseCard.vue';
const props = defineProps({
  captainDocument: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['close']);
const { t } = useI18n();
const dialogRef = ref(null);
const { responses, responseMeta, isFetchingResponses, fetchResponses } =
  useCaptainResponses();
const isFetching = computed(() => isFetchingResponses.value);
const totalCount = computed(() => responseMeta.value.totalCount || 0);

const handleClose = () => {
  emit('close');
};

onMounted(() => {
  fetchResponses({
    assistantId: props.captainDocument.assistant.id,
    documentId: props.captainDocument.id,
  });
});
defineExpose({ dialogRef });
</script>

<template>
  <Dialog
    ref="dialogRef"
    type="edit"
    :title="`${t('CAPTAIN.DOCUMENTS.RELATED_RESPONSES.TITLE')} (${totalCount})`"
    :description="t('CAPTAIN.DOCUMENTS.RELATED_RESPONSES.DESCRIPTION')"
    :show-cancel-button="false"
    :show-confirm-button="false"
    overflow-y-auto
    width="3xl"
    @close="handleClose"
  >
    <div
      v-if="isFetching"
      class="flex items-center justify-center py-10 text-n-slate-11"
    >
      <Spinner />
    </div>
    <div v-else class="flex flex-col gap-3 min-h-48">
      <ResponseCard
        v-for="response in responses"
        :id="response.id"
        :key="response.id"
        :question="response.question"
        :status="response.status"
        :answer="response.answer"
        :assistant="response.assistant"
        :created-at="response.created_at"
        :updated-at="response.updated_at"
        compact
      />
    </div>
  </Dialog>
</template>
