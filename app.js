import * as THREE from "three";

class TimeSystem {
  constructor() {
    this.clock = new THREE.Clock();
    this.worldTime = 0;
    this.deltaTime = 0;
  }

  update() {
    this.deltaTime = Math.min(this.clock.getDelta(), 0.05);
    this.worldTime += this.deltaTime;
  }

  getPulse(freq = 0.5) {
    return Math.sin(this.worldTime * Math.PI * 2 * freq) * 0.5 + 0.5;
  }
}

class FieldSystem {
  constructor() {
    this.time = 0;
  }

  getNoise(pos, scale, strength) {
    const scaleLarge = scale * 0.08;
    const scaleSmall = scale * 0.2;
    const time = this.time * 0.4;

    const forceX = Math.sin(pos.y * scaleLarge + time) + Math.cos(pos.z * scaleLarge + time * 0.5);
    const forceY = Math.sin(pos.z * scaleLarge + time) + Math.cos(pos.x * scaleLarge + time * 0.8);
    const forceZ = Math.sin(pos.x * scaleLarge + time) + Math.cos(pos.y * scaleLarge + time * 1.2);

    const detailX = Math.sin(pos.z * scaleSmall - time);
    const detailY = Math.cos(pos.x * scaleSmall + time);
    const detailZ = Math.sin(pos.y * scaleSmall - time * 0.5);

    return new THREE.Vector3(
      forceX + detailX * 0.3,
      forceY + detailY * 0.3,
      forceZ + detailZ * 0.3
    ).multiplyScalar(strength);
  }

  update(deltaTime) {
    this.time += deltaTime;
  }
}

class StructureSystem {
  constructor() {
    this.intensity = 0;
    this.treeHeight = 12.0;
    this.treeRadius = 5.0;
  }

  getSDF(pos) {
    const treeHeight = this.treeHeight;
    const yOffset = pos.y + treeHeight / 2;

    if (yOffset < 0 || yOffset > treeHeight) return 5.0;

    const yNormalized = yOffset / treeHeight;
    const numTiers = 4.0;
    const tier = Math.floor(yNormalized * numTiers);
    const tierProgression = (yNormalized * numTiers) % 1.0;

    const tierBaseRadius =
      this.treeRadius * (1.1 - (tier / numTiers) * 0.8);
    const targetRadius = tierBaseRadius * (1.0 - tierProgression * 0.8);

    const radialDistance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    return radialDistance - targetRadius;
  }

  getAttraction(pos) {
    if (this.intensity < 0.01) return new THREE.Vector3();

    const dist = this.getSDF(pos);
    const eps = 0.1;
    const deltaX =
      this.getSDF({ x: pos.x + eps, y: pos.y, z: pos.z }) - dist;
    const deltaY =
      this.getSDF({ x: pos.x, y: pos.y + eps, z: pos.z }) - dist;
    const deltaZ =
      this.getSDF({ x: pos.x, y: pos.y, z: pos.z + eps }) - dist;

    const normal = new THREE.Vector3(deltaX, deltaY, deltaZ).normalize();
    const forceStrength = -dist * Math.exp(-Math.abs(dist) * 0.4);

    return normal.multiplyScalar(forceStrength * this.intensity * 8.0);
  }
}

class MemorySystem {
  constructor() {
    this.currentHarmony = 0;
    this.maxHarmony = 0;
    this.historyWeight = 0;
  }

  update(alignmentScore, deltaTime) {
    this.currentHarmony = THREE.MathUtils.lerp(
      this.currentHarmony,
      alignmentScore,
      deltaTime * 2.0
    );

    if (this.currentHarmony > this.maxHarmony) {
      this.maxHarmony = this.currentHarmony;
    }

    this.historyWeight = THREE.MathUtils.lerp(
      this.historyWeight,
      this.maxHarmony,
      deltaTime * 0.1
    );
  }
}

class ParticleEntity {
  constructor() {
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30
    );
    this.velocity = new THREE.Vector3();
    this.orientation = new THREE.Vector3(0, 1, 0);
    this.will = 0.5 + Math.random() * 0.5;
    this.affinity = Math.random();
    this.life = Math.random();
    this.color = new THREE.Color();
  }
}

class ParticleSystem {
  constructor(count = 8000) {
    this.entities = Array.from(
      { length: count },
      () => new ParticleEntity()
    );
    this.count = count;
    this.alignmentScore = 0;
  }

