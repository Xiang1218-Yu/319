import * as THREE from 'three';
import TimeSystem from './TimeSystem.js';
import FieldSystem from './FieldSystem.js';
import StructureSystem from './StructureSystem.js';
import MemorySystem from './MemorySystem.js';
import ParticleSystem from './ParticleSystem.js';
import RenderSystem from './RenderSystem.js';

const WorldSimulation = (() => {
  let instance = null;

  function create(container) {
    const count = 8000;
    const time = TimeSystem.getInstance();
    const field = FieldSystem.getInstance();
    const structure = StructureSystem.getInstance();
    const memory = MemorySystem.getInstance();
    const particles = ParticleSystem.getInstance(count);
    const render = RenderSystem.getInstance(container, count);

    const state = {
      coherence: 0.1,
      turbulence: 0.8,
      symmetry: 0,
      colorTemp: 0.5,
    };

    const targetState = { ...state };

    function applyWorldParams(params) {
      Object.assign(targetState, params);
    }

    function update() {
      time.update();
      const dt = time.deltaTime;

      const lerpSpd = dt * 1.5;
      for (let key in state) {
        state[key] = THREE.MathUtils.lerp(
          state[key],
          targetState[key],
          lerpSpd,
        );
      }

      field.update(dt);

      particles.update(dt, field, structure, state);

      memory.update(particles.alignmentScore, dt);

      const memoryBonus = memory.historyWeight * 0.3;
      structure.intensity = Math.max(
        0,
        (state.coherence + memoryBonus - 0.5) * 2.0,
      );

      render.update(
        particles,
        state,
        time.getPulse(),
        structure,
      );
    }

    return {
      update,
      applyWorldParams,
      state,
      time,
      memory,
    };
  }

  return {
    getInstance(container) {
      if (!instance) {
        instance = create(container);
      }
      return instance;
    },
  };
})();

export default WorldSimulation;
