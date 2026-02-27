import CaptainInboxesAPI from 'dashboard/api/captain/inboxes';
import { createStore } from 'dashboard/store/storeFactory';
import { throwErrorMessage } from 'dashboard/store/utils/api';

export const useCaptainInboxesStore = createStore({
  name: 'CaptainInboxes',
  type: 'pinia',
  API: CaptainInboxesAPI,
  actions: () => ({
    async delete({ inboxId, assistantId }) {
      this.setUIFlag({ deletingItem: true });
      try {
        await CaptainInboxesAPI.delete({ inboxId, assistantId });
        this.records = this.records.filter(record => record.id !== inboxId);
        return inboxId;
      } catch (error) {
        return throwErrorMessage(error);
      } finally {
        this.setUIFlag({ deletingItem: false });
      }
    },
  }),
});