  update(deltaTime, field, structure, params) {
    const worldCoherence = params.coherence;
    const turbulence = params.turbulence;
    const symmetry = params.symmetry;

    let totalDistScore = 0;

    for (let p of this.entities) {
      const dist = structure.getSDF(p.position);
      totalDistScore += Math.exp(-Math.abs(dist) * 1.5);

      let noise = field.getNoise(p.position, 2.0, turbulence * 1.5);

      if (symmetry > 0.1) {
        const mirroredPos = new THREE.Vector3(
          -p.position.x,
          p.position.y,
          -p.position.z
        );
        const mirroredNoise = field.getNoise(
          mirroredPos,
          2.0,
          turbulence * 1.5
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
          attract.multiplyScalar(deltaTime * p.affinity * 6.0)
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

    this.alignmentScore = totalDistScore / this.count;
  }
}

class RenderSystem {
  constructor(container, count) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x020205, 1);
    container.appendChild(this.renderer.domElement);

    this.camera.position.z = 25;

    this.geo = new THREE.BufferGeometry();
    this.positionsArray = new Float32Array(count * 3);
    this.velocitiesArray = new Float32Array(count * 3);
    this.colorsArray = new Float32Array(count * 3);
    this.sizesArray = new Float32Array(count);

    this.geo.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positionsArray, 3)
    );
    this.geo.setAttribute(
      "velocity",
      new THREE.BufferAttribute(this.velocitiesArray, 3)
    );
    this.geo.setAttribute(
      "color",
      new THREE.BufferAttribute(this.colorsArray, 3)
    );
    this.geo.setAttribute(
      "size",
      new THREE.BufferAttribute(this.sizesArray, 1)
    );

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 1.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute vec3 velocity;
        varying vec3 vColor;
        varying float vSpeed;
        uniform float uTime;
        uniform float uPulse;
        
