import * as MutationHelpers from 'shared/helpers/vuex/mutationHelpers';
import * as types from '../mutation-types';
import PipelinesAPI from '../../api/pipelines';

export const state = {
  records: [],
  uiFlags: {
    isFetching: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  },
};

export const getters = {
  getPipelines(_state) {
    return _state.records;
  },
  getUIFlags(_state) {
    return _state.uiFlags;
  },
  getPipelineById: _state => id => {
    return _state.records.find(record => record.id === id);
  },
  getAllStages: _state => {
    const stages = [];
    _state.records.forEach(pipeline => {
      if (pipeline.stages) {
        pipeline.stages.forEach(stage => {
          stages.push({
            id: stage.id,
            name: stage.name,
            full_name: `${pipeline.name} - ${stage.name}`,
            pipeline_name: pipeline.name,
            pipeline_id: pipeline.id,
            color: stage.color,
            position: stage.position,
          });
        });
      }
    });
    return stages;
  },
};

export const actions = {
  get: async ({ commit }) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isFetching: true });
    try {
      const response = await PipelinesAPI.get();
      commit(types.default.SET_PIPELINES, response.data.payload);
    } catch (error) {
      // Handle error
    } finally {
      commit(types.default.SET_PIPELINES_UI_FLAG, { isFetching: false });
    }
  },

  create: async ({ commit }, pipelineObj) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isCreating: true });
    try {
      const response = await PipelinesAPI.create(pipelineObj);
      commit(types.default.ADD_PIPELINE, response.data);
      return response.data;
    } finally {
      commit(types.default.SET_PIPELINES_UI_FLAG, { isCreating: false });
    }
  },

  update: async ({ commit }, { id, ...updateObj }) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isUpdating: true });
    try {
      const response = await PipelinesAPI.update(id, updateObj);
      commit(types.default.EDIT_PIPELINE, response.data);
      return response.data;
    } finally {
      commit(types.default.SET_PIPELINES_UI_FLAG, { isUpdating: false });
    }
  },

  delete: async ({ commit }, id) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isDeleting: true });
    try {
      await PipelinesAPI.delete(id);
      commit(types.default.DELETE_PIPELINE, id);
    } finally {
      commit(types.default.SET_PIPELINES_UI_FLAG, { isDeleting: false });
    }
  },
};

export const mutations = {
  [types.default.SET_PIPELINES_UI_FLAG](_state, data) {
    _state.uiFlags = {
      ..._state.uiFlags,
      ...data,
    };
  },

  [types.default.SET_PIPELINES]: MutationHelpers.set,
  [types.default.ADD_PIPELINE]: MutationHelpers.create,
  [types.default.EDIT_PIPELINE]: MutationHelpers.update,
  [types.default.DELETE_PIPELINE]: MutationHelpers.destroy,
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
