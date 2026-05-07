import * as THREE from 'three';
import ParticleEntity from './ParticleEntity.js';

const ParticleSystem = (() => {
  let instance = null;

  function create(count = 8000) {
    const entities = Array.from(
      { length: count },
      () => new ParticleEntity(),
    );
    let alignmentScore = 0;

    function update(deltaTime, field, structure, params) {
      const worldCoherence = params.coherence;
      const turbulence = params.turbulence;
      const symmetry = params.symmetry;

      let totalDistScore = 0;

      for (let p of entities) {
        const dist = structure.getSDF(p.position);
        totalDistScore += Math.exp(-Math.abs(dist) * 1.5);

        let noise = field.getNoise(p.position, 2.0, turbulence * 1.5);

        if (symmetry > 0.1) {
          const mirroredPos = new THREE.Vector3(
            -p.position.x,
            p.position.y,
            -p.position.z,
          );
          const mirroredNoise = field.getNoise(
            mirroredPos,
            2.0,
            turbulence * 1.5,
          );
          mirroredNoise.x *= -1;
          mirroredNoise.z *= -1;
          noise.lerp(mirroredNoise, symmetry);
        }

        const tendencyForce = noise.clone().multiplyScalar(p.will);
        p.velocity.add(tendencyForce.multiplyScalar(deltaTime));

        const structureIntensity = structure.intensity;
        if (structureIntensity > 0.01) {
          const attract = structure.getAttraction(p.position);
          p.velocity.add(
            attract.multiplyScalar(deltaTime * p.affinity * 6.0),
          );
        }

        p.velocity.multiplyScalar(0.985);

        if (p.velocity.length() > 0.05) {
          const targetOrient = p.velocity.clone().normalize();
          p.orientation.lerp(targetOrient, deltaTime * 2.0);
        }

        p.position.add(p.velocity.clone().multiplyScalar(deltaTime));

        if (p.position.length() > 25) {
          p.position.multiplyScalar(-0.95);
          p.velocity.multiplyScalar(0.5);
        }
      }

      alignmentScore = totalDistScore / count;
    }

    return {
      entities,
      update,
      get alignmentScore() {
        return alignmentScore;
      },
    };
  }

  return {
    getInstance(count) {
      if (!instance) {
        instance = create(count);
      }
      return instance;
    },
  };
})();

export default ParticleSystem;
