import * as THREE from 'three';

const StructureSystem = (() => {
  let instance = null;

  function create() {
    let intensity = 0;
    const treeHeight = 12.0;
    const treeRadius = 5.0;

    function getSDF(pos) {
      const h = treeHeight;
      const yOffset = pos.y + h / 2;

      if (yOffset < 0 || yOffset > h) return 5.0;

      const yNorm = yOffset / h;

      const numTiers = 4.0;
      const tier = Math.floor(yNorm * numTiers);
      const tierProgression = (yNorm * numTiers) % 1.0;

      const tierBaseRadius = treeRadius * (1.1 - (tier / numTiers) * 0.8);
      const targetRadius = tierBaseRadius * (1.0 - tierProgression * 0.8);

      const radial = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      return radial - targetRadius;
    }

    function getAttraction(pos) {
      if (intensity < 0.01) return new THREE.Vector3();

      const dist = getSDF(pos);

      const eps = 0.1;
      const dDx = getSDF({ x: pos.x + eps, y: pos.y, z: pos.z }) - dist;
      const dDy = getSDF({ x: pos.x, y: pos.y + eps, z: pos.z }) - dist;
      const dDz = getSDF({ x: pos.x, y: pos.y, z: pos.z + eps }) - dist;

      const normal = new THREE.Vector3(dDx, dDy, dDz).normalize();

      const forceStrength = -dist * Math.exp(-Math.abs(dist) * 0.4);

      return normal.multiplyScalar(forceStrength * intensity * 8.0);
    }

    return {
      getSDF,
      getAttraction,
      get intensity() {
        return intensity;
      },
      set intensity(val) {
        intensity = val;
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

export default StructureSystem;
