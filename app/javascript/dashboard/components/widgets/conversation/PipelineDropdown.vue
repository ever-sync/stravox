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
  computed: {
    ...mapGetters({
      allStages: 'pipelines/getAllStages',
      accountId: 'getCurrentAccountId',
    }),
    selectedStage() {
      return (
        this.allStages.find(stage => stage.id === this.pipelineStageId) || null
      );
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
        const pipelines = data.pipelines || [];
        let result = null;
        pipelines.some(pipeline => {
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
  <div class="multiselect-wrap--small">
    <ContactDetailsItem
      compact
      :title="$t('CONVERSATION_SIDEBAR.PIPELINE_LABEL')"
    />
    <MultiselectDropdown
      :options="allStages"
      :selected-item="selectedStage"
      :multiselector-title="$t('CONVERSATION_SIDEBAR.PIPELINE_LABEL')"
      :multiselector-placeholder="$t('CONVERSATION_SIDEBAR.SELECT_PIPELINE')"
      :no-search-result="$t('CONVERSATION_SIDEBAR.NO_PIPELINE_RESULTS')"
      :input-placeholder="$t('CONVERSATION_SIDEBAR.SEARCH_PIPELINE')"
      @select="onPipelineStageChange"
    />
  </div>
</template>
