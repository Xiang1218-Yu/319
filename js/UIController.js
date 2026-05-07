const UIController = (() => {
  let instance = null;

  function create(worldSimulation) {
    const controlIds = ['coherence', 'turbulence', 'symmetry', 'colorTemp'];
    const boundElements = {};
    const syncElements = {};

    function safeGetElement(id) {
      const el = document.getElementById(id);
      if (!el) {
        console.warn(`[UIController] DOM 元素 #${id} 未找到，对应功能将被跳过`);
      }
      return el;
    }

    function bindControls() {
      controlIds.forEach((id) => {
        const element = safeGetElement(id);
        if (element) {
          boundElements[id] = element;
          element.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (isNaN(val)) return;
            const update = {};
            update[id] = val / 100;
            worldSimulation.applyWorldParams(update);
          });
        }
      });
      cacheSyncElements();
    }

    function cacheSyncElements() {
      syncElements.vCoherence = safeGetElement('vCoherence');
      syncElements.vTurbulence = safeGetElement('vTurbulence');
      syncElements.vSymmetry = safeGetElement('vSymmetry');
      syncElements.vColorTemp = safeGetElement('vColorTemp');
      syncElements.sHarmony = safeGetElement('sHarmony');
      syncElements.sMemory = safeGetElement('sMemory');
      syncElements.sTime = safeGetElement('sTime');
    }

    function syncUI() {
      const state = worldSimulation.state;
      const memory = worldSimulation.memory;
      const time = worldSimulation.time;

      if (syncElements.vCoherence) syncElements.vCoherence.textContent = state.coherence.toFixed(2);
      if (syncElements.vTurbulence) syncElements.vTurbulence.textContent = state.turbulence.toFixed(2);
      if (syncElements.vSymmetry) syncElements.vSymmetry.textContent = state.symmetry.toFixed(2);
      if (syncElements.vColorTemp) syncElements.vColorTemp.textContent = state.colorTemp.toFixed(2);

      if (syncElements.sHarmony) syncElements.sHarmony.textContent = memory.currentHarmony.toFixed(2);
      if (syncElements.sMemory) syncElements.sMemory.textContent = memory.maxHarmony.toFixed(2);
      if (syncElements.sTime) syncElements.sTime.textContent = time.worldTime.toFixed(1);
    }

    return {
      bindControls,
      syncUI,
    };
  }

  return {
    getInstance(worldSimulation) {
      if (!instance) {
        instance = create(worldSimulation);
      }
      return instance;
    },
  };
})();

export default UIController;
