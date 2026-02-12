# == Schema Information
#
# Table name: pipeline_stages
#
#  id          :bigint           not null, primary key
#  name        :string           not null
#  position    :integer          default(0), not null
#  color       :string           default('#1f93ff')
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  pipeline_id :bigint           not null
#
# Indexes
#
#  index_pipeline_stages_on_pipeline_id               (pipeline_id)
#  index_pipeline_stages_on_pipeline_id_and_position  (pipeline_id,position)
#

# frozen_string_literal: true

class PipelineStage < ApplicationRecord
  belongs_to :pipeline
  has_many :conversations, dependent: :nullify
  
  validates :name, presence: true
  validates :position, presence: true
  validates :pipeline_id, presence: true
  validates :color, format: { with: /\A#[0-9A-F]{6}\z/i }, allow_blank: true
  
  scope :ordered, -> { order(position: :asc) }
  
  delegate :account, to: :pipeline
  
  def full_name
    "#{pipeline.name} - #{name}"
  end
end
