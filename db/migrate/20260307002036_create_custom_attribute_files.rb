# frozen_string_literal: true

class CreateCustomAttributeFiles < ActiveRecord::Migration[7.0]
  def change
    create_table :custom_attribute_files do |t|
      t.bigint :account_id, null: false
      t.string :attributable_type, null: false
      t.bigint :attributable_id, null: false
      t.string :attribute_key, null: false

      t.timestamps
    end

    add_index :custom_attribute_files, :account_id
    add_index :custom_attribute_files, %i[attributable_type attributable_id], name: 'idx_caf_attributable'
    add_index :custom_attribute_files, %i[attributable_type attributable_id attribute_key],
              unique: true, name: 'idx_caf_unique_key'
  end
end
