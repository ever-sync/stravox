# frozen_string_literal: true

module PipelineActivityMessageHandler
  extend ActiveSupport::Concern

  private

  def pipeline_stage_change_activity(user_name)
    old_id, new_id = previous_changes['pipeline_stage_id']
    user = Current.executed_by.instance_of?(AutomationRule) ? I18n.t('automation.system_name') : user_name

    old_stage = PipelineStage.find_by(id: old_id)
    new_stage = PipelineStage.find_by(id: new_id)

    change_type = determine_pipeline_change_type(old_stage, new_stage)
    return unless change_type

    content = I18n.t("conversations.activity.pipeline_stage.#{change_type}",
                     user_name: user,
                     old_stage: old_stage&.full_name,
                     new_stage: new_stage&.full_name)

    ::Conversations::ActivityMessageJob.perform_later(self, activity_message_params(content))
  end

  def determine_pipeline_change_type(old_stage, new_stage)
    case [old_stage.present?, new_stage.present?]
    when [false, true] then 'added'
    when [true, true]  then 'updated'
    when [true, false] then 'removed'
    end
  end
end
