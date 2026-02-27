import { useCaptainToolsStore } from 'dashboard/stores/captainTools';
import { usePiniaVuexStoreBridge } from 'dashboard/composables/usePiniaVuexStoreBridge';

export function useCaptainTools() {
  const captainToolsStore = useCaptainToolsStore();
  const {
    records: tools,
    isFetchingList: isFetchingTools,
    isPiniaLoaded,
    piniaUIFlags,
    runAndMarkLoaded,
  } = usePiniaVuexStoreBridge({
    namespace: 'captainTools',
    piniaStore: captainToolsStore,
    useVuexFallback: false,
  });

  const ensureToolsLoaded = async ({ force = false } = {}) => {
    if (!force) {
      if (isPiniaLoaded.value) {
        return captainToolsStore.getRecords;
      }
      if (piniaUIFlags.value.fetchingList) {
        return captainToolsStore.getRecords;
      }
    }
    return runAndMarkLoaded(() => captainToolsStore.getTools());
  };

  return {
    tools,
    isFetchingTools,
    ensureToolsLoaded,
    captainToolsStore,
  };
}