        void main() {
            vColor = color;
            vSpeed = length(velocity);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
            float pSize = size * uPulse * (1.0 + vSpeed * 0.1);
            
            gl_PointSize = pSize * (250.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vSpeed;
        uniform float uTime;
        
        void main() {
            vec2 pc = gl_PointCoord - vec2(0.5);
            
            float stretch = 1.6 + vSpeed * 0.4;
            float dist = length(pc * vec2(1.0, stretch)); 
            
            float strength = pow(clamp(1.0 - dist * 2.5, 0.0, 1.0), 4.5);
            
            if (strength <= 0.02) discard;
            
            float speedEffect = 1.0 + vSpeed * 0.05;
            float flicker = 0.85 + 0.15 * sin(uTime * 8.0 + vSpeed * 10.0);
            
            gl_FragColor = vec4(vColor * speedEffect, strength * flicker * 0.55);
        }
      `
    });

    this.pointsMesh = new THREE.Points(this.geo, this.material);
    this.scene.add(this.pointsMesh);

    this.boundResizeHandler = this.onResize.bind(this);
    window.addEventListener("resize", this.boundResizeHandler);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    window.removeEventListener("resize", this.boundResizeHandler);

    if (this.pointsMesh) {
      this.scene.remove(this.pointsMesh);
    }

    if (this.geo) {
      this.geo.dispose();
    }

    if (this.material) {
      this.material.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.geo = null;
    this.material = null;
    this.pointsMesh = null;
    this.positionsArray = null;
    this.velocitiesArray = null;
    this.colorsArray = null;
    this.sizesArray = null;
    this.boundResizeHandler = null;
  }

  update(particles, params, pulse, structure) {
    const positions = this.geo.attributes.position.array;
    const velocities = this.geo.attributes.velocity.array;
    const colors = this.geo.attributes.color.array;
    const sizes = this.geo.attributes.size.array;

    const baseColor = new THREE.Color();
    const cold = new THREE.Color(0.4, 0.4, 1.0);
    const warm = new THREE.Color(1.0, 0.7, 0.3);
    baseColor.copy(cold).lerp(warm, params.colorTemp);

    for (let i = 0; i < particles.entities.length; i++) {
      const p = particles.entities[i];
      const i3 = i * 3;

      positions[i3] = p.position.x;
      positions[i3 + 1] = p.position.y;
      positions[i3 + 2] = p.position.z;

      velocities[i3] = p.velocity.x;
      velocities[i3 + 1] = p.velocity.y;
      velocities[i3 + 2] = p.velocity.z;

      const dist = structure.getSDF(p.position);
      const proximity = Math.exp(-Math.abs(dist) * 1.5);

      const structureColor = new THREE.Color(0.8, 0.9, 1.0);
      const finalColor = baseColor
        .clone()
        .lerp(structureColor, proximity * structure.intensity * 0.7);

      colors[i3] = finalColor.r;
      colors[i3 + 1] = finalColor.g;
      colors[i3 + 2] = finalColor.b;

      sizes[i] =
        0.8 + p.will * 0.5 + proximity * 0.3 * structure.intensity;
    }

    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.velocity.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;

    this.material.uniforms.uPulse.value = 0.8 + 0.4 * pulse;
    this.material.uniforms.uTime.value = performance.now() * 0.001;

    const t = performance.now() * 0.0002;
    this.camera.position.x = Math.sin(t) * 5.0;
    this.camera.position.y = Math.cos(t) * 2.0;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }
}

class UIManager {
  constructor(simulation) {
    this.simulation = simulation;
    this.eventListeners = [];
    this.bindUI();
  }

  bindUI() {
    const controlIds = ["coherence", "turbulence", "symmetry", "colorTemp"];
    controlIds.forEach((controlId) => {
      const element = document.getElementById(controlId);
      if (element) {
        const handler = (event) => {
          const value = parseFloat(event.target.value) / 100;
          const update = {};
          update[controlId] = value;
          this.simulation.applyWorldParams(update);
        };
        element.addEventListener("input", handler);
        this.eventListeners.push({ element, handler, type: "input" });
      }
    });
  }

  syncUI(state, memory, worldTime) {
    document.getElementById("v-coherence").textContent =
      state.coherence.toFixed(2);
    document.getElementById("v-turbulence").textContent =
      state.turbulence.toFixed(2);
    document.getElementById("v-symmetry").textContent =
      state.symmetry.toFixed(2);
    document.getElementById("v-colorTemp").textContent =
      state.colorTemp.toFixed(2);

    document.getElementById("s-harmony").textContent =
      memory.currentHarmony.toFixed(2);
    document.getElementById("s-memory").textContent =
      memory.maxHarmony.toFixed(2);
    document.getElementById("s-time").textContent =
      worldTime.toFixed(1);
  }

  dispose() {
    this.eventListeners.forEach(({ element, handler, type }) => {
      element.removeEventListener(type, handler);
    });
    this.eventListeners = [];
    this.simulation = null;
  }
}

class WorldSimulation {
  constructor(container) {
    if (WorldSimulation.instance) {
      return WorldSimulation.instance;
    }

    this.container = container;
    this.count = 8000;
    this.time = new TimeSystem();
    this.field = new FieldSystem();
    this.structure = new StructureSystem();
    this.memory = new MemorySystem();
    this.particles = new ParticleSystem(this.count);
    this.render = new RenderSystem(container, this.count);
    this.uiManager = new UIManager(this);

    this.state = {
      coherence: 0.1,
      turbulence: 0.8,
      symmetry: 0,
      colorTemp: 0.5
    };

    this.targetState = { ...this.state };
    this.isRunning = false;
    this.animationFrameId = null;

    this.boundUpdate = this.update.bind(this);

    WorldSimulation.instance = this;
  }

  static getInstance(container) {
    if (!WorldSimulation.instance) {
      WorldSimulation.instance = new WorldSimulation(container);
    }
    return WorldSimulation.instance;
  }

  applyWorldParams(params) {
    Object.assign(this.targetState, params);
  }

  update() {
    if (!this.isRunning) return;

    this.time.update();
    const deltaTime = this.time.deltaTime;

    const lerpSpeed = deltaTime * 1.5;
    for (let key in this.state) {
      this.state[key] = THREE.MathUtils.lerp(
        this.state[key],
        this.targetState[key],
        lerpSpeed
      );
    }

    this.field.update(deltaTime);
    this.particles.update(deltaTime, this.field, this.structure, this.state);
    this.memory.update(this.particles.alignmentScore, deltaTime);

    const memoryBonus = this.memory.historyWeight * 0.3;
    this.structure.intensity = Math.max(
      0,
      (this.state.coherence + memoryBonus - 0.5) * 2.0
    );

    this.render.update(
      this.particles,
      this.state,
      this.time.getPulse(),
      this.structure
    );

    this.uiManager.syncUI(this.state, this.memory, this.time.worldTime);

    this.animationFrameId = requestAnimationFrame(this.boundUpdate);
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animationFrameId = requestAnimationFrame(this.boundUpdate);
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = false;
  }

  dispose() {
    this.stop();

    if (this.render) {
      this.render.dispose();
    }

    if (this.uiManager) {
      this.uiManager.dispose();
    }

    this.container = null;
    this.time = null;
    this.field = null;
    this.structure = null;
    this.memory = null;
    this.particles = null;
    this.render = null;
    this.uiManager = null;
    this.state = null;
    this.targetState = null;
    this.boundUpdate = null;

    WorldSimulation.instance = null;
  }
}

WorldSimulation.instance = null;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("canvas-container");
  const world = WorldSimulation.getInstance(container);
  world.start();
  window.worldLayer = world;

  window.addEventListener("beforeunload", () => {
    if (world) {
      world.dispose();
    }
  });
});
