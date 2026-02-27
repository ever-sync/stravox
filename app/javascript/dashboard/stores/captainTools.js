import CaptainToolsAPI from 'dashboard/api/captain/tools';
import { createStore } from 'dashboard/store/storeFactory';
import { throwErrorMessage } from 'dashboard/store/utils/api';

export const useCaptainToolsStore = createStore({
  name: 'CaptainTools',
  type: 'pinia',
  API: CaptainToolsAPI,
  actions: () => ({
    async getTools() {
      this.setUIFlag({ fetchingList: true });
      try {
        const response = await CaptainToolsAPI.get();
        this.records = response.data;
        this.meta = { ...this.meta, loaded: true };
        return response.data;
      } catch (error) {
        return throwErrorMessage(error);
      } finally {
        this.setUIFlag({ fetchingList: false });
      }
    },
  }),
});
