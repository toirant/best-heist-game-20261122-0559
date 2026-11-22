// The three rooms of the job. Each level is one floor plan: the outer
// walls, the cover inside it (pillars, display cases, crates — all of them
// block sight), the guards and their patrol routes, the sweeping cameras,
// the loot, the safe where there is one, the thief's entry point and the
// getaway door. Every room offers at least two routes to the target: a
// fast open lane under the cones, and a slow covered lane behind the cases.
//
// Coordinates are in the 1280x800 playfield. Walls are rectangles; the
// outer wall ring is listed first so collision and sight both treat the
// room as a closed box.

function outerWalls() {
  return [
    { x: 40, y: 40, w: 1200, h: 18 },
    { x: 40, y: 742, w: 1200, h: 18 },
    { x: 40, y: 40, w: 18, h: 720 },
    { x: 1222, y: 40, w: 18, h: 720 },
  ];
}

export const LEVELS = [
  {
    name: '1 — The Gallery',
    briefing: 'Lift the Star Sapphire from its pedestal. The paintings are worth a fortune too — if you dare.',
    entry: { x: 110, y: 690 },
    exit: { x: 1120, y: 660, w: 84, h: 62, label: 'SERVICE DOOR' },
    targetLoot: 900,
    walls: [
      ...outerWalls(),
      // Central sculpture row: cover down the middle, two lanes either side.
      { x: 420, y: 120, w: 26, h: 150 },
      { x: 420, y: 420, w: 26, h: 150 },
      { x: 830, y: 120, w: 26, h: 150 },
      { x: 830, y: 420, w: 26, h: 150 },
      // Display-case blocks the thief can crouch behind.
      { x: 560, y: 330, w: 160, h: 44 },
      { x: 560, y: 470, w: 160, h: 44 },
      { x: 180, y: 180, w: 120, h: 40 },
      { x: 980, y: 580, w: 120, h: 40 },
    ],
    loot: [
      { id: 'sapphire', kind: 'sapphire', name: 'Star Sapphire', value: 900, x: 640, y: 400 },
      { id: 'painting1', kind: 'painting', name: 'Lady in Gold', value: 400, x: 640, y: 66 },
      { id: 'painting2', kind: 'painting', name: 'Neon Dunes', value: 350, x: 70, y: 400 },
      { id: 'painting3', kind: 'painting', name: 'The Last Train', value: 350, x: 1210, y: 400 },
      { id: 'gem1', kind: 'gem', name: 'Ruby Brooch', value: 250, x: 300, y: 660 },
      { id: 'gem2', kind: 'gem', name: 'Jade Idol', value: 250, x: 960, y: 140 },
    ],
    guards: [
      { name: 'Rook', waypoints: [[300, 160], [980, 160], [980, 300], [300, 300]] },
      { name: 'Vera', waypoints: [[980, 640], [300, 640], [300, 500], [980, 500]] },
    ],
    cameras: [
      { x: 640, y: 58, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.45 },
      { x: 1222, y: 400, baseAngle: Math.PI, sweep: 0.8, speed: 0.6 },
    ],
    safe: null,
  },
  {
    name: '2 — The Vault Hall',
    briefing: 'The vault safe holds the Marlow Diamonds. Crack it — hold F inside the ring — then get out.',
    entry: { x: 110, y: 110 },
    exit: { x: 1120, y: 110, w: 84, h: 62, label: 'STAIRWELL' },
    targetLoot: 1200,
    walls: [
      ...outerWalls(),
      // Vault block in the centre: the safe sits behind it, two lanes round.
      { x: 540, y: 300, w: 200, h: 200 },
      { x: 300, y: 120, w: 26, h: 180 },
      { x: 954, y: 500, w: 26, h: 180 },
      { x: 180, y: 420, w: 140, h: 40 },
      { x: 960, y: 300, w: 140, h: 40 },
      { x: 620, y: 120, w: 40, h: 110 },
    ],
    loot: [
      { id: 'diamonds', kind: 'safe', name: 'Marlow Diamonds', value: 1200, x: 640, y: 400 },
      { id: 'painting4', kind: 'painting', name: 'Harbour Lights', value: 400, x: 640, y: 66 },
      { id: 'gem3', kind: 'gem', name: 'Opal Cuff', value: 300, x: 240, y: 640 },
      { id: 'gem4', kind: 'gem', name: 'Pearl Strand', value: 300, x: 1040, y: 640 },
      { id: 'gem5', kind: 'gem', name: 'Emerald Ring', value: 300, x: 1040, y: 200 },
    ],
    guards: [
      { name: 'Rook', waypoints: [[240, 240], [1040, 240], [1040, 560], [240, 560]] },
      { name: 'Vera', waypoints: [[640, 640], [640, 240], [420, 240], [420, 640]] },
      { name: 'Cole', waypoints: [[1040, 140], [240, 140], [240, 680], [1040, 680]] },
    ],
    cameras: [
      { x: 58, y: 400, baseAngle: 0, sweep: 0.9, speed: 0.5 },
      { x: 1222, y: 400, baseAngle: Math.PI, sweep: 0.9, speed: 0.5 },
      { x: 640, y: 742, baseAngle: -Math.PI / 2, sweep: 0.7, speed: 0.7 },
    ],
    safe: { x: 640, y: 400, lootId: 'diamonds' },
  },
  {
    name: '3 — The Rooftop',
    briefing: 'Last room. The Marlow Crown is on the roof terrace — grab it and run for the van.',
    entry: { x: 110, y: 690 },
    exit: { x: 1120, y: 660, w: 84, h: 62, label: 'GETAWAY VAN' },
    targetLoot: 1500,
    walls: [
      ...outerWalls(),
      // Rooftop planters and AC units: low cover, two lanes to the crown.
      { x: 300, y: 140, w: 180, h: 36 },
      { x: 800, y: 140, w: 180, h: 36 },
      { x: 300, y: 620, w: 180, h: 36 },
      { x: 800, y: 620, w: 180, h: 36 },
      { x: 560, y: 300, w: 160, h: 40 },
      { x: 560, y: 460, w: 160, h: 40 },
      { x: 180, y: 360, w: 40, h: 130 },
      { x: 1060, y: 360, w: 40, h: 130 },
    ],
    loot: [
      { id: 'crown', kind: 'crown', name: 'Marlow Crown', value: 1500, x: 640, y: 400 },
      { id: 'painting5', kind: 'painting', name: 'Rooftop Dusk', value: 450, x: 640, y: 66 },
      { id: 'gem6', kind: 'gem', name: 'Sapphire Studs', value: 350, x: 240, y: 400 },
      { id: 'gem7', kind: 'gem', name: 'Gold Pocket Watch', value: 350, x: 1040, y: 400 },
      { id: 'gem8', kind: 'gem', name: 'Diamond Tie Pin', value: 350, x: 640, y: 680 },
    ],
    guards: [
      { name: 'Rook', waypoints: [[240, 180], [1040, 180], [1040, 360], [240, 360]] },
      { name: 'Vera', waypoints: [[1040, 620], [240, 620], [240, 440], [1040, 440]] },
      { name: 'Cole', waypoints: [[640, 140], [640, 660], [420, 660], [420, 140]] },
      { name: 'Mara', waypoints: [[1040, 300], [240, 300], [240, 500], [1040, 500]] },
    ],
    cameras: [
      { x: 640, y: 58, baseAngle: Math.PI / 2, sweep: 1.0, speed: 0.55 },
      { x: 58, y: 400, baseAngle: 0, sweep: 0.8, speed: 0.65 },
      { x: 1222, y: 400, baseAngle: Math.PI, sweep: 0.8, speed: 0.65 },
      { x: 640, y: 742, baseAngle: -Math.PI / 2, sweep: 1.0, speed: 0.5 },
    ],
    safe: null,
  },
];
