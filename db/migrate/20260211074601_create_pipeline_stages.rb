# frozen_string_literal: true

class CreatePipelineStages < ActiveRecord::Migration[7.0]
  def change
    create_table :pipeline_stages do |t|
      t.string :name, null: false
      t.integer :position, default: 0, null: false
      t.bigint :pipeline_id, null: false
      t.string :color, default: '#1f93ff'
      
      t.timestamps
    end
    
    add_index :pipeline_stages, [:pipeline_id, :position]
    add_index :pipeline_stages, :pipeline_id
  end
end
