import * as THREE from 'three';

class ParticleEntity {
  constructor() {
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
    );
    this.velocity = new THREE.Vector3();
    this.orientation = new THREE.Vector3(0, 1, 0);
    this.will = 0.5 + Math.random() * 0.5;
    this.affinity = Math.random();
    this.life = Math.random();
    this.color = new THREE.Color();
  }
}

export default ParticleEntity;
