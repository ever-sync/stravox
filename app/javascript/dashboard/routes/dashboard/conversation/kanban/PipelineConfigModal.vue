<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMapGetter } from 'dashboard/composables/store';
import ColorPicker from 'dashboard/components/widgets/ColorPicker.vue';
import Draggable from 'vuedraggable';

const props = defineProps({
  show: { type: Boolean, default: false },
  pipelines: { type: Array, default: () => [] },
  activePipelineId: { type: String, default: 'default' },
});

const emit = defineEmits(['close', 'save']);
const { t } = useI18n();

// Local copy of pipelines for editing
const localPipelines = ref([]);
const selectedPipelineId = ref('');
const confirmDelete = ref(false);

watch(
  () => props.show,
  show => {
    if (show) {
      localPipelines.value = JSON.parse(JSON.stringify(props.pipelines));
      selectedPipelineId.value = props.activePipelineId || localPipelines.value[0]?.id || '';
      confirmDelete.value = false;
    }
  },
  { immediate: true }
);

const selectedPipeline = computed(() =>
  localPipelines.value.find(p => p.id === selectedPipelineId.value)
);

const generateId = () => `stage_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const addStage = () => {
  if (!selectedPipeline.value) return;
  const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#10B981', '#06B6D4', '#F97316'];
  const color = colors[selectedPipeline.value.stages.length % colors.length];
  selectedPipeline.value.stages.push({
    id: generateId(),
    name: '',
    color,
  });
  nextTick(() => {
    const inputs = document.querySelectorAll('.stage-name-input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });
};

const removeStage = index => {
  if (!selectedPipeline.value) return;
  if (selectedPipeline.value.stages.length <= 1) return;
  selectedPipeline.value.stages.splice(index, 1);
};

const addPipeline = () => {
  const id = `pipeline_${Date.now()}`;
  localPipelines.value.push({
    id,
    name: '',
    stages: [
      { id: generateId(), name: 'Novo Lead', color: '#3B82F6' },
      { id: generateId(), name: 'Qualificado', color: '#8B5CF6' },
      { id: generateId(), name: 'Proposta', color: '#F59E0B' },
    ],
  });
  selectedPipelineId.value = id;
  nextTick(() => {
    const input = document.querySelector('.pipeline-name-input');
    if (input) input.focus();
  });
};

const deletePipeline = () => {
  if (localPipelines.value.length <= 1) return;
  if (!confirmDelete.value) {
    confirmDelete.value = true;
    return;
  }
  const idx = localPipelines.value.findIndex(p => p.id === selectedPipelineId.value);
  if (idx !== -1) {
    localPipelines.value.splice(idx, 1);
    selectedPipelineId.value = localPipelines.value[0]?.id || '';
  }
  confirmDelete.value = false;
};

const onSave = () => {
  // Validate: remove stages with empty names, set default name
  localPipelines.value.forEach(p => {
    if (!p.name) p.name = 'Pipeline sem nome';
    p.stages = p.stages.filter(s => s.name.trim());
    if (p.stages.length === 0) {
      p.stages.push({ id: generateId(), name: 'Etapa 1', color: '#3B82F6' });
    }
  });
  emit('save', localPipelines.value, selectedPipelineId.value);
};

const onClose = () => emit('close');
</script>

<template>
  <teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="onClose" />

      <!-- Modal -->
      <div class="relative bg-n-background border border-n-weak rounded-2xl shadow-2xl w-[720px] max-w-[95vw] max-h-[85vh] flex overflow-hidden z-10">
        <!-- Sidebar: Pipeline list -->
        <div class="w-52 border-r border-n-weak bg-n-alpha-1/50 flex flex-col">
          <div class="px-3 py-3 border-b border-n-weak">
            <h3 class="text-sm font-semibold text-n-slate-12">
              {{ t('CONVERSATION.PIPELINE.CONFIG_TITLE') }}
            </h3>
          </div>
          <div class="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              v-for="p in localPipelines"
              :key="p.id"
              class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all"
              :class="
                selectedPipelineId === p.id
                  ? 'bg-n-violet-3/30 text-n-violet-11 border border-n-violet-7/30'
                  : 'text-n-slate-11 hover:bg-n-alpha-2'
              "
              @click="selectedPipelineId = p.id; confirmDelete = false"
            >
              {{ p.name || 'Sem nome' }}
              <span class="block text-xxs text-n-slate-9 mt-0.5">
                {{ p.stages.length }} {{ t('CONVERSATION.PIPELINE.CONFIG_STAGES').toLowerCase() }}
              </span>
            </button>
          </div>
          <div class="p-2 border-t border-n-weak">
            <button
              class="w-full px-3 py-2 text-xs font-medium text-n-violet-11 bg-n-violet-3/20 rounded-lg hover:bg-n-violet-3/40 transition-colors flex items-center justify-center gap-1.5"
              @click="addPipeline"
            >
              <fluent-icon icon="add" size="14" />
              {{ t('CONVERSATION.PIPELINE.CONFIG_NEW') }}
            </button>
          </div>
        </div>

        <!-- Main: Pipeline editor -->
        <div class="flex-1 flex flex-col min-w-0">
          <div v-if="selectedPipeline" class="flex-1 overflow-y-auto p-5">
            <!-- Pipeline name -->
            <div class="mb-5">
              <label class="block text-xs font-medium text-n-slate-10 mb-1.5">
                {{ t('CONVERSATION.PIPELINE.CONFIG_NAME') }}
              </label>
              <input
                v-model="selectedPipeline.name"
                type="text"
                class="pipeline-name-input w-full bg-n-alpha-1 border border-n-weak rounded-lg px-3 py-2 text-sm text-n-slate-12 placeholder:text-n-slate-9 focus:outline-none focus:ring-2 focus:ring-n-violet-7/30 focus:border-n-violet-7"
                placeholder="Ex: Pipeline de Vendas"
              />
            </div>

            <!-- Stages -->
            <div>
              <label class="block text-xs font-medium text-n-slate-10 mb-2">
                {{ t('CONVERSATION.PIPELINE.CONFIG_STAGES') }}
              </label>
              <Draggable
                v-model="selectedPipeline.stages"
                item-key="id"
                handle=".drag-handle"
                :animation="200"
                class="space-y-2"
              >
                <template #item="{ element, index }">
                  <div class="flex items-center gap-2 p-2 bg-n-alpha-1 rounded-lg border border-n-weak group">
                    <!-- Drag handle -->
                    <div class="drag-handle cursor-grab active:cursor-grabbing text-n-slate-9 hover:text-n-slate-11">
                      <fluent-icon icon="re-order-dots-vertical" size="16" />
                    </div>

                    <!-- Color picker -->
                    <div class="relative flex-shrink-0">
                      <div
                        class="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer"
                        :style="{ backgroundColor: element.color }"
                      />
                      <input
                        v-model="element.color"
                        type="color"
                        class="absolute inset-0 w-6 h-6 opacity-0 cursor-pointer"
                      />
                    </div>

                    <!-- Stage name -->
                    <input
                      v-model="element.name"
                      type="text"
                      class="stage-name-input flex-1 bg-transparent border-none text-sm text-n-slate-12 placeholder:text-n-slate-9 focus:outline-none"
                      :placeholder="`Etapa ${index + 1}`"
                    />

                    <!-- Remove button -->
                    <button
                      v-if="selectedPipeline.stages.length > 1"
                      class="p-1 rounded text-n-slate-9 hover:text-n-ruby-9 hover:bg-n-ruby-3/20 opacity-0 group-hover:opacity-100 transition-all"
                      @click="removeStage(index)"
                    >
                      <fluent-icon icon="delete" size="14" />
                    </button>
                  </div>
                </template>
              </Draggable>

              <!-- Add stage button -->
              <button
                class="mt-2 w-full px-3 py-2 text-xs font-medium text-n-slate-11 border border-dashed border-n-weak rounded-lg hover:bg-n-alpha-1 hover:border-n-slate-7 transition-all flex items-center justify-center gap-1.5"
                @click="addStage"
              >
                <fluent-icon icon="add" size="14" />
                {{ t('CONVERSATION.PIPELINE.CONFIG_ADD_STAGE') }}
              </button>
            </div>

            <!-- Delete pipeline -->
            <div v-if="localPipelines.length > 1" class="mt-6 pt-4 border-t border-n-weak">
              <button
                class="px-3 py-2 text-xs font-medium rounded-lg transition-all"
                :class="
                  confirmDelete
                    ? 'bg-n-ruby-9 text-white'
                    : 'text-n-ruby-9 hover:bg-n-ruby-3/20'
                "
                @click="deletePipeline"
              >
                {{ confirmDelete ? 'Confirmar exclusão?' : t('CONVERSATION.PIPELINE.CONFIG_DELETE') }}
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-n-weak">
            <button
              class="px-4 py-2 text-sm font-medium text-n-slate-11 bg-n-alpha-1 border border-n-weak rounded-lg hover:bg-n-alpha-2 transition-colors"
              @click="onClose"
            >
              {{ t('CONVERSATION.PIPELINE.CANCEL') }}
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-n-violet-9 rounded-lg hover:bg-n-violet-10 transition-colors shadow-sm"
              @click="onSave"
            >
              {{ t('CONVERSATION.PIPELINE.CONFIG_SAVE') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
