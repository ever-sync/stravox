# frozen_string_literal: true

class Conversations::PipelineTransitionService
  def initialize(conversation:, pipeline_stage_id:, source: 'manual')
    @conversation = conversation
    @pipeline_stage_id = pipeline_stage_id
    @source = source
  end

  def perform
    stage = PipelineStage.find_by(id: @pipeline_stage_id)
    return unless stage

    @conversation.pipeline_stage_id = stage.id
    @conversation.custom_attributes = @conversation.custom_attributes.merge(
      'pipeline_stage' => stage.id.to_s,
      'pipeline_id' => stage.pipeline_id.to_s
    )
    @conversation.save!
  end
end
