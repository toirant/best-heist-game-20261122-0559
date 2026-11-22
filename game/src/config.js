// Shared constants for The Marlow Job: canvas size, palette, speeds and
// tuning for the alarm, the tools and the guards. One place, so the rest of
// the game reads like the rules of the heist instead of magic numbers.

export const VIEW_W = 1280;
export const VIEW_H = 800;

// Neon-noir palette: deep navy floors, gold loot, magenta danger.
export const COLORS = {
  floor: '#141428',
  floorAlt: '#191932',
  wall: '#2c2c4e',
  wallEdge: '#4a4a7d',
  gold: '#f5c542',
  goldDim: '#a8872e',
  magenta: '#ff4d8d',
  cyan: '#37e0d8',
  green: '#3ddc78',
  red: '#ff3b4e',
  cone: 'rgba(245, 197, 66, 0.20)',
  coneAlert: 'rgba(255, 59, 78, 0.30)',
  cameraCone: 'rgba(55, 224, 216, 0.16)',
  smoke: 'rgba(180, 180, 200, 0.55)',
  text: '#f2ead8',
  muted: '#9a94b8',
};

// Movement: walking is the quiet default, sneaking is slower and much
// harder to spot, and nobody in this gallery runs — running is loud.
export const PLAYER = {
  radius: 13,
  walkSpeed: 175,
  sneakSpeed: 100,
  // How much harder a sneaking thief is to spot (multiplies detection).
  sneakVisibility: 0.45,
};

// Vision: how far a guard or a camera can see, and how wide its cone is.
export const VISION = {
  guardRange: 260,
  guardHalfAngle: 0.52,
  cameraRange: 300,
  cameraHalfAngle: 0.42,
  // A thief closer than this is seen almost at once, cone or not.
  pointBlank: 42,
};

// The alarm meter (0-100). It climbs while anyone sees the thief and falls
// while nobody does. At 100 the job is blown and the run ends.
export const ALARM = {
  risePerSecond: 34,
  riseCloseMultiplier: 1.8,
  fallPerSecond: 9,
  // Below this, a guard is only curious; above it, the guard gives chase.
  chaseThreshold: 0.62,
};

// Tools cost money: every tool spends loot value, so using one is a real
// choice against the payout at the getaway.
export const TOOLS = {
  smokeCost: 150,
  smokeCount: 2,
  smokeSeconds: 3.5,
  empCost: 150,
  empCount: 1,
  empSeconds: 6,
  coinCount: 3,
  coinLureRadius: 320,
};

// Cracking the vault safe: stand in its ring and hold F.
export const SAFE = { crackSeconds: 2.5, radius: 64 };

// Guard behaviour.
export const GUARD = {
  patrolSpeed: 62,
  chaseSpeed: 148,
  investigateSpeed: 105,
  scanPauseSeconds: 1.6,
  suspicionRise: 1.15,
  suspicionFall: 0.45,
  catchRadius: 24,
};
