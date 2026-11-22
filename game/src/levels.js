// Velvet Vault: the three rooms of the heist.
// One job: hand-authored level data — walls, patrols, cameras, lasers,
// loot, shadows and exits — for the Gallery, the Vault and the Getaway.
// All coordinates are canvas pixels on a 1280x720 floor.

const T = 24; // border wall thickness

function border() {
  return [
    { x: 0, y: 0, w: 1280, h: T },
    { x: 0, y: 720 - T, w: 1280, h: T },
    { x: 0, y: 0, w: T, h: 720 },
    { x: 1280 - T, y: 0, w: T, h: 720 },
  ];
}

/**
 * A level:
 *  name, subtitle, objective, par (seconds), alarmStart
 *  walls: rectangles that block movement and sight
 *  shadows: dark floor tiles where the thief is harder to spot
 *  loot: { id, kind, x, y, value, main } — main loot unlocks the exit
 *  guards: { x, y, waypoints, speed }
 *  cameras: { x, y, angle, sweep }
 *  lasers: { x1, y1, x2, y2 }
 *  playerStart: [x, y]
 *  exit: { x, y, w, h, label }
 *  vaultDoor: { x, y } — stand here and hold E to crack (level 2 only)
 */
export const LEVELS = [
  {
    name: 'LEVEL 1 — THE GALLERY',
    subtitle: 'The Meridian Museum, 11:47 PM',
    objective: 'Lift the Star Sapphire, then slip out the service door.',
    par: 90,
    alarmStart: 0,
    walls: [
      ...border(),
      { x: 24, y: 230, w: 420, h: 22 },
      { x: 700, y: 230, w: 556, h: 22 },
      { x: 24, y: 470, w: 300, h: 22 },
      { x: 560, y: 470, w: 696, h: 22 },
      { x: 880, y: 252, w: 22, h: 218 },
      { x: 300, y: 330, w: 90, h: 50 },
      { x: 880, y: 330, w: 90, h: 50 },
      { x: 520, y: 560, w: 120, h: 50 },
      { x: 180, y: 560, w: 90, h: 50 },
      { x: 480, y: 330, w: 26, h: 26 },
      { x: 760, y: 560, w: 26, h: 26 },
    ],
    shadows: [
      { x: 170, y: 300, w: 150, h: 130 },
      { x: 960, y: 300, w: 150, h: 130 },
      { x: 620, y: 520, w: 180, h: 120 },
    ],
    loot: [
      { id: 'sapphire', kind: 'sapphire', x: 640, y: 360, value: 5000, main: true },
      { id: 'painting-a', kind: 'painting', x: 150, y: 90, value: 800 },
      { id: 'painting-b', kind: 'painting', x: 1130, y: 90, value: 800 },
      { id: 'vase', kind: 'vase', x: 1120, y: 610, value: 500 },
    ],
    guards: [
      { x: 150, y: 400, waypoints: [[150, 400], [620, 400], [1080, 400]], speed: 62 },
      { x: 150, y: 120, waypoints: [[150, 120], [620, 120], [1080, 120]], speed: 62 },
    ],
    cameras: [{ x: 1240, y: 40, angle: (135 * Math.PI) / 180, sweep: 0.6 }],
    lasers: [],
    playerStart: [80, 660],
    exit: { x: 1180, y: 640, w: 60, h: 56, label: 'SERVICE DOOR' },
    vaultDoor: null,
  },
  {
    name: 'LEVEL 2 — THE VAULT',
    subtitle: 'Below the museum, 12:31 AM',
    objective: 'Crack the vault door, take the Meridian Diamond, reach the exit.',
    par: 120,
    alarmStart: 0,
    walls: [
      ...border(),
      { x: 860, y: 240, w: 340, h: 22 },
      { x: 860, y: 498, w: 340, h: 22 },
      { x: 1178, y: 240, w: 22, h: 280 },
      { x: 860, y: 240, w: 22, h: 110 },
      { x: 860, y: 390, w: 22, h: 130 },
      { x: 300, y: 300, w: 90, h: 50 },
      { x: 500, y: 400, w: 90, h: 50 },
      { x: 200, y: 120, w: 26, h: 26 },
      { x: 620, y: 560, w: 26, h: 26 },
    ],
    shadows: [
      { x: 100, y: 250, w: 130, h: 110 },
      { x: 600, y: 500, w: 150, h: 110 },
      { x: 700, y: 90, w: 130, h: 110 },
    ],
    loot: [
      { id: 'diamond', kind: 'diamond', x: 1030, y: 380, value: 8000, main: true },
      { id: 'gold-a', kind: 'gold', x: 200, y: 300, value: 1500 },
      { id: 'gold-b', kind: 'gold', x: 420, y: 610, value: 1200 },
      { id: 'painting-c', kind: 'painting', x: 640, y: 90, value: 800 },
    ],
    guards: [
      { x: 150, y: 600, waypoints: [[150, 600], [700, 600]], speed: 66 },
      { x: 150, y: 120, waypoints: [[150, 120], [700, 120]], speed: 66 },
      { x: 740, y: 150, waypoints: [[740, 150], [740, 600]], speed: 60 },
    ],
    cameras: [
      { x: 40, y: 40, angle: (45 * Math.PI) / 180, sweep: 0.7 },
      { x: 1240, y: 680, angle: (225 * Math.PI) / 180, sweep: 0.7 },
    ],
    lasers: [
      { x1: 800, y1: 260, x2: 800, y2: 500 },
      { x1: 300, y1: 180, x2: 700, y2: 180 },
    ],
    playerStart: [80, 660],
    exit: { x: 60, y: 640, w: 60, h: 56, label: 'STAIRWELL' },
    vaultDoor: { x: 872, y: 370 },
  },
  {
    name: 'LEVEL 3 — THE GETAWAY',
    subtitle: 'The counting house, 1:12 AM — the heat is on',
    objective: 'Grab the Ledger and reach the getaway van. The alarm is already warm.',
    par: 120,
    alarmStart: 25,
    walls: [
      ...border(),
      { x: 24, y: 300, w: 360, h: 22 },
      { x: 896, y: 300, w: 360, h: 22 },
      { x: 24, y: 520, w: 300, h: 22 },
      { x: 980, y: 520, w: 276, h: 22 },
      { x: 320, y: 200, w: 30, h: 30 },
      { x: 640, y: 200, w: 30, h: 30 },
      { x: 960, y: 200, w: 30, h: 30 },
      { x: 320, y: 480, w: 30, h: 30 },
      { x: 640, y: 480, w: 30, h: 30 },
      { x: 960, y: 480, w: 30, h: 30 },
    ],
    shadows: [
      { x: 90, y: 330, w: 160, h: 130 },
      { x: 1030, y: 330, w: 160, h: 130 },
      { x: 560, y: 560, w: 160, h: 110 },
    ],
    loot: [
      { id: 'ledger', kind: 'ledger', x: 560, y: 400, value: 6000, main: true },
      { id: 'gold-c', kind: 'gold', x: 200, y: 200, value: 1500 },
      { id: 'gold-d', kind: 'gold', x: 1080, y: 200, value: 1500 },
      { id: 'gold-e', kind: 'gold', x: 1080, y: 610, value: 1200 },
    ],
    guards: [
      { x: 150, y: 650, waypoints: [[150, 650], [1130, 650]], speed: 70 },
      { x: 150, y: 80, waypoints: [[150, 80], [1130, 80]], speed: 70 },
      { x: 480, y: 420, waypoints: [[480, 420], [800, 420]], speed: 64 },
    ],
    cameras: [
      { x: 1240, y: 40, angle: (135 * Math.PI) / 180, sweep: 0.7 },
      { x: 40, y: 680, angle: (315 * Math.PI) / 180, sweep: 0.7 },
    ],
    lasers: [
      { x1: 640, y1: 330, x2: 640, y2: 500 },
      { x1: 200, y1: 120, x2: 1080, y2: 120 },
    ],
    playerStart: [80, 80],
    exit: { x: 1150, y: 60, w: 80, h: 60, label: 'GETAWAY VAN' },
    vaultDoor: null,
  },
];
