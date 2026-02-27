import * as MutationHelpers from 'shared/helpers/vuex/mutationHelpers';
import * as types from '../mutation-types';
import PipelinesAPI from '../../api/pipelines';

const toFrontend = pipeline => ({
  id: String(pipeline.id),
  _backendId: pipeline.id,
  name: pipeline.name,
  stages: (pipeline.stages || [])
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((s, i) => ({
      id: String(s.id),
      _backendId: s.id,
      name: s.name,
      color: s.color || '#3B82F6',
      position: s.position != null ? s.position : i,
    })),
});

const ACTIVE_KEY = accountId => 'cw-active-pipeline-' + accountId;
const LEGACY_KEY = accountId => 'cw-pipelines-' + accountId;

export const state = {
  records: [],
  activePipelineId: null,
  initialized: false,
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
  getPipelinesInitialized(_state) {
    return _state.initialized;
  },
  getPipelineById: _state => id => {
    return _state.records.find(record => record.id === String(id));
  },
  getActivePipelineId(_state) {
    return (
      _state.activePipelineId ||
      (_state.records[0] && _state.records[0].id) ||
      null
    );
  },
  getActivePipeline(_state, g) {
    const activeId = g.getActivePipelineId;
    return (
      _state.records.find(p => p.id === activeId) || _state.records[0] || null
    );
  },
  getAllStages: _state => {
    const stages = [];
    _state.records.forEach(pipeline => {
      (pipeline.stages || []).forEach(stage => {
        stages.push({
          id: stage.id,
          name: stage.name,
          full_name: pipeline.name + ' - ' + stage.name,
          pipeline_name: pipeline.name,
          pipeline_id: pipeline.id,
          color: stage.color,
          position: stage.position,
        });
      });
    });
    return stages;
  },
};

