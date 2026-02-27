import { useCaptainInboxesStore } from 'dashboard/stores/captainInboxes';
import { usePiniaVuexStoreBridge } from 'dashboard/composables/usePiniaVuexStoreBridge';

export function useCaptainInboxes() {
  const captainInboxesStore = useCaptainInboxesStore();
  const {
    records: captainInboxes,
    meta: captainInboxesMeta,
    uiFlags: captainInboxesUIFlags,
    isFetchingList: isFetchingCaptainInboxes,
    runAndMarkLoaded,
  } = usePiniaVuexStoreBridge({
    namespace: 'captainInboxes',
    piniaStore: captainInboxesStore,
    useVuexFallback: false,
  });

  const fetchCaptainInboxes = async params => {
    return runAndMarkLoaded(() => captainInboxesStore.get(params));
  };

  const createCaptainInbox = async payload => {
    return runAndMarkLoaded(() => captainInboxesStore.create(payload));
  };

  const deleteCaptainInbox = async payload => {
    return runAndMarkLoaded(() => captainInboxesStore.delete(payload));
  };

  return {
    captainInboxesStore,
    captainInboxes,
    captainInboxesMeta,
    captainInboxesUIFlags,
    isFetchingCaptainInboxes,
    fetchCaptainInboxes,
    createCaptainInbox,
    deleteCaptainInbox,
  };
}
