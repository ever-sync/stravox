<script setup>
import { onMounted, ref, nextTick } from 'vue';
import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import { useCaptainCustomTools } from 'dashboard/composables/useCaptainCustomTools';

import PageLayout from 'dashboard/components-next/captain/PageLayout.vue';
import CaptainPaywall from 'dashboard/components-next/captain/pageComponents/Paywall.vue';
import CustomToolsPageEmptyState from 'dashboard/components-next/captain/pageComponents/emptyStates/CustomToolsPageEmptyState.vue';
import CreateCustomToolDialog from 'dashboard/components-next/captain/pageComponents/customTool/CreateCustomToolDialog.vue';
import CustomToolCard from 'dashboard/components-next/captain/pageComponents/customTool/CustomToolCard.vue';
import DeleteDialog from 'dashboard/components-next/captain/pageComponents/DeleteDialog.vue';

const {
  customTools,
  customToolsMeta,
  isFetchingCustomTools,
  fetchCustomTools,
  deleteCustomTool,
} = useCaptainCustomTools();

const createDialogRef = ref(null);
const deleteDialogRef = ref(null);
const selectedTool = ref(null);
const dialogType = ref('');

const fetchCustomToolsPage = page => fetchCustomTools({ page });

const onPageChange = page => fetchCustomToolsPage(page);

const openCreateDialog = () => {
  dialogType.value = 'create';
  selectedTool.value = null;
  nextTick(() => createDialogRef.value.dialogRef.open());
};

const handleEdit = tool => {
  dialogType.value = 'edit';
  selectedTool.value = tool;
  nextTick(() => createDialogRef.value.dialogRef.open());
};

const handleDelete = tool => {
  selectedTool.value = tool;
  nextTick(() => deleteDialogRef.value.dialogRef.open());
};

const handleAction = ({ action, id }) => {
  const tool = customTools.value.find(t => t.id === id);
  if (action === 'edit') {
    handleEdit(tool);
  } else if (action === 'delete') {
    handleDelete(tool);
  }
};

const handleDialogClose = () => {
  dialogType.value = '';
  selectedTool.value = null;
};

const onDeleteSuccess = () => {
  selectedTool.value = null;
  const isLastToolOnPage = (customTools.value?.length || 0) <= 1;
  const currentPage = customToolsMeta.value?.page || 1;
  const targetPage =
    isLastToolOnPage && currentPage > 1 ? currentPage - 1 : currentPage;

  fetchCustomToolsPage(targetPage);
};

onMounted(() => {
  fetchCustomToolsPage(1);
});
</script>

<template>
  <PageLayout
    :header-title="$t('CAPTAIN.CUSTOM_TOOLS.HEADER')"
    :button-label="$t('CAPTAIN.CUSTOM_TOOLS.ADD_NEW')"
    :button-policy="['administrator']"
    :total-count="customToolsMeta.totalCount"
    :current-page="customToolsMeta.page"
    :show-pagination-footer="!isFetchingCustomTools && !!customTools.length"
    :is-fetching="isFetchingCustomTools"
    :is-empty="!customTools.length"
    :feature-flag="FEATURE_FLAGS.CAPTAIN_V2"
    :show-know-more="false"
    @update:current-page="onPageChange"
    @click="openCreateDialog"
  >
    <template #paywall>
      <CaptainPaywall />
    </template>

    <template #emptyState>
      <CustomToolsPageEmptyState @click="openCreateDialog" />
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <CustomToolCard
          v-for="tool in customTools"
          :id="tool.id"
          :key="tool.id"
          :title="tool.title"
          :description="tool.description"
          :endpoint-url="tool.endpoint_url"
          :http-method="tool.http_method"
          :auth-type="tool.auth_type"
          :param-schema="tool.param_schema"
          :enabled="tool.enabled"
          :created-at="tool.created_at"
          :updated-at="tool.updated_at"
          @action="handleAction"
        />
      </div>
    </template>
  </PageLayout>

  <CreateCustomToolDialog
    v-if="dialogType"
    ref="createDialogRef"
    :type="dialogType"
    :selected-tool="selectedTool"
    @close="handleDialogClose"
  />

  <DeleteDialog
    v-if="selectedTool"
    ref="deleteDialogRef"
    :entity="selectedTool"
    type="CustomTools"
    translation-key="CUSTOM_TOOLS"
    :delete-action="deleteCustomTool"
    @delete-success="onDeleteSuccess"
  />
</template>
