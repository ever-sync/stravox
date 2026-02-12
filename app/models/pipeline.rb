# == Schema Information
#
# Table name: pipelines
#
#  id          :bigint           not null, primary key
#  name        :string           not null
#  description :text
#  position    :integer          default(0), not null
#  color       :string           default("#1f93ff")
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  account_id  :bigint           not null
#
# Indexes
#
#  index_pipelines_on_account_id           (account_id)
#  index_pipelines_on_account_id_and_name  (account_id,name) UNIQUE
#  index_pipelines_on_position             (position)
#

class Pipeline < ApplicationRecord
  belongs_to :account
  has_many :pipeline_stages, dependent: :destroy
  has_many :conversations, through: :pipeline_stages
  
  validates :name, presence: true
  validates :name, uniqueness: { scope: :account_id }
  validates :account_id, presence: true
  validates :color, format: { with: /\A#[0-9A-F]{6}\z/i }, allow_blank: true
  
  scope :ordered, -> { order(position: :asc) }
  
  after_create :create_default_stages
  
  private
  
  def create_default_stages
    return if pipeline_stages.any?
    
    default_stages = [
      { name: 'Novo', position: 0, color: '#4A90E2' },
      { name: 'Em Atendimento', position: 1, color: '#F5A623' },
      { name: 'Qualificado', position: 2, color: '#7ED321' },
      { name: 'Proposta Enviada', position: 3, color: '#9013FE' },
      { name: 'Negociação', position: 4, color: '#BD10E0' },
      { name: 'Fechado', position: 5, color: '#50E3C2' }
    ]
    
    default_stages.each do |stage_attrs|
      pipeline_stages.create!(stage_attrs)
    end
  end
end
