import CaptainCustomToolsAPI from 'dashboard/api/captain/customTools';
import { createStore } from 'dashboard/store/storeFactory';

export const useCaptainCustomToolsStore = createStore({
  name: 'CaptainCustomTools',
  type: 'pinia',
  API: CaptainCustomToolsAPI,
});
