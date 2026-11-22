// Velvet Vault — The Meridian Heist: tuning constants and the shared palette.
// One job: every number the game balances on lives here, so tuning never
// means hunting through the logic files.

export const VIEW = { w: 1280, h: 720 };

// The thief.
export const PLAYER = {
  radius: 13,
  walkSpeed: 168,
  sneakSpeed: 96,
  dashSpeed: 430,
  dashTime: 0.16,
  dashCost: 34,
  staminaMax: 100,
  staminaRegen: 26,
  pickupRadius: 34,
  crackTime: 2.6,
};

// Guards and their eyes.
export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  chaseSpeed: 178,
  investigateSpeed: 118,
  viewRange: 235,
  viewFov: (68 * Math.PI) / 180,
  // Suspicion 0..1. Fills while the thief is inside a cone with line of sight.
  spotRateNear: 1.5, // per second, thief closer than 90px
  spotRateMid: 0.85, // per second, inside the cone at normal range
  spotRateFar: 0.45, // per second, at the cone's edge
  spotDecay: 0.55, // per second while unseen
  sneakFactor: 0.42, // sneaking fills suspicion this much slower
  shadowFactor: 0.5, // standing in a shadow tile fills this much slower
  catchRadius: 27,
  loseSightTime: 3.0, // seconds of no sight before a chase gives up
};

// CCTV cameras.
export const CAMERA = {
  viewRange: 250,
  viewFov: (52 * Math.PI) / 180,
  alarmRate: 16, // alarm points per second while the thief is in a camera cone
  sweepSpeed: 0.55, // radians per second
};

// Lasers.
export const LASER = {
  alarmHit: 24, // alarm points when the thief crosses a live beam
  cooldown: 2.0, // seconds before the same beam can sting again
};

// The alarm meter 0..100. At 100 the museum locks down and every guard hunts.
export const ALARM = {
  decay: 1.6, // points per second while nobody sees the thief
  chaseTrigger: 22, // alarm points added the moment a guard fully spots the thief
  lockdown: 100,
};

// Tools.
export const TOOLS = {
  coinsPerLevel: 3,
  coinLureRadius: 190, // a guard this close to a landed coin goes to look
  coinFlightTime: 0.45,
  smokesPerLevel: 2,
  smokeRadius: 95,
  smokeTime: 4.5,
};

// Scoring.
export const SCORE = {
  ghostBonus: 500, // finishing a level with the alarm never above 50
  timeBonusPerSecond: 12, // per second under par
  caughtPenalty: 250,
};

// Dusk-museum palette: deep blue night, warm gold, velvet red, marble cream.
export const PALETTE = {
  floorA: '#2b2f4a',
  floorB: '#262a42',
  carpet: '#6e1f2e',
  carpetEdge: '#8c2f3f',
  wall: '#171a2e',
  wallTop: '#3a4066',
  wallTrim: '#c9a227',
  pillar: '#232744',
  caseGlass: 'rgba(140, 200, 255, 0.16)',
  caseFrame: '#c9a227',
  shadow: 'rgba(8, 10, 24, 0.55)',
  gold: '#e8b93c',
  goldDim: '#9c7c22',
  sapphire: '#4fc3ff',
  diamond: '#bfe9ff',
  ledger: '#f2e3b3',
  guardBody: '#2f3a5e',
  guardCap: '#1c2340',
  thiefBody: '#0f766e',
  thiefHat: '#134e4a',
  coneCalm: 'rgba(232, 185, 60, 0.20)',
  coneSuspicious: 'rgba(255, 140, 40, 0.30)',
  coneChase: 'rgba(255, 60, 60, 0.34)',
  coneCamera: 'rgba(90, 200, 255, 0.20)',
  laser: '#ff2d55',
  hudBg: 'rgba(10, 12, 26, 0.82)',
  hudText: '#f2e8c9',
  hudDim: '#9aa3c7',
};
