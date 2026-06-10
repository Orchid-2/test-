import { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { WORLD, COLORS } from '../config.js';

/**
 * The Golden Gate Bridge, modelled procedurally:
 *  - two art-deco stepped towers (tapered legs + portal bracing)
 *  - two catenary main cables (parabolic main span + straight side spans)
 *  - instanced vertical suspender ropes
 *  - the roadway deck with stiffening truss, railings and lane markings
 *  - shore anchorages and in-water tower piers
 */

const { waterY, deckY, towerTopY, towerBaseY, towerX, anchorX, deckHalfLen, halfWidth, towerLegWidth } =
  WORLD;

// Height of the main cable above the water at a given x position.
function cableY(x) {
  const ax = Math.abs(x);
  if (ax <= towerX) {
    // Main span: parabola sagging toward the deck at mid-span.
    const midSag = deckY + 5;
    const t = ax / towerX;
    return midSag + (towerTopY - midSag) * t * t;
  }
  // Side span: descend from the tower top to the anchorage.
  const anchorY = deckY - 1;
  const t = (ax - towerX) / (anchorX - towerX);
  // Slight catenary droop on the side spans.
  const droop = Math.sin(t * Math.PI) * 2.5;
  return THREE.MathUtils.lerp(towerTopY, anchorY, t) - droop;
}

function buildCableCurve(z) {
  const pts = [];
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const x = THREE.MathUtils.lerp(-anchorX, anchorX, i / steps);
    pts.push(new THREE.Vector3(x, cableY(x), z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function Tower({ x }) {
  const legH = towerTopY - towerBaseY;
  const legCenterY = (towerTopY + towerBaseY) / 2;
  // Horizontal portal braces, narrowing toward the top (art-deco stepping).
  const braces = [
    { y: deckY - 7, h: 4.5, w: 6.5 },
    { y: deckY + 16, h: 3.2, w: 5.5 },
    { y: 50, h: 2.8, w: 4.8 },
    { y: towerTopY - 4, h: 2.4, w: 4.2 },
    { y: towerTopY - 1.2, h: 1.6, w: 3.6 }, // crown step
  ];
  const orange = useMemo(
    () => ({ color: COLORS.orange, roughness: 0.62, metalness: 0.2 }),
    []
  );

  return (
    <group position={[x, 0, 0]}>
      {[-halfWidth, halfWidth].map((z) => (
        <mesh key={z} position={[0, legCenterY, z]} castShadow receiveShadow>
          {/* 4-sided cylinder = a tapered square column */}
          <cylinderGeometry
            args={[towerLegWidth * 0.62, towerLegWidth * 0.92, legH, 4, 1]}
          />
          <meshStandardMaterial {...orange} flatShading />
        </mesh>
      ))}

      {braces.map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]} castShadow>
          <boxGeometry args={[b.w, b.h, halfWidth * 2 + towerLegWidth]} />
          <meshStandardMaterial {...orange} />
        </mesh>
      ))}

      {/* In-water pier fenders at the base of each leg */}
      {[-halfWidth, halfWidth].map((z) => (
        <mesh key={`pier${z}`} position={[0, waterY - 2, z]}>
          <cylinderGeometry args={[towerLegWidth * 1.3, towerLegWidth * 1.5, 10, 16]} />
          <meshStandardMaterial color="#6b6f73" roughness={0.95} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

function Suspenders({ quality }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const out = [];
    const spacing = quality === 'low' ? 14 : 9;
    for (let x = -anchorX + 10; x <= anchorX - 10; x += spacing) {
      const cy = cableY(x);
      if (cy <= deckY + 1.5) continue; // no suspender where the cable meets the deck
      for (const z of [-halfWidth, halfWidth]) {
        out.push({ x, z, top: cy, bottom: deckY + 0.5 });
      }
    }
    return out;
  }, [quality]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      const h = p.top - p.bottom;
      dummy.position.set(p.x, (p.top + p.bottom) / 2, p.z);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} castShadow>
      <cylinderGeometry args={[0.14, 0.14, 1, 6]} />
      <meshStandardMaterial color={COLORS.cable} roughness={0.55} metalness={0.35} />
    </instancedMesh>
  );
}

function MainCables() {
  const geoms = useMemo(() => {
    return [-halfWidth, halfWidth].map((z) => {
      const curve = buildCableCurve(z);
      return new THREE.TubeGeometry(curve, 240, 0.55, 10, false);
    });
  }, []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.cable,
        roughness: 0.5,
        metalness: 0.4,
      }),
    []
  );
  return (
    <group>
      {geoms.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} castShadow />
      ))}
    </group>
  );
}

function Deck() {
  const len = deckHalfLen * 2;
  const width = halfWidth * 2 + 2;
  const orange = { color: COLORS.orange, roughness: 0.62, metalness: 0.2 };

  // Lane markings down the centre of the roadway.
  const markings = useMemo(() => {
    const dashes = [];
    for (let x = -deckHalfLen + 8; x <= deckHalfLen - 8; x += 14) {
      dashes.push(x);
    }
    return dashes;
  }, []);

  return (
    <group>
      {/* Road surface */}
      <mesh position={[0, deckY, 0]} receiveShadow castShadow>
        <boxGeometry args={[len, 1.0, width]} />
        <meshStandardMaterial color={COLORS.deck} roughness={0.92} metalness={0.05} />
      </mesh>

      {/* Stiffening truss beneath the deck */}
      <mesh position={[0, deckY - 2.2, 0]} castShadow>
        <boxGeometry args={[len, 3.0, width - 1.5]} />
        <meshStandardMaterial color={COLORS.orangeDark} roughness={0.7} metalness={0.25} />
      </mesh>

      {/* Side railings */}
      {[-halfWidth - 0.6, halfWidth + 0.6].map((z) => (
        <mesh key={z} position={[0, deckY + 1.2, z]} castShadow>
          <boxGeometry args={[len, 1.4, 0.5]} />
          <meshStandardMaterial {...orange} />
        </mesh>
      ))}

      {/* Centre lane dashes */}
      {markings.map((x) => (
        <mesh key={x} position={[x, deckY + 0.52, 0]}>
          <boxGeometry args={[5, 0.05, 0.4]} />
          <meshStandardMaterial color="#e9d27a" emissive="#3a3214" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function Anchorages() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (anchorX + 6), deckY - 9, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[26, 26, halfWidth * 2 + 14]} />
          <meshStandardMaterial color="#9a9489" roughness={0.95} metalness={0.04} />
        </mesh>
      ))}
    </group>
  );
}

export default function Bridge({ quality }) {
  return (
    <group>
      <Deck />
      <Anchorages />
      <Tower x={-towerX} />
      <Tower x={towerX} />
      <MainCables />
      <Suspenders quality={quality} />
    </group>
  );
}
