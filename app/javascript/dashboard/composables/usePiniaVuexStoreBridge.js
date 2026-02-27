import { computed } from 'vue';
import { useMapGetter } from 'dashboard/composables/store';

const hasActiveUIFlag = flags => Object.values(flags || {}).some(Boolean);

export function usePiniaVuexStoreBridge({
  namespace,
  piniaStore,
  useVuexFallback = true,
}) {
  const vuexRecords = useVuexFallback
    ? useMapGetter(`${namespace}/getRecords`)
    : null;
  const vuexMeta = useVuexFallback
    ? useMapGetter(`${namespace}/getMeta`)
    : null;
  const vuexUIFlags = useVuexFallback
    ? useMapGetter(`${namespace}/getUIFlags`)
    : null;

  const isPiniaLoaded = computed(() => !!piniaStore.meta?.loaded);
  const piniaUIFlags = computed(() => piniaStore.getUIFlags || {});

  const shouldUsePiniaState = computed(() => {
    if (!useVuexFallback) {
      return true;
    }

    if (isPiniaLoaded.value) {
      return true;
    }

    return hasActiveUIFlag(piniaUIFlags.value);
  });

  const records = computed(() => {
    if (shouldUsePiniaState.value) {
      return piniaStore.getRecords || [];
    }

    return vuexRecords?.value || [];
  });

  const meta = computed(() => {
    if (shouldUsePiniaState.value) {
      return piniaStore.getMeta || {};
    }

    return vuexMeta?.value || {};
  });

  const uiFlags = computed(() => {
    if (shouldUsePiniaState.value) {
      return piniaUIFlags.value;
    }

    return vuexUIFlags?.value || {};
  });

  const isFetchingList = computed(() => !!uiFlags.value.fetchingList);

  const markLoaded = () => {
    piniaStore.meta = {
      ...piniaStore.meta,
      loaded: true,
    };
  };

  const runAndMarkLoaded = async action => {
    const response = await action();
    markLoaded();
    return response;
  };

  return {
    records,
    meta,
    uiFlags,
    piniaUIFlags,
    isFetchingList,
    isPiniaLoaded,
    shouldUsePiniaState,
    markLoaded,
    runAndMarkLoaded,
  };
}
