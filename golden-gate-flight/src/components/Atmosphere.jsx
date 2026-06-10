import { Sky, Cloud, Clouds, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD } from '../config.js';

/**
 * Sky, sun, the Golden Gate's signature low fog, and a small self-contained
 * environment map (rendered from Lightformers, so no HDR is fetched over the
 * network) that gives the steel and cables something to reflect.
 */
export default function Atmosphere({ sunPos, quality }) {
  const sunDir = sunPos.clone().normalize();

  return (
    <>
      {/* Exponential fog rolling in off the Pacific. */}
      <fogExp2 attach="fog" args={['#cfd9dd', quality === 'low' ? 0.0016 : 0.0013]} />

      <Sky
        sunPosition={sunPos}
        turbidity={8}
        rayleigh={2.2}
        mieCoefficient={0.006}
        mieDirectionalG={0.82}
        distance={4500}
      />

      {/* Key light = the sun. */}
      <directionalLight
        position={sunPos}
        intensity={2.4}
        color="#fff0dc"
        castShadow={quality !== 'low'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={600}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={200}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0004}
      />

      {/* Sky/ground fill so shadowed sides aren't black. */}
      <hemisphereLight args={['#bcd3e6', '#274050', 0.9]} />
      <ambientLight intensity={0.25} />

      {/* Drifting marine-layer fog banks near the water. */}
      {quality !== 'low' && (
        <Clouds material={THREE.MeshLambertMaterial} limit={40} range={40}>
          <Cloud
            seed={1}
            segments={20}
            bounds={[260, 18, 90]}
            volume={70}
            color="#eef3f5"
            opacity={0.35}
            fade={120}
            speed={0.12}
            position={[40, WORLD.deckY - 4, -30]}
          />
          <Cloud
            seed={3}
            segments={14}
            bounds={[200, 14, 70]}
            volume={55}
            color="#dfe8ec"
            opacity={0.3}
            fade={120}
            speed={0.1}
            position={[-160, WORLD.deckY - 8, 50]}
          />
        </Clouds>
      )}

      {/* Cheap procedural reflections for the metalwork. */}
      <Environment resolution={quality === 'low' ? 64 : 128} frames={1}>
        <Lightformer
          intensity={3}
          color="#fff3e0"
          position={sunDir.clone().multiplyScalar(40)}
          scale={[30, 30, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.2}
          color="#9cc0db"
          position={[0, 60, 0]}
          rotation-x={Math.PI / 2}
          scale={[120, 120, 1]}
        />
        <Lightformer
          intensity={0.6}
          color="#23323d"
          position={[0, -40, 0]}
          rotation-x={-Math.PI / 2}
          scale={[200, 200, 1]}
        />
      </Environment>
    </>
  );
}
