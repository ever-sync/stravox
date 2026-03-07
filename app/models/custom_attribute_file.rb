# frozen_string_literal: true

class CustomAttributeFile < ApplicationRecord
  belongs_to :account
  belongs_to :attributable, polymorphic: true

  has_one_attached :file

  validates :attribute_key, presence: true
  validates :attribute_key, uniqueness: { scope: %i[attributable_type attributable_id] }
  validate :acceptable_file

  # Returns the metadata hash to store in JSONB custom_attributes
  def metadata
    return {} unless file.attached?

    {
      'file_id' => id,
      'filename' => file.filename.to_s,
      'content_type' => file.content_type,
      'byte_size' => file.byte_size
    }
  end

  def file_url
    return '' unless file.attached?

    Rails.application.routes.url_helpers.url_for(file)
  end

  def download_url
    return '' unless file.attached?

    file.blob.url
  end

  private

  def acceptable_file
    return unless file.attached?

    limit = ENV.fetch('MAXIMUM_FILE_UPLOAD_SIZE', 40).to_i
    limit = 40 if limit <= 0
    errors.add(:file, "size exceeds #{limit}MB limit") if file.byte_size > limit.megabytes
  end
end
