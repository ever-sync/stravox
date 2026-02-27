<script>
import { mapGetters } from 'vuex';
import ContactDetailsItem from 'dashboard/routes/dashboard/conversation/ContactDetailsItem.vue';
import MultiselectDropdown from 'shared/components/ui/MultiselectDropdown.vue';

export default {
  components: {
    ContactDetailsItem,
    MultiselectDropdown,
  },
  props: {
    conversationId: {
      type: [Number, String],
      required: true,
    },
  },
  emits: ['update'],
  data() {
    return {
      selectedPipelineId: null,
      selectedStageId: null,
    };
  },
  computed: {
    ...mapGetters({
      currentChat: 'getSelectedChat',
      localPipelines: 'pipelines/getPipelines',
    }),
    selectedPipeline() {
      if (!this.selectedPipelineId) return null;
      return (
        this.localPipelines.find(
          p => p.id === String(this.selectedPipelineId)
        ) || null
      );
    },
    filteredStages() {
      if (!this.selectedPipeline) return [];
      return this.selectedPipeline.stages.map(s => ({
        id: String(s.id),
        name: s.name,
        color: s.color,
      }));
    },
    selectedStage() {
      if (!this.selectedStageId) return null;
      return (
        this.filteredStages.find(
          s => s.id === String(this.selectedStageId)
        ) || null
      );
    },
    currentPipelineStage() {
      const attrs = this.currentChat?.custom_attributes || {};
      return attrs.pipeline_stage || null;
    },
    currentPipelineId() {
      const attrs = this.currentChat?.custom_attributes || {};
      return attrs.pipeline_id || null;
    },
  },
  watch: {
    currentChat: {
      handler() {
        this.syncFromConversation();
      },
      immediate: true,
    },
  },
  methods: {
    syncFromConversation() {
      if (this.currentPipelineId) {
        this.selectedPipelineId = String(this.currentPipelineId);
      }
      if (this.currentPipelineStage) {
        this.selectedStageId = String(this.currentPipelineStage);
      }
    },
    onPipelineChange(pipeline) {
      if (!pipeline) return;
      this.selectedPipelineId = pipeline.id;
      this.selectedStageId = null;
    },
    onStageChange(stage) {
      if (!stage || stage.id === this.selectedStageId) return;
      this.selectedStageId = stage.id;

      this.$store
        .dispatch('updateCustomAttributes', {
          conversationId: this.conversationId,
          customAttributes: {
            pipeline_stage: stage.id,
            pipeline_id: this.selectedPipelineId,
          },
        })
        .then(() => {
          this.$emit('update', stage);
        });
    },
  },
};
</script>

<template>
  <div>
    <div class="multiselect-wrap--small">
      <ContactDetailsItem
        compact
        :title="$t('CONVERSATION_SIDEBAR.PIPELINE_LABEL')"
      />
      <MultiselectDropdown
        :options="localPipelines"
        :selected-item="selectedPipeline"
        :multiselector-title="$t('CONVERSATION_SIDEBAR.PIPELINE_LABEL')"
        :multiselector-placeholder="$t('CONVERSATION_SIDEBAR.SELECT_PIPELINE')"
        :no-search-result="$t('CONVERSATION_SIDEBAR.NO_PIPELINE_RESULTS')"
        :input-placeholder="$t('CONVERSATION_SIDEBAR.SEARCH_PIPELINE')"
        @select="onPipelineChange"
      />
    </div>
    <div v-if="selectedPipelineId" class="multiselect-wrap--small">
      <ContactDetailsItem
        compact
        :title="$t('CONVERSATION_SIDEBAR.PIPELINE_STAGE_LABEL')"
      />
      <MultiselectDropdown
        :options="filteredStages"
        :selected-item="selectedStage"
        :multiselector-title="$t('CONVERSATION_SIDEBAR.PIPELINE_STAGE_LABEL')"
        :multiselector-placeholder="$t('CONVERSATION_SIDEBAR.SELECT_STAGE')"
        :no-search-result="$t('CONVERSATION_SIDEBAR.NO_STAGE_RESULTS')"
        :input-placeholder="$t('CONVERSATION_SIDEBAR.SEARCH_STAGE')"
        @select="onStageChange"
      />
    </div>
  </div>
</template>
