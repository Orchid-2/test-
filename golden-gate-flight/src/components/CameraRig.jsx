import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FLIGHT_PATH, LOOK_PATH } from '../config.js';

const DURATION = 40; // seconds for one full pass

// Smootherstep for gentle ease across the whole flight.
const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

export default function CameraRig({ playing, onProgress }) {
  const { camera } = useThree();
  const t = useRef(0);

  useFrame((state, delta) => {
    if (playing) {
      t.current = (t.current + delta / DURATION) % 1;
    }
    const u = t.current;
    const e = ease(u);

    FLIGHT_PATH.getPointAt(e, _pos);
    LOOK_PATH.getPointAt(e, _look);

    // Subtle handheld float so the shot feels alive, not on rails.
    const tt = state.clock.elapsedTime;
    _pos.x += Math.sin(tt * 0.7) * 0.8;
    _pos.y += Math.cos(tt * 0.9) * 0.6;
    _pos.z += Math.sin(tt * 0.5) * 0.8;

    camera.position.lerp(_pos, 1 - Math.pow(0.0001, delta));
    camera.lookAt(_look);

    if (onProgress) onProgress(u);
  });

  return null;
}
