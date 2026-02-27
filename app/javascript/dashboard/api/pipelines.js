/* global axios */
import ApiClient from './ApiClient';

class PipelinesAPI extends ApiClient {
  constructor() {
    super('pipelines', { accountScoped: true });
  }

  list() {
    return axios.get(this.url);
  }

  create(pipelineData) {
    return axios.post(this.url, { pipeline: pipelineData });
  }

  update(pipelineId, pipelineData) {
    return axios.patch(`${this.url}/${pipelineId}`, { pipeline: pipelineData });
  }

  deletePipeline(pipelineId) {
    return axios.delete(`${this.url}/${pipelineId}`);
  }

  createStage(pipelineId, stageData) {
    return axios.post(`${this.url}/${pipelineId}/pipeline_stages`, {
      pipeline_stage: stageData,
    });
  }

  updateStage(pipelineId, stageId, stageData) {
    return axios.patch(
      `${this.url}/${pipelineId}/pipeline_stages/${stageId}`,
      { pipeline_stage: stageData }
    );
  }

  deleteStage(pipelineId, stageId) {
    return axios.delete(`${this.url}/${pipelineId}/pipeline_stages/${stageId}`);
  }
}

export default new PipelinesAPI();
