import { computed } from 'vue';
import { useCaptainResponsesStore } from 'dashboard/stores/captainResponses';
import { usePiniaVuexStoreBridge } from 'dashboard/composables/usePiniaVuexStoreBridge';

export function useCaptainResponses() {
  const captainResponsesStore = useCaptainResponsesStore();
  const {
    records: responses,
    meta: responseMeta,
    uiFlags: responsesUIFlags,
    isFetchingList: isFetchingResponses,
    runAndMarkLoaded,
  } = usePiniaVuexStoreBridge({
    namespace: 'captainResponses',
    piniaStore: captainResponsesStore,
    useVuexFallback: false,
  });

  const pendingCount = computed(
    () => captainResponsesStore.getPendingCount || 0
  );

  const fetchResponses = async params => {
    return runAndMarkLoaded(() => captainResponsesStore.get(params));
  };

  const createResponse = async payload => {
    return runAndMarkLoaded(() => captainResponsesStore.create(payload));
  };

  const updateResponse = async payload => {
    return runAndMarkLoaded(() => captainResponsesStore.update(payload));
  };

  const deleteResponse = async id => {
    return runAndMarkLoaded(() => captainResponsesStore.delete(id));
  };

  const fetchPendingCount = async assistantId => {
    return runAndMarkLoaded(() =>
      captainResponsesStore.fetchPendingCount(assistantId)
    );
  };

  const removeBulkResponses = ids => {
    captainResponsesStore.removeBulkResponses(ids);
  };

  const updateBulkResponses = approvedResponses => {
    captainResponsesStore.updateBulkResponses(approvedResponses);
  };

  return {
    captainResponsesStore,
    responses,
    responseMeta,
    responsesUIFlags,
    isFetchingResponses,
    pendingCount,
    fetchResponses,
    createResponse,
    updateResponse,
    deleteResponse,
    fetchPendingCount,
    removeBulkResponses,
    updateBulkResponses,
  };
}
