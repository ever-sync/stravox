<script>
import { mapGetters } from 'vuex';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';

export default {
  components: {
    Spinner,
  },
  props: {
    emptyStateMessage: {
      type: String,
      default: '',
    },
  },
  computed: {
    ...mapGetters({
      uiFlags: 'notifications/getUIFlags',
    }),
    emptyMessage() {
      if (this.emptyStateMessage) {
        return this.emptyStateMessage;
      }
      return this.$t('INBOX.LIST.NOTE');
    },
  },
};
</script>

<template>
  <div
    class="hidden h-full w-full items-center justify-center bg-gradient-to-br from-n-slate-1 via-white to-n-alpha-1 text-center lg:flex"
  >
    <div v-if="uiFlags.isFetching" class="flex justify-center my-4">
      <Spinner class="text-n-brand" />
    </div>
    <div
      v-else
      class="flex flex-col items-center gap-3 rounded-[28px] border border-n-weak/70 bg-white/80 px-10 py-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
    >
      <span class="flex h-16 w-16 items-center justify-center rounded-full bg-n-alpha-2">
        <fluent-icon icon="mail-inbox" size="40" class="text-n-slate-11" />
      </span>
      <span class="text-sm font-semibold text-n-slate-12">
        {{ emptyMessage }}
      </span>
    </div>
  </div>
</template>
