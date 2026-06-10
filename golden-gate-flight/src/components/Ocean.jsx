import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A procedural ocean built on summed Gerstner waves. The vertex shader
 * displaces a high-resolution plane and derives analytic normals; the
 * fragment shader does a Fresnel mix between deep-water colour and a
 * reflected-sky colour, plus a sharp sun specular for moving glints.
 * No external textures — keeps the bundle light and reliable on mobile.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;        // global amplitude scale (lowered on mobile)
  varying vec3 vWorld;
  varying vec3 vNormal;

  #include <fog_pars_vertex>

  // Per-wave: direction.xy, amplitude, wavelength, speed, steepness
  const int N = 4;
  vec2  DIR[N];
  float AMP[N];
  float LEN[N];
  float SPD[N];
  float STP[N];

  void setup() {
    DIR[0] = normalize(vec2( 1.0,  0.35)); AMP[0] = 0.95; LEN[0] = 62.0; SPD[0] = 1.0;  STP[0] = 0.55;
    DIR[1] = normalize(vec2( 0.7, -0.9 )); AMP[1] = 0.55; LEN[1] = 34.0; SPD[1] = 1.15; STP[1] = 0.5;
    DIR[2] = normalize(vec2(-0.4,  1.0 )); AMP[2] = 0.32; LEN[2] = 18.0; SPD[2] = 1.3;  STP[2] = 0.45;
    DIR[3] = normalize(vec2( 1.0, -0.2 )); AMP[3] = 0.18; LEN[3] = 9.0;  SPD[3] = 1.5;  STP[3] = 0.4;
  }

  void main() {
    setup();
    vec3 p = position;          // local: xy is the horizontal plane, z is up
    vec3 n = vec3(0.0, 0.0, 1.0);

    for (int i = 0; i < N; i++) {
      float k = 6.2831853 / LEN[i];
      float amp = AMP[i] * uAmp;
      float f = k * dot(DIR[i], position.xy) - sqrt(9.8 * k) * SPD[i] * uTime;
      float c = cos(f);
      float s = sin(f);
      float WA = k * amp;

      p.x += STP[i] * amp * DIR[i].x * c;
      p.y += STP[i] * amp * DIR[i].y * c;
      p.z += amp * s;

      n.x -= DIR[i].x * WA * c;
      n.y -= DIR[i].y * WA * c;
      n.z -= STP[i] * WA * s;
    }

    vec4 worldPos = modelMatrix * vec4(p, 1.0);
    vWorld = worldPos.xyz;
    vNormal = normalize(mat3(modelMatrix) * normalize(n));

    vec4 mvPosition = viewMatrix * worldPos;
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSkyTop;
  uniform vec3 uSkyHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  varying vec3 vWorld;
  varying vec3 vNormal;

  #include <fog_pars_fragment>

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorld);

    // Reflected sky colour, graded from horizon to zenith.
    vec3 R = reflect(-V, N);
    float upness = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 skyRefl = mix(uSkyHorizon, uSkyTop, pow(upness, 1.4));

    // Fresnel (Schlick) — glancing angles reflect the sky, steep angles
    // reveal the deep water beneath.
    float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);

    // Depth tint based on a little of the wave normal for variety.
    vec3 water = mix(uDeep, uShallow, clamp(N.z * 0.6 + 0.2, 0.0, 1.0));

    vec3 color = mix(water, skyRefl, fres);

    // Sharp sun specular glints.
    vec3 H = normalize(uSunDir + V);
    float spec = pow(max(dot(N, H), 0.0), 220.0);
    color += uSunColor * spec * 2.2;

    // Broad sun sheen on the water surface toward the sun.
    float sheen = pow(max(dot(R, uSunDir), 0.0), 8.0);
    color += uSunColor * sheen * 0.18;

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export default function Ocean({ sunDir, quality }) {
  const matRef = useRef();
  const { size } = useThree();

  // Lower the tessellation and wave amplitude on small / low-power screens.
  const segments = quality === 'low' ? 160 : 320;
  const planeSize = 4000;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: quality === 'low' ? 0.7 : 1.0 },
      uDeep: { value: new THREE.Color('#0b2a3a') },
      uShallow: { value: new THREE.Color('#1d5161') },
      uSkyTop: { value: new THREE.Color('#7fa9c9') },
      uSkyHorizon: { value: new THREE.Color('#dfe7ea') },
      uSunDir: { value: sunDir.clone().normalize() },
      uSunColor: { value: new THREE.Color('#fff1dd') },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position-y={0}
      receiveShadow={false}
      frustumCulled={false}
      // eslint-disable-next-line react-hooks/exhaustive-deps
      key={`${segments}-${size.width > size.height}`}
    >
      <planeGeometry args={[planeSize, planeSize, segments, segments]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        fog
      />
    </mesh>
  );
}
