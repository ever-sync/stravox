# frozen_string_literal: true

class CreatePipelines < ActiveRecord::Migration[7.0]
  def change
    create_table :pipelines do |t|
      t.string :name, null: false
      t.text :description
      t.integer :position, default: 0, null: false
      t.bigint :account_id, null: false
      t.string :color, default: '#1f93ff'
      
      t.timestamps
    end
    
    add_index :pipelines, [:account_id, :name], unique: true
    add_index :pipelines, :account_id
    add_index :pipelines, :position
  end
end
