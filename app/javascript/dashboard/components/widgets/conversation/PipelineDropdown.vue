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
        });
    },
  },
};
</script>

<template>
  <div class="multiselect-wrap--small">
    <ContactDetailsItem compact :title="$t('CONVERSATION_SIDEBAR.PIPELINE_LABEL')" />
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