export const actions = {
  // Legacy — kept for automation settings backward compat
  get: async ({ commit }) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isFetching: true });
    try {
      const response = await PipelinesAPI.list();
      const normalized = (
        (response.data && response.data.payload) ||
        []
      ).map(toFrontend);
      commit(types.default.SET_PIPELINES, normalized);
    } catch (error) {
      // noop
    } finally {
      commit(types.default.SET_PIPELINES_UI_FLAG, { isFetching: false });
    }
  },

  // Full fetch: loads from backend, migrates localStorage on first run, creates default if needed
  fetchPipelines: async ({ commit, rootGetters }) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isFetching: true });
    try {
      const accountId = rootGetters['getCurrentAccountId'];
      const savedActiveId = localStorage.getItem(ACTIVE_KEY(accountId));
      const response = await PipelinesAPI.list();
      let backendPipelines =
        (response.data && response.data.payload) || [];

      if (backendPipelines.length === 0) {
        let migrated = false;
        try {
          const raw = localStorage.getItem(LEGACY_KEY(accountId));
          if (raw) {
            const legacyData = JSON.parse(raw);
            if (legacyData.pipelines && legacyData.pipelines.length) {
              for (const lp of legacyData.pipelines) {
                await PipelinesAPI.create({
                  name: lp.name || 'Pipeline de Vendas',
                  position: 0,
                });
              }
              migrated = true;
            }
          }
        } catch (e) {
          // ignore migration errors
        }
        if (!migrated) {
          await PipelinesAPI.create({ name: 'Pipeline de Vendas', position: 0 });
        }
        const fresh = await PipelinesAPI.list();
        backendPipelines = (fresh.data && fresh.data.payload) || [];
      }

      const normalized = backendPipelines.map(toFrontend);
      commit(types.default.SET_PIPELINES, normalized);
      const activeId =
        savedActiveId && normalized.find(p => p.id === savedActiveId)
          ? savedActiveId
          : (normalized[0] && normalized[0].id) || null;
      commit('SET_ACTIVE_PIPELINE_ID', activeId);
      commit('SET_PIPELINES_INITIALIZED', true);
    } catch (e) {
      // Fall back to legacy localStorage
      const accountId = rootGetters['getCurrentAccountId'];
      try {
        const raw = localStorage.getItem(LEGACY_KEY(accountId));
        if (raw) {
          const legacyData = JSON.parse(raw);
          if (legacyData.pipelines && legacyData.pipelines.length) {
            commit(types.default.SET_PIPELINES, legacyData.pipelines);
            const activeId =
              legacyData.activePipelineId ||
              (legacyData.pipelines[0] && legacyData.pipelines[0].id) ||
              null;
            commit('SET_ACTIVE_PIPELINE_ID', activeId);
          }
        }
      } catch (e2) {
        // ignore
      }
      commit('SET_PIPELINES_INITIALIZED', true);
    } finally {
      commit(types.default.SET_PIPELINES_UI_FLAG, { isFetching: false });
    }
  },

  setActivePipeline: ({ commit, rootGetters }, pipelineId) => {
    commit('SET_ACTIVE_PIPELINE_ID', pipelineId);
    const accountId = rootGetters['getCurrentAccountId'];
    localStorage.setItem(ACTIVE_KEY(accountId), pipelineId);
  },

  savePipelineConfig: async (
    { commit, state: s, rootGetters },
    { pipelines, activePipelineId }
  ) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isUpdating: true });
    try {
      const accountId = rootGetters['getCurrentAccountId'];
      const existing = s.records;

      for (const pipeline of pipelines) {
        if (pipeline._backendId) {
          await PipelinesAPI.update(pipeline._backendId, { name: pipeline.name });
          const existingPipeline = existing.find(ep => ep.id === pipeline.id);
          const existingStages =
            (existingPipeline && existingPipeline.stages) || [];
          const newStages = pipeline.stages;

          for (let i = 0; i < newStages.length; i++) {
            const stage = newStages[i];
            if (stage._backendId) {
              await PipelinesAPI.updateStage(
                pipeline._backendId,
                stage._backendId,
                { name: stage.name, color: stage.color, position: i }
              );
            } else {
              await PipelinesAPI.createStage(pipeline._backendId, {
                name: stage.name,
                color: stage.color,
                position: i,
              });
            }
          }
          for (const es of existingStages) {
            if (!newStages.find(ns => ns.id === es.id)) {
              await PipelinesAPI.deleteStage(
                pipeline._backendId,
                es._backendId
              );
            }
          }
        } else {
          const createRes = await PipelinesAPI.create({
            name: pipeline.name,
            position: existing.length,
          });
          const newBackendId = createRes.data && createRes.data.id;
          if (newBackendId) {
            const listRes = await PipelinesAPI.list();
            const created = (
              (listRes.data && listRes.data.payload) || []
            ).find(p => p.id === newBackendId);
            const autoStages = (created && created.stages) || [];
            const wantedStages = pipeline.stages;
            for (
              let i = 0;
              i < Math.min(autoStages.length, wantedStages.length);
              i++
            ) {
              await PipelinesAPI.updateStage(newBackendId, autoStages[i].id, {
                name: wantedStages[i].name,
                color: wantedStages[i].color,
                position: i,
              });
            }
            for (let i = autoStages.length; i < wantedStages.length; i++) {
              await PipelinesAPI.createStage(newBackendId, {
                name: wantedStages[i].name,
                color: wantedStages[i].color,
                position: i,
              });
            }
            for (let i = wantedStages.length; i < autoStages.length; i++) {
              await PipelinesAPI.deleteStage(newBackendId, autoStages[i].id);
            }
          }
        }
      }

      for (const ep of existing) {
        if (!pipelines.find(p => p.id === ep.id)) {
          await PipelinesAPI.deletePipeline(ep._backendId);
        }
      }

      const freshRes = await PipelinesAPI.list();
      const normalized = (
        (freshRes.data && freshRes.data.payload) || []
      ).map(toFrontend);
      commit(types.default.SET_PIPELINES, normalized);

      let newActiveId = (normalized[0] && normalized[0].id) || null;
      if (activePipelineId) {
        const match = normalized.find(
          p =>
            p.id === activePipelineId ||
            p._backendId === Number(activePipelineId)
        );
        if (match) newActiveId = match.id;
      }
      commit('SET_ACTIVE_PIPELINE_ID', newActiveId);
      localStorage.setItem(ACTIVE_KEY(accountId), newActiveId);
    } finally {
      commit(types.default.SET_PIPELINES_UI_FLAG, { isUpdating: false });
    }
  },

  create: async ({ commit }, pipelineObj) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isCreating: true });
    try {
      const response = await PipelinesAPI.create(pipelineObj);
      commit(types.default.ADD_PIPELINE, toFrontend(response.data));
      return response.data;
    } finally {
      commit(types.default.SET_PIPELINES_UI_FLAG, { isCreating: false });
    }
  },

  update: async ({ commit }, { id, ...updateObj }) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isUpdating: true });
    try {
      const response = await PipelinesAPI.update(id, updateObj);
      commit(types.default.EDIT_PIPELINE, toFrontend(response.data));
      return response.data;
    } finally {
      commit(types.default.SET_PIPELINES_UI_FLAG, { isUpdating: false });
    }
  },

  delete: async ({ commit }, id) => {
    commit(types.default.SET_PIPELINES_UI_FLAG, { isDeleting: true });
    try {
      await PipelinesAPI.deletePipeline(id);
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
  SET_ACTIVE_PIPELINE_ID(_state, id) {
    _state.activePipelineId = id;
  },
  SET_PIPELINES_INITIALIZED(_state, val) {
    _state.initialized = val;
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
