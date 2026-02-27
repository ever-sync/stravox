import CaptainDocumentAPI from 'dashboard/api/captain/document';
import { createStore } from 'dashboard/store/storeFactory';

export const useCaptainDocumentsStore = createStore({
  name: 'CaptainDocuments',
  type: 'pinia',
  API: CaptainDocumentAPI,
});
