/* global axios */
import ApiClient from './ApiClient';

class PipelinesAPI extends ApiClient {
  constructor() {
    super('pipelines', { accountScoped: true });
  }

  createStage(pipelineId, stageData) {
    return axios.post(`${this.url}/${pipelineId}/pipeline_stages`, stageData);
  }

  updateStage(pipelineId, stageId, stageData) {
    return axios.patch(
      `${this.url}/${pipelineId}/pipeline_stages/${stageId}`,
      stageData
    );
  }

  deleteStage(pipelineId, stageId) {
    return axios.delete(`${this.url}/${pipelineId}/pipeline_stages/${stageId}`);
  }
}

export default new PipelinesAPI();
