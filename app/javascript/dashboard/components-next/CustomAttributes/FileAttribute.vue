<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useStore } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import Button from 'dashboard/components-next/button/Button.vue';
import Spinner from 'shared/components/Spinner.vue';
import CustomAttributeFilesAPI from 'dashboard/api/customAttributeFiles';

const props = defineProps({
  attribute: {
    type: Object,
    required: true,
  },
  isEditingView: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update', 'delete']);

const { t } = useI18n();
const route = useRoute();
const store = useStore();
const isUploading = ref(false);

const fileValue = computed(() => {
  const val = props.attribute.value;
  if (val && typeof val === 'object' && val.file_id) return val;
  return null;
});

const hasFile = computed(() => !!fileValue.value);

const accountId = computed(() => store.getters.getCurrentAccountId);

const entityContext = computed(() => {
  if (route.params.contactId) {
    return { entityType: 'contact', entityId: route.params.contactId };
  }
  const chat = store.getters.getSelectedChat;
  if (chat?.id) {
    return { entityType: 'conversation', entityId: chat.id };
  }
  return null;
});

const onFileSelect = async event => {
  const file = event.target.files[0];
  if (!file || !entityContext.value) return;

  isUploading.value = true;
  try {
    const response = await CustomAttributeFilesAPI.upload({
      ...entityContext.value,
      accountId: accountId.value,
      attributeKey: props.attribute.attributeKey,
      file,
    });

    emit('update', {
      file_id: response.data.id,
      filename: response.data.filename,
      content_type: response.data.content_type,
      byte_size: response.data.byte_size,
    });

    useAlert(t('CONTACTS_LAYOUT.SIDEBAR.ATTRIBUTES.FILE.UPLOAD_SUCCESS'));
  } catch {
    useAlert(t('CONTACTS_LAYOUT.SIDEBAR.ATTRIBUTES.FILE.UPLOAD_ERROR'));
  } finally {
    isUploading.value = false;
  }
};

const onDownload = async () => {
  if (!fileValue.value || !entityContext.value) return;

  try {
    const response = await CustomAttributeFilesAPI.show({
      ...entityContext.value,
      accountId: accountId.value,
      fileId: fileValue.value.file_id,
    });
    if (response.data.download_url) {
      window.open(response.data.download_url, '_blank');
    }
  } catch {
    useAlert(t('CONTACTS_LAYOUT.SIDEBAR.ATTRIBUTES.FILE.UPLOAD_ERROR'));
  }
};

const formatFileSize = bytes => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
</script>

<template>
  <div
    class="flex items-center w-full min-w-0 gap-2"
    :class="{
      'justify-start': isEditingView,
      'justify-end': !isEditingView,
    }"
  >
    <!-- File attached: show name + size -->
    <div v-if="hasFile" class="flex items-center min-w-0 gap-1.5">
      <span
        class="text-sm truncate cursor-pointer text-n-blue-11 hover:underline"
        :title="fileValue.filename"
        @click="onDownload"
      >
        {{ fileValue.filename }}
      </span>
      <span
        v-if="fileValue.byte_size"
        class="text-xs text-n-slate-10 whitespace-nowrap"
      >
        ({{ formatFileSize(fileValue.byte_size) }})
      </span>
    </div>

    <!-- No file: upload prompt -->
    <label
      v-if="!hasFile"
      class="flex items-center gap-1.5 cursor-pointer min-w-0"
    >
      <input
        type="file"
        class="hidden"
        :disabled="isUploading"
        @change="onFileSelect"
      />
      <Spinner v-if="isUploading" size="tiny" />
      <span
        v-else
        class="text-sm text-n-slate-11 hover:text-n-slate-12 font-medium"
      >
        {{ t('CONTACTS_LAYOUT.SIDEBAR.ATTRIBUTES.FILE.CHOOSE_FILE') }}
      </span>
    </label>

    <!-- Edit actions -->
    <div v-if="isEditingView" class="flex items-center gap-1">
      <label v-if="hasFile" class="flex-shrink-0">
        <input
          type="file"
          class="hidden"
          :disabled="isUploading"
          @change="onFileSelect"
        />
        <Button
          variant="faded"
          color="slate"
          icon="i-lucide-upload"
          size="xs"
          as="span"
          class="opacity-0 group-hover/attribute:opacity-100 cursor-pointer"
        />
      </label>
      <Button
        variant="faded"
        color="ruby"
        icon="i-lucide-trash"
        size="xs"
        class="flex-shrink-0 opacity-0 group-hover/attribute:opacity-100"
        @click="emit('delete')"
      />
    </div>
  </div>
</template>
