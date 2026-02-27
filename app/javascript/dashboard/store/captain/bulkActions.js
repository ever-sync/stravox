import CaptainBulkActionsAPI from 'dashboard/api/captain/bulkActions';
import { createStore } from '../storeFactory';
import { throwErrorMessage } from 'dashboard/store/utils/api';
import { useCaptainResponsesStore } from 'dashboard/stores/captainResponses';

export default createStore({
  name: 'CaptainBulkAction',
  API: CaptainBulkActionsAPI,
  actions: mutations => ({
    processBulkAction: async function processBulkAction(
      { commit },
      { type, actionType, ids }
    ) {
      commit(mutations.SET_UI_FLAG, { isUpdating: true });
      try {
        const response = await CaptainBulkActionsAPI.create({
          type: type,
          ids,
          fields: { status: actionType },
        });
        commit(mutations.SET_UI_FLAG, { isUpdating: false });
        return response.data;
      } catch (error) {
        commit(mutations.SET_UI_FLAG, { isUpdating: false });
        return throwErrorMessage(error);
      }
    },

    handleBulkDelete: async function handleBulkDelete({ dispatch }, ids) {
      const response = await dispatch('processBulkAction', {
        type: 'AssistantResponse',
        actionType: 'delete',
        ids,
      });

      // Keep Captain responses (Pinia) in sync with the bulk API result.
      const captainResponsesStore = useCaptainResponsesStore();
      captainResponsesStore.removeBulkResponses(ids);
      return response;
    },

    handleBulkApprove: async function handleBulkApprove({ dispatch }, ids) {
      const response = await dispatch('processBulkAction', {
        type: 'AssistantResponse',
        actionType: 'approve',
        ids,
      });

      const captainResponsesStore = useCaptainResponsesStore();
      captainResponsesStore.updateBulkResponses(response);
      return response;
    },
  }),
});
