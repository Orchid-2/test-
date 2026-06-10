import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import Scene from './components/Scene.jsx';
import { CHAPTERS } from './config.js';

// Decide a quality tier from the device so phones stay smooth.
function detectQuality() {
  if (typeof navigator === 'undefined') return 'high';
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(ua);
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 500;
  if ((isMobile && (small || cores <= 4 || mem <= 4))) return 'low';
  return 'high';
}

function Loader() {
  const { progress, active } = useProgress();
  return (
    <div className={`loader ${!active && progress >= 100 ? 'hidden' : ''}`}>
      <div className="ring" />
      <div className="pct">{Math.round(progress)}%</div>
    </div>
  );
}

export default function App() {
  const [quality] = useState(detectQuality);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const titleRef = useRef(null);

  // Smooth out per-frame progress reporting so we don't re-render React 60x/s.
  const lastReport = useRef(0);
  const onProgress = (u) => {
    const now = performance.now();
    if (now - lastReport.current > 120) {
      lastReport.current = now;
      setProgress(u);
    }
  };

  const chapter = useMemo(() => {
    let current = CHAPTERS[0];
    for (const c of CHAPTERS) if (progress >= c.at) current = c;
    return current;
  }, [progress]);

  // Fade the big title out once the flight gets underway.
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.opacity = progress > 0.08 && progress < 0.92 ? '0' : '1';
    }
  }, [progress]);

  const dpr = quality === 'low' ? [1, 1.5] : [1, 2];

  return (
    <>
      <Canvas
        shadows={quality !== 'low'}
        dpr={dpr}
        gl={{
          antialias: quality === 'low',
          powerPreference: 'high-performance',
          alpha: false,
        }}
        camera={{ fov: 58, near: 0.5, far: 8000, position: [-470, 70, 150] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          scene.background = new THREE.Color('#cfd9dd');
        }}
      >
        <Scene quality={quality} playing={playing} onProgress={onProgress} />
      </Canvas>

      <div className="overlay">
        <div className="title-block" ref={titleRef}>
          <div className="eyebrow">San Francisco · 37.8199° N</div>
          <h1>Golden Gate</h1>
          <p className="sub">A cinematic flight across the strait, rendered in real time.</p>
        </div>

        <div className="bottom-bar">
          <div className="chapter">
            <span className="num">
              {String(CHAPTERS.indexOf(chapter) + 1).padStart(2, '0')}
            </span>
            {chapter.text}
          </div>
          <div className="controls">
            <button className="ctrl" onClick={() => setPlaying((p) => !p)}>
              {playing ? '❚❚ Pause' : '► Play'}
            </button>
          </div>
        </div>
      </div>

      <div className="progress" style={{ width: `${progress * 100}%` }} />

      <Loader />
    </>
  );
}
