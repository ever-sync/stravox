# frozen_string_literal: true

class AddPipelineStageToConversations < ActiveRecord::Migration[7.0]
  def change
    add_column :conversations, :pipeline_stage_id, :bigint
    add_index :conversations, :pipeline_stage_id
  end
end
