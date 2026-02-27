import CaptainScenariosAPI from 'dashboard/api/captain/scenarios';
import { createStore } from 'dashboard/store/storeFactory';
import { throwErrorMessage } from 'dashboard/store/utils/api';

export const useCaptainScenariosStore = createStore({
  name: 'CaptainScenarios',
  type: 'pinia',
  API: CaptainScenariosAPI,
  actions: () => ({
    async update({ id, assistantId, ...updateObj }) {
      this.setUIFlag({ updatingItem: true });
      try {
        const response = await CaptainScenariosAPI.update(
          { id, assistantId },
          updateObj
        );
        const record = response.data?.payload || response.data;
        const index = this.records.findIndex(item => item.id === record.id);

        if (index !== -1) {
          this.records[index] = record;
        }

        return record;
      } catch (error) {
        return throwErrorMessage(error);
      } finally {
        this.setUIFlag({ updatingItem: false });
      }
    },

    async delete({ id, assistantId }) {
      this.setUIFlag({ deletingItem: true });
      try {
        await CaptainScenariosAPI.delete({ id, assistantId });
        this.records = this.records.filter(item => item.id !== id);
        return id;
      } catch (error) {
        return throwErrorMessage(error);
      } finally {
        this.setUIFlag({ deletingItem: false });
      }
    },
  }),
});
