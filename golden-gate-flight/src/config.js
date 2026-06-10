import * as THREE from 'three';

/**
 * Shared world configuration. Everything is laid out along the +X axis
 * (the direction of the roadway). Z is the width of the bridge, Y is up.
 * Units are roughly metres but compressed for a pleasing cinematic frame.
 */
export const WORLD = {
  // Vertical reference levels
  waterY: 0,
  deckY: 22, // roadway height above the water (~67m in reality, compressed)
  towerTopY: 76,
  towerBaseY: -6, // tower footings sink below the waterline

  // Span layout along X
  towerX: 110, // towers sit at x = -110 and x = +110 (≈ 1280m main span)
  anchorX: 250, // cable anchorages on shore
  deckHalfLen: 260, // roadway extends a little past the anchorages

  // Bridge width (Z)
  halfWidth: 13, // cables/legs sit at z = ±13 (≈ 27m deck width)

  towerLegWidth: 5,
};

// International Orange — the bridge's actual signature paint.
export const COLORS = {
  orange: '#c0362c',
  orangeDark: '#8f2419',
  deck: '#3b3b40',
  cable: '#7a2417',
};

/**
 * The cinematic flight path. A Catmull-Rom curve the camera glides along,
 * paired with a separate look-at curve so the camera always frames the
 * bridge as it banks, dives toward the water, threads the towers and pulls
 * back for the hero shot.
 */
export const FLIGHT_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-470, 70, 150), // open on the ocean approach, high
    new THREE.Vector3(-330, 40, 95), // descend toward the water
    new THREE.Vector3(-210, 24, 40), // skim low, racing the deck
    new THREE.Vector3(-110, 30, 16), // rise to thread the south tower
    new THREE.Vector3(-20, 46, 6), // climb over mid-span cables
    new THREE.Vector3(95, 34, -14), // bank through the north tower
    new THREE.Vector3(210, 52, -70), // sweep out and up past the anchorage
    new THREE.Vector3(330, 120, -150), // pull back for the hero reveal
    new THREE.Vector3(470, 175, -250), // drift out high over the strait
  ],
  false,
  'catmullrom',
  0.5
);

export const LOOK_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-300, 35, 60),
    new THREE.Vector3(-180, 26, 30),
    new THREE.Vector3(-90, 28, 10),
    new THREE.Vector3(-20, 34, 0),
    new THREE.Vector3(40, 40, -6),
    new THREE.Vector3(120, 36, -20),
    new THREE.Vector3(60, 44, -10), // look back at the towers during the pull-out
    new THREE.Vector3(-20, 55, 0),
    new THREE.Vector3(-120, 60, 20),
  ],
  false,
  'catmullrom',
  0.5
);

// Narration chapters keyed to flight progress (0..1).
export const CHAPTERS = [
  { at: 0.0, text: 'Approaching from the Pacific' },
  { at: 0.2, text: 'Skimming the strait' },
  { at: 0.38, text: 'Threading the south tower' },
  { at: 0.55, text: 'Over the main span' },
  { at: 0.72, text: 'Past the north tower' },
  { at: 0.86, text: 'The hero reveal' },
];
