# frozen_string_literal: true

class Api::V1::Accounts::CustomAttributeFilesController < Api::V1::Accounts::BaseController
  before_action :find_attributable
  before_action :find_custom_attribute_file, only: %i[show destroy]

  def create
    ActiveRecord::Base.transaction do
      # Replace existing file for this attribute key (one file per key)
      existing = @attributable.custom_attribute_files.find_by(attribute_key: permitted_params[:attribute_key])
      existing&.destroy!

      @custom_attribute_file = @attributable.custom_attribute_files.new(
        account: Current.account,
        attribute_key: permitted_params[:attribute_key]
      )
      @custom_attribute_file.file.attach(permitted_params[:file])
      @custom_attribute_file.save!

      # Sync metadata into JSONB custom_attributes
      update_custom_attributes_jsonb(@custom_attribute_file)
    end

    render json: file_response(@custom_attribute_file), status: :ok
  end

  def show
    render json: file_response(@custom_attribute_file)
  end

  def destroy
    attribute_key = @custom_attribute_file.attribute_key

    ActiveRecord::Base.transaction do
      @custom_attribute_file.destroy!
      remove_from_custom_attributes_jsonb(attribute_key)
    end

    head :no_content
  end

  private

  def find_attributable
    if params[:contact_id].present?
      @attributable = Current.account.contacts.find(params[:contact_id])
    elsif params[:conversation_id].present?
      @attributable = Current.account.conversations.find_by!(display_id: params[:conversation_id])
    else
      render json: { error: 'Missing attributable' }, status: :unprocessable_entity
    end
  end

  def find_custom_attribute_file
    @custom_attribute_file = @attributable.custom_attribute_files
                                          .where(account: Current.account)
                                          .find(params[:id])
  end

  def permitted_params
    params.permit(:attribute_key, :file)
  end

  def update_custom_attributes_jsonb(caf)
    attrs = @attributable.custom_attributes || {}
    attrs[caf.attribute_key] = caf.metadata
    @attributable.update!(custom_attributes: attrs)
  end

  def remove_from_custom_attributes_jsonb(key)
    attrs = @attributable.custom_attributes || {}
    attrs.delete(key)
    @attributable.update!(custom_attributes: attrs)
  end

  def file_response(caf)
    {
      id: caf.id,
      attribute_key: caf.attribute_key,
      filename: caf.file.filename.to_s,
      content_type: caf.file.content_type,
      byte_size: caf.file.byte_size,
      download_url: caf.download_url,
      created_at: caf.created_at
    }
  end
end
