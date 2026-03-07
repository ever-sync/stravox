/* global axios */

const buildUrl = (entityType, entityId, accountId) => {
  const base = `/api/v1/accounts/${accountId}`;
  if (entityType === 'contact') {
    return `${base}/contacts/${entityId}/custom_attribute_files`;
  }
  return `${base}/conversations/${entityId}/custom_attribute_files`;
};

export default {
  upload({ entityType, entityId, accountId, attributeKey, file }) {
    const formData = new FormData();
    formData.append('attribute_key', attributeKey);
    formData.append('file', file);
    return axios.post(buildUrl(entityType, entityId, accountId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  show({ entityType, entityId, accountId, fileId }) {
    return axios.get(`${buildUrl(entityType, entityId, accountId)}/${fileId}`);
  },

  delete({ entityType, entityId, accountId, fileId }) {
    return axios.delete(
      `${buildUrl(entityType, entityId, accountId)}/${fileId}`
    );
  },
};
