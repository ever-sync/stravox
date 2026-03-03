<script>
import { mapGetters } from 'vuex';
import { emitter } from 'shared/helpers/mitt';
import { BUS_EVENTS } from 'shared/constants/busEvents';
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
      isSaving: false,
    };
  },
  computed: {
    ...mapGetters({
      currentChat: 'getSelectedChat',
      localPipelines: 'pipelines/getPipelines',
      pipelinesInitialized: 'pipelines/getPipelinesInitialized',
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
        this.filteredStages.find(s => s.id === String(this.selectedStageId)) ||
        null
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
  mounted() {
    if (this.pipelinesInitialized && this.localPipelines.length) return;
    this.$store.dispatch('pipelines/fetchPipelines');
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
    async onStageChange(stage) {
      if (!stage || stage.id === this.selectedStageId) return;
      const previousStageId = this.selectedStageId;
      this.selectedStageId = stage.id;
      this.isSaving = true;
      try {
        await this.$store.dispatch('updateCustomAttributes', {
          conversationId: this.conversationId,
          customAttributes: {
            pipeline_stage: stage.id,
            pipeline_id: this.selectedPipelineId,
          },
        });
        this.$emit('update', stage);
      } catch {
        emitter.emit(BUS_EVENTS.SHOW_TOAST, {
          message: this.$t('CONVERSATION_SIDEBAR.PIPELINE_STAGE_UPDATE_ERROR'),
        });
        this.selectedStageId = previousStageId;
      } finally {
        this.isSaving = false;
      }
    },
    async removeFromPipeline() {
      this.isSaving = true;
      try {
        await this.$store.dispatch('updateCustomAttributes', {
          conversationId: this.conversationId,
          customAttributes: {
            pipeline_stage: null,
            pipeline_id: null,
          },
        });
        this.selectedPipelineId = null;
        this.selectedStageId = null;
        this.$emit('update', null);
      } catch {
        emitter.emit(BUS_EVENTS.SHOW_TOAST, {
          message: this.$t('CONVERSATION_SIDEBAR.PIPELINE_REMOVE_ERROR'),
        });
      } finally {
        this.isSaving = false;
      }
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
    <div v-if="selectedPipelineId" class="multiselect-wrap--small mt-1">
      <button
        class="text-xs text-n-ruby-9 hover:text-n-ruby-11 hover:underline disabled:opacity-50 flex items-center gap-1 transition-colors"
        :disabled="isSaving"
        @click="removeFromPipeline"
      >
        <fluent-icon icon="dismiss" size="12" />
        {{ $t('CONVERSATION_SIDEBAR.PIPELINE_REMOVE') }}
      </button>
    </div>
  </div>
</template>
