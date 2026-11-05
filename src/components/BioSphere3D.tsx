import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RiskLevel } from '../types';

interface BioSphere3DProps {
  riskLevel: RiskLevel;
  size?: number; // size in px, e.g. 260
  interactive?: boolean;
}

export const BioSphere3D: React.FC<BioSphere3DProps> = ({
  riskLevel = 'routine',
  size = 280,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const riskLevelRef = useRef(riskLevel);
  riskLevelRef.current = riskLevel;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.2;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Color definitions
    const colors = {
      routine: {
        primary: new THREE.Color('#10B981'), // Mint green
        secondary: new THREE.Color('#34D399'),
        ambient: new THREE.Color('#064E3B'),
        glow: new THREE.Color('#6EE7B7'),
        speed: 1.0,
        amplitude: 0.08,
      },
      urgent: {
        primary: new THREE.Color('#F59E0B'), // Warm Amber
        secondary: new THREE.Color('#FBBF24'),
        ambient: new THREE.Color('#78350F'),
        glow: new THREE.Color('#FDE68A'),
        speed: 2.3,
        amplitude: 0.14,
      },
      emergency: {
        primary: new THREE.Color('#F43F5E'), // Coral Red
        secondary: new THREE.Color('#FB7185'),
        ambient: new THREE.Color('#881337'),
        glow: new THREE.Color('#FECDD3'),
        speed: 4.0,
        amplitude: 0.22,
      },
    };

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x0EA5E9, 3.5, 12);
    rimLight.position.set(-4, -2, -2);
    scene.add(rimLight);

    const sphereLight = new THREE.PointLight(colors.routine.primary.getHex(), 4.0, 10);
    sphereLight.position.set(0, 0, 0);
    scene.add(sphereLight);

    // 5. Shader Material for Bio-Sphere with Water-like Ripples & Fresnel glow
    const vertexShader = `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uAmplitude;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      varying float vDisplacement;

      // Noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        // Dynamic water-like ripples + gentle breathing pulse
        float breath = sin(uTime * uSpeed * 0.8) * 0.05;
        float noise = snoise(position * 1.5 + vec3(uTime * uSpeed * 0.4));
        float displacement = (noise * uAmplitude) + breath;
        vDisplacement = displacement;
        
        vec3 newPosition = position + normal * displacement;
        vPosition = newPosition;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uGlowColor;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      varying float vDisplacement;

      void main() {
        // View direction for Fresnel glass rim
        vec3 viewDir = normalize(-vPosition);
        float fresnel = dot(vNormal, viewDir);
        fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
        fresnel = pow(fresnel, 2.2);

        // Gradient blend based on UV & displacement ripples
        float wave = sin(vPosition.y * 3.0 + uTime * 2.0) * 0.5 + 0.5;
        vec3 baseColor = mix(uColorA, uColorB, wave + vDisplacement * 2.0);

        // Add soft iridescent rim
        vec3 finalColor = mix(baseColor, uGlowColor, fresnel * 0.85);
        finalColor += vec3(0.08, 0.12, 0.18) * fresnel; // Apple VisionOS glass sheen

        // Soft translucency
        gl_FragColor = vec4(finalColor, 0.92);
      }
    `;

    const uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 1.0 },
      uAmplitude: { value: 0.08 },
      uColorA: { value: new THREE.Color(colors.routine.primary) },
      uColorB: { value: new THREE.Color(colors.routine.secondary) },
      uGlowColor: { value: new THREE.Color(colors.routine.glow) },
    };

    const sphereGeometry = new THREE.IcosahedronGeometry(1.65, 48);
    const sphereMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      wireframe: false,
    });

    const mainSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(mainSphere);

    // 6. Outer Frosted Glass Orb (VisionOS effect)
    const glassGeometry = new THREE.SphereGeometry(1.85, 32, 32);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.75,
      opacity: 0.6,
      transparent: true,
      roughness: 0.12,
      ior: 1.45,
      reflectivity: 0.7,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const glassOrb = new THREE.Mesh(glassGeometry, glassMaterial);
    scene.add(glassOrb);

    // 7. Orbital Bio-Data Ring Particles
    const particleCount = 70;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleAngles = new Float32Array(particleCount);
    const particleRadii = new Float32Array(particleCount);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.1 + Math.random() * 0.6;
      const angle = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 1.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = yOffset;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      particleAngles[i] = angle;
      particleRadii[i] = radius;
      particleSpeeds[i] = 0.3 + Math.random() * 0.4;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: colors.routine.primary.getHex(),
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse tilt interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotationY = x * 0.8;
      targetRotationX = y * 0.8;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Current target settings based on risk level
      const currentRisk = riskLevelRef.current || 'routine';
      const targetConfig = colors[currentRisk] || colors.routine;

      // Smoothly interpolate uniforms
      uniforms.uTime.value = elapsedTime;
      uniforms.uSpeed.value = THREE.MathUtils.lerp(uniforms.uSpeed.value, targetConfig.speed, 0.05);
      uniforms.uAmplitude.value = THREE.MathUtils.lerp(uniforms.uAmplitude.value, targetConfig.amplitude, 0.05);

      uniforms.uColorA.value.lerp(targetConfig.primary, 0.05);
      uniforms.uColorB.value.lerp(targetConfig.secondary, 0.05);
      uniforms.uGlowColor.value.lerp(targetConfig.glow, 0.05);

      particleMaterial.color.lerp(targetConfig.primary, 0.05);
      sphereLight.color.lerp(targetConfig.primary, 0.05);

      // Sphere gentle rotations
      mainSphere.rotation.y += 0.005 * targetConfig.speed;
      mainSphere.rotation.x = THREE.MathUtils.lerp(mainSphere.rotation.x, targetRotationX, 0.05);
      mainSphere.rotation.z = THREE.MathUtils.lerp(mainSphere.rotation.z, targetRotationY, 0.05);

      glassOrb.rotation.y -= 0.003 * targetConfig.speed;
      glassOrb.rotation.x = mainSphere.rotation.x * 0.6;

      // Update orbiting particles
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        particleAngles[i] += 0.01 * particleSpeeds[i] * targetConfig.speed;
        const currentAngle = particleAngles[i];
        const r = particleRadii[i];
        posAttr.setX(i, Math.cos(currentAngle) * r);
        posAttr.setZ(i, Math.sin(currentAngle) * r);
      }
      posAttr.needsUpdate = true;
      particles.rotation.y += 0.002;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || size;
      const newH = container.clientHeight || size;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      glassGeometry.dispose();
      glassMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size, interactive]);

  return (
    <div className="relative flex items-center justify-center select-none pointer-events-auto">
      {/* Soft Ambient Glow Halo behind Sphere */}
      <div
        className={`absolute rounded-full filter blur-3xl transition-all duration-700 pointer-events-none opacity-40 ${
          riskLevel === 'emergency'
            ? 'w-72 h-72 bg-coral/30 animate-pulse'
            : riskLevel === 'urgent'
            ? 'w-64 h-64 bg-amber/25'
            : 'w-60 h-60 bg-mint/25'
        }`}
      />
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="cursor-grab active:cursor-grabbing transition-transform duration-300"
      />
    </div>
  );
};
