import { useCaptainCustomToolsStore } from 'dashboard/stores/captainCustomTools';
import { usePiniaVuexStoreBridge } from 'dashboard/composables/usePiniaVuexStoreBridge';

export function useCaptainCustomTools() {
  const captainCustomToolsStore = useCaptainCustomToolsStore();
  const {
    records: customTools,
    meta: customToolsMeta,
    uiFlags: customToolsUIFlags,
    isFetchingList: isFetchingCustomTools,
    runAndMarkLoaded,
  } = usePiniaVuexStoreBridge({
    namespace: 'captainCustomTools',
    piniaStore: captainCustomToolsStore,
    useVuexFallback: false,
  });

  const fetchCustomTools = async params => {
    return runAndMarkLoaded(() => captainCustomToolsStore.get(params));
  };

  const createCustomTool = async payload => {
    return runAndMarkLoaded(() => captainCustomToolsStore.create(payload));
  };

  const updateCustomTool = async payload => {
    return runAndMarkLoaded(() => captainCustomToolsStore.update(payload));
  };

  const deleteCustomTool = async id => {
    return runAndMarkLoaded(() => captainCustomToolsStore.delete(id));
  };

  return {
    captainCustomToolsStore,
    customTools,
    customToolsMeta,
    customToolsUIFlags,
    isFetchingCustomTools,
    fetchCustomTools,
    createCustomTool,
    updateCustomTool,
    deleteCustomTool,
  };
}
