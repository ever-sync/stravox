import { useCaptainScenariosStore } from 'dashboard/stores/captainScenarios';
import { usePiniaVuexStoreBridge } from 'dashboard/composables/usePiniaVuexStoreBridge';

export function useCaptainScenarios() {
  const captainScenariosStore = useCaptainScenariosStore();
  const {
    records: scenarios,
    meta: scenariosMeta,
    uiFlags: scenariosUIFlags,
    isFetchingList: isFetchingScenarios,
    runAndMarkLoaded,
  } = usePiniaVuexStoreBridge({
    namespace: 'captainScenarios',
    piniaStore: captainScenariosStore,
    useVuexFallback: false,
  });

  const fetchScenarios = async params => {
    return runAndMarkLoaded(() => captainScenariosStore.get(params));
  };

  const createScenario = async payload => {
    return runAndMarkLoaded(() => captainScenariosStore.create(payload));
  };

  const updateScenario = async payload => {
    return runAndMarkLoaded(() => captainScenariosStore.update(payload));
  };

  const deleteScenario = async payload => {
    return runAndMarkLoaded(() => captainScenariosStore.delete(payload));
  };

  return {
    captainScenariosStore,
    scenarios,
    scenariosMeta,
    scenariosUIFlags,
    isFetchingScenarios,
    fetchScenarios,
    createScenario,
    updateScenario,
    deleteScenario,
  };
}
