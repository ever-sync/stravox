class Api::V1::Accounts::PipelineStagesController < Api::V1::Accounts::BaseController
  before_action :fetch_pipeline
  before_action :fetch_pipeline_stage, only: [:show, :update, :destroy]
  
  def index
    @pipeline_stages = @pipeline.pipeline_stages.ordered
  end
  
  def show; end
  
  def create
    @pipeline_stage = @pipeline.pipeline_stages.create!(pipeline_stage_params)
  end
  
  def update
    @pipeline_stage.update!(pipeline_stage_params)
  end
  
  def destroy
    @pipeline_stage.destroy!
    head :ok
  end
  
  private
  
  def fetch_pipeline
    @pipeline = Current.account.pipelines.find(params[:pipeline_id])
  end
  
  def fetch_pipeline_stage
    @pipeline_stage = @pipeline.pipeline_stages.find(params[:id])
  end
  
  def pipeline_stage_params
    params.require(:pipeline_stage).permit(:name, :position, :color)
  end
end
