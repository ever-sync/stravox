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
    pipelineStageId: {
      type: Number,
      default: null,
    },
  },
  emits: ['update'],
  data() {
    return {
      selectedPipelineId: null,
    };
  },
  computed: {
    ...mapGetters({
      pipelines: 'pipelines/getPipelines',
      allStages: 'pipelines/getAllStages',
      accountId: 'getCurrentAccountId',
    }),
    selectedPipeline() {
      if (!this.selectedPipelineId) return null;
      return this.pipelines.find(p => p.id === this.selectedPipelineId) || null;
    },
    filteredStages() {
      if (!this.selectedPipelineId) return [];
      return this.allStages.filter(
        s => s.pipeline_id === this.selectedPipelineId
      );
    },
    selectedStage() {
      return (
        this.allStages.find(stage => stage.id === this.pipelineStageId) || null
      );
    },
  },
  watch: {
    pipelineStageId: {
      handler(newVal) {
        if (newVal) {
          const stage = this.allStages.find(s => s.id === newVal);
          if (stage) {
            this.selectedPipelineId = stage.pipeline_id;
          }
        }
      },
      immediate: true,
    },
    allStages: {
      handler() {
        if (this.pipelineStageId && !this.selectedPipelineId) {
          const stage = this.allStages.find(s => s.id === this.pipelineStageId);
          if (stage) {
            this.selectedPipelineId = stage.pipeline_id;
          }
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.$store.dispatch('pipelines/get');
  },
  methods: {
    findKanbanStageId(stageName) {
      try {
        const storageKey = `cw-pipelines-${this.accountId}`;
        const raw = localStorage.getItem(storageKey);
        if (!raw) return null;
        const data = JSON.parse(raw);
        const kanbanPipelines = data.pipelines || [];
        let result = null;
        kanbanPipelines.some(pipeline => {
          const match = (pipeline.stages || []).find(
            s => s.name.toLowerCase() === stageName.toLowerCase()
          );
          if (match) {
            result = { stageId: match.id, pipelineId: pipeline.id };
            return true;
          }
          return false;
        });
        return result;
      } catch {
        // ignore
      }
      return null;
    },
    onPipelineChange(pipeline) {
      if (!pipeline) return;
      this.selectedPipelineId = pipeline.id;
    },
    onPipelineStageChange(stage) {
      const stageId = stage ? stage.id : null;
      if (stageId === this.pipelineStageId) return;

      this.$store
        .dispatch('updateConversation', {
          conversationId: this.conversationId,
          pipeline_stage_id: stageId,
        })
        .then(() => {
          this.$emit('update', stage);
          if (stage) {
            const kanbanMatch = this.findKanbanStageId(stage.name);
            if (kanbanMatch) {
              this.$store.dispatch('updateCustomAttributes', {
                conversationId: this.conversationId,
                customAttributes: {
                  pipeline_stage: kanbanMatch.stageId,
                  pipeline_id: kanbanMatch.pipelineId,
                },
              });
            }
          }
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
        :options="pipelines"
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
        @select="onPipelineStageChange"
      />
    </div>
  </div>
</template>
