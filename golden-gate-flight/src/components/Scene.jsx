import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import Atmosphere from './Atmosphere.jsx';
import Ocean from './Ocean.jsx';
import Bridge from './Bridge.jsx';
import CameraRig from './CameraRig.jsx';

// Distant low-poly headlands on either shore, to anchor the strait.
function Hills() {
  const hills = [
    { p: [-380, -20, 250], s: [150, 80, 150], c: '#566049' },
    { p: [-460, -24, -160], s: [200, 110, 200], c: '#4d5742' },
    { p: [400, -20, 240], s: [170, 90, 170], c: '#5a6147' },
    { p: [500, -26, -140], s: [220, 120, 220], c: '#4a5440' },
  ];
  return (
    <group>
      {hills.map((h, i) => (
        <mesh key={i} position={h.p} scale={h.s}>
          <sphereGeometry args={[1, 20, 14]} />
          <meshStandardMaterial color={h.c} roughness={1} metalness={0} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene({ quality, playing, onProgress }) {
  // Golden-hour sun: low elevation, raking across the strait.
  const sunPos = useMemo(() => {
    const elevation = 17;
    const azimuth = 165;
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    return new THREE.Vector3().setFromSphericalCoords(420, phi, theta);
  }, []);

  return (
    <>
      <CameraRig playing={playing} onProgress={onProgress} />

      <Suspense fallback={null}>
        <Atmosphere sunPos={sunPos} quality={quality} />
        <Ocean sunDir={sunPos} quality={quality} />
        <Bridge quality={quality} />
        <Hills />
      </Suspense>

      {quality !== 'low' && (
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.7}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}
