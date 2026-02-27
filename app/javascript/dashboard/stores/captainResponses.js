import CaptainResponseAPI from 'dashboard/api/captain/response';
import { createStore } from 'dashboard/store/storeFactory';

export const useCaptainResponsesStore = createStore({
  name: 'CaptainResponses',
  type: 'pinia',
  API: CaptainResponseAPI,
  getters: {
    getPendingCount: state => state.meta.pendingCount || 0,
  },
  actions: () => ({
    removeBulkResponses(ids = []) {
      this.records = this.records.filter(record => !ids.includes(record.id));
    },

    updateBulkResponses(approvedResponses = []) {
      const responseList = Array.isArray(approvedResponses)
        ? approvedResponses
        : approvedResponses?.payload || [];

      const updatedResponsesMap = responseList.reduce((map, response) => {
        map[response.id] = response;
        return map;
      }, {});

      this.records = this.records.map(record => {
        return updatedResponsesMap[record.id] || record;
      });
    },

    async fetchPendingCount(assistantId) {
      try {
        const response = await CaptainResponseAPI.get({
          status: 'pending',
          page: 1,
          assistantId,
        });
        const count = response.data?.meta?.total_count || 0;
        this.meta = {
          ...this.meta,
          pendingCount: Number(count),
        };
        return Number(count);
      } catch (error) {
        this.meta = {
          ...this.meta,
          pendingCount: 0,
        };
        return 0;
      }
    },
  }),
});
