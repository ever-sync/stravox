import { useCaptainDocumentsStore } from 'dashboard/stores/captainDocuments';
import { usePiniaVuexStoreBridge } from 'dashboard/composables/usePiniaVuexStoreBridge';

export function useCaptainDocuments() {
  const captainDocumentsStore = useCaptainDocumentsStore();
  const {
    records: documents,
    meta: documentsMeta,
    uiFlags: documentsUIFlags,
    isFetchingList: isFetchingDocuments,
    runAndMarkLoaded,
  } = usePiniaVuexStoreBridge({
    namespace: 'captainDocuments',
    piniaStore: captainDocumentsStore,
    useVuexFallback: false,
  });

  const fetchDocuments = async params => {
    return runAndMarkLoaded(() => captainDocumentsStore.get(params));
  };

  const createDocument = async payload => {
    return runAndMarkLoaded(() => captainDocumentsStore.create(payload));
  };

  const deleteDocument = async id => {
    return runAndMarkLoaded(() => captainDocumentsStore.delete(id));
  };

  return {
    captainDocumentsStore,
    documents,
    documentsMeta,
    documentsUIFlags,
    isFetchingDocuments,
    fetchDocuments,
    createDocument,
    deleteDocument,
  };
}
