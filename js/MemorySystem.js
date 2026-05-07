import * as THREE from 'three';

const MemorySystem = (() => {
  let instance = null;

  function create() {
    let currentHarmony = 0;
    let maxHarmony = 0;
    let historyWeight = 0;

    return {
      update(alignmentScore, deltaTime) {
        currentHarmony = THREE.MathUtils.lerp(
          currentHarmony,
          alignmentScore,
          deltaTime * 2.0,
        );

        if (currentHarmony > maxHarmony) {
          maxHarmony = currentHarmony;
        }

        historyWeight = THREE.MathUtils.lerp(
          historyWeight,
          maxHarmony,
          deltaTime * 0.1,
        );
      },
      get currentHarmony() {
        return currentHarmony;
      },
      get maxHarmony() {
        return maxHarmony;
      },
      get historyWeight() {
        return historyWeight;
      },
    };
  }

  return {
    getInstance() {
      if (!instance) {
        instance = create();
      }
      return instance;
    },
  };
})();

export default MemorySystem;
