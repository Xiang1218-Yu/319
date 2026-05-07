import * as THREE from 'three';

const FieldSystem = (() => {
  let instance = null;

  function create() {
    let time = 0;

    return {
      getNoise(pos, scale, strength) {
        const s1 = scale * 0.08;
        const s2 = scale * 0.2;
        const t = time * 0.4;

        const fx = Math.sin(pos.y * s1 + t) + Math.cos(pos.z * s1 + t * 0.5);
        const fy = Math.sin(pos.z * s1 + t) + Math.cos(pos.x * s1 + t * 0.8);
        const fz = Math.sin(pos.x * s1 + t) + Math.cos(pos.y * s1 + t * 1.2);

        const dx = Math.sin(pos.z * s2 - t);
        const dy = Math.cos(pos.x * s2 + t);
        const dz = Math.sin(pos.y * s2 - t * 0.5);

        return new THREE.Vector3(
          fx + dx * 0.3,
          fy + dy * 0.3,
          fz + dz * 0.3,
        ).multiplyScalar(strength);
      },
      update(deltaTime) {
        time += deltaTime;
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

export default FieldSystem;
