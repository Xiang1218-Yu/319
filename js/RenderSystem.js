import * as THREE from 'three';

const RenderSystem = (() => {
  let instance = null;

  function create(container, count) {
    if (!container) {
      throw new Error('RenderSystem: 渲染容器 DOM 元素不存在');
    }

    const canvas = document.createElement('canvas');
    const glContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!glContext) {
      throw new Error('RenderSystem: 当前浏览器不支持 WebGL');
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x020205, 1);
    container.appendChild(renderer.domElement);

    camera.position.z = 25;

    const geo = new THREE.BufferGeometry();
    const posArray = new Float32Array(count * 3);
    const velArray = new Float32Array(count * 3);
    const colArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);

    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(posArray, 3),
    );
    geo.setAttribute(
      'velocity',
      new THREE.BufferAttribute(velArray, 3),
    );
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(colArray, 3),
    );
    geo.setAttribute(
      'size',
      new THREE.BufferAttribute(sizeArray, 1),
    );

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 1.0 },
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
      `,
    });

    const mesh = new THREE.Points(geo, mat);
    scene.add(mesh);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize);

    function update(particles, params, pulse, structure) {
      const positions = geo.attributes.position.array;
      const velocities = geo.attributes.velocity.array;
      const colors = geo.attributes.color.array;
      const sizes = geo.attributes.size.array;

      const baseCol = new THREE.Color();
      const cold = new THREE.Color(0.4, 0.4, 1.0);
      const warm = new THREE.Color(1.0, 0.7, 0.3);
      baseCol.copy(cold).lerp(warm, params.colorTemp);

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
        const finalCol = baseCol
          .clone()
          .lerp(structureColor, proximity * structure.intensity * 0.7);

        colors[i3] = finalCol.r;
        colors[i3 + 1] = finalCol.g;
        colors[i3 + 2] = finalCol.b;

        sizes[i] =
          0.8 + p.will * 0.5 + proximity * 0.3 * structure.intensity;
      }

      geo.attributes.position.needsUpdate = true;
      geo.attributes.velocity.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.attributes.size.needsUpdate = true;

      mat.uniforms.uPulse.value = 0.8 + 0.4 * pulse;
      mat.uniforms.uTime.value = performance.now() * 0.001;

      const t = performance.now() * 0.0002;
      camera.position.x = Math.sin(t) * 5.0;
      camera.position.y = Math.cos(t) * 2.0;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    return { update };
  }

  return {
    getInstance(container, count) {
      if (!instance) {
        instance = create(container, count);
      }
      return instance;
    },
  };
})();

export default RenderSystem;
