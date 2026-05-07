import * as THREE from 'three';

const TimeSystem = (() => {
  let instance = null;

  function create() {
    const clock = new THREE.Clock();
    let worldTime = 0;
    let deltaTime = 0;

    return {
      update() {
        deltaTime = Math.min(clock.getDelta(), 0.05);
        worldTime += deltaTime;
      },
      getPulse(freq = 0.5) {
        return Math.sin(worldTime * Math.PI * 2 * freq) * 0.5 + 0.5;
      },
      get worldTime() {
        return worldTime;
      },
      get deltaTime() {
        return deltaTime;
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

export default TimeSystem;
