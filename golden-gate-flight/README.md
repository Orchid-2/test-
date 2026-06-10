# Golden Gate — A Cinematic Flight

A real-time, cinematic React experience that flies the camera across the Golden
Gate Bridge. The bridge, ocean, sky and fog are all generated procedurally — no
external 3D assets, textures or HDRIs are downloaded — so it loads fast and runs
on phones as well as desktops.

![International Orange](https://img.shields.io/badge/paint-International%20Orange-c0362c)

## What's inside

- **Procedural bridge** (`src/components/Bridge.jsx`) — two art-deco stepped
  towers, parabolic main-span cables plus straight side spans, instanced
  vertical suspenders, the roadway deck with stiffening truss, railings and lane
  markings, shore anchorages and in-water piers. Painted in the bridge's real
  *International Orange*.
- **Custom ocean shader** (`src/components/Ocean.jsx`) — summed Gerstner waves
  with analytic normals, Schlick–Fresnel sky reflection, and a sharp moving sun
  specular. Integrates with scene fog. No water textures required.
- **Atmosphere** (`src/components/Atmosphere.jsx`) — physically-based sky, a
  golden-hour sun, the bridge's signature rolling marine-layer fog (drifting
  volumetric clouds + exponential fog), and a tiny self-contained environment map
  (rendered from Lightformers) so the steelwork has something to reflect.
- **Camera rig** (`src/components/CameraRig.jsx`) — a Catmull-Rom flight path
  with a separate look-at path, smootherstep easing, subtle handheld float, and
  looping playback that drives the on-screen chapter HUD.

## Mobile compatibility

- Device-tier detection (`detectQuality` in `src/App.jsx`) drops to a **low**
  profile on smaller / lower-core / lower-memory phones: fewer ocean segments and
  suspenders, lighter fog, shadows and post-processing disabled, capped DPR.
- Clamped `dpr` (`[1, 1.5]` on mobile, `[1, 2]` otherwise) to protect fill rate.
- `touch-action: none`, disabled overscroll/zoom, safe-area insets for notches,
  and 44px touch targets in the HUD.
- `viewport-fit=cover` + `theme-color` for an immersive full-bleed look.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

## Tech

React 18 · Vite · three.js · @react-three/fiber · @react-three/drei ·
@react-three/postprocessing
