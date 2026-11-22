// Velvet Vault: deterministic staged scenes for the screenshots.
// One job: put the game into a photogenic, fully real state — a mid-heist
// moment with the thief, guard cones, a camera cone, loot and the alarm
// meter all in one frame — for ?shot=cover|vault|getaway|win. Nothing is
// faked: the scene is the game's own state, drawn by its own renderer.

/** Stage the game for a screenshot. `name` is the ?shot= value. */
export function applyShot(G, name) {
  const stage = (levelIndex, setup) => {
    G.loadLevel(levelIndex);
    G.screen = 'play';
    G.time = 12.5;
    setup();
  };

  if (name === 'cover') {
    // Level 1, mid-crossing: the thief in the open hall, a guard's cone
    // sweeping toward them, the camera watching, the Sapphire glowing.
    stage(0, () => {
      G.player.x = 560;
      G.player.y = 430;
      G.player.angle = Math.PI / 4;
      G.lootTaken.add('painting-a');
      G.lootValue = 800;
      G.score = 800;
      G.alarm = 32;
      G.maxAlarm = 32;
      const [g1, g2] = G.guards;
      g1.x = 760;
      g1.y = 620;
      g1.angle = Math.PI * 1.15;
      g1.state = 'suspicious';
      g1.suspicion = 0.62;
      g1.lastSeen = { x: 560, y: 430 };
      g2.x = 900;
      g2.y = 120;
      g2.angle = Math.PI * 0.65;
      G.cameras[0].angle = (135 * Math.PI) / 180;
      G.cameras[0].phase = 0.4;
    });
    return;
  }

  if (name === 'vault') {
    // Level 2, at the vault door: cracking in progress, a laser tripped,
    // a guard closing in, the Diamond waiting behind the door.
    stage(1, () => {
      G.player.x = 830;
      G.player.y = 370;
      G.player.angle = 0;
      G.player.crackProgress = 0.55;
      G.lootTaken.add('gold-a');
      G.lootTaken.add('painting-c');
      G.lootValue = 2300;
      G.score = 2300;
      G.alarm = 55;
      G.maxAlarm = 55;
      const [, , g3] = G.guards;
      g3.x = 740;
      g3.y = 300;
      // Facing north, away from the thief: its cone sweeps the corridor
      // while the thief cracks the vault behind it, unseen.
      g3.angle = -Math.PI / 2;
      g3.state = 'patrol';
      g3.suspicion = 0;
      G.lasers[0].flash = 0.5;
      G.showMessage('CRACKING THE VAULT…', '#e8b93c', 99);
    });
    return;
  }

  if (name === 'getaway') {
    // Level 3, the run for the van: Ledger secured, alarm high, a guard
    // in full chase, the exit open and glowing.
    stage(2, () => {
      G.player.x = 700;
      G.player.y = 500;
      G.player.angle = -Math.PI / 3;
      G.lootTaken.add('ledger');
      G.lootTaken.add('gold-c');
      G.lootValue = 7500;
      G.score = 7500;
      G.exitOpen = true;
      G.alarm = 45;
      G.maxAlarm = 78;
      const [, , g3] = G.guards;
      g3.x = 560;
      g3.y = 420;
      g3.angle = Math.atan2(500 - 420, 700 - 560);
      // Suspicious, not chasing: a frozen stare with the '!' mark, so the
      // thief is not caught before the screenshot is taken.
      g3.state = 'suspicious';
      g3.suspicion = 0.9;
      g3.lastSeen = { x: 700, y: 500 };
      G.cameras[0].angle = Math.atan2(500 - 40, 700 - 1240);
      G.cameras[0].seesPlayer = true;
      G.showMessage('THE LEDGER IS YOURS — RUN!', '#4ade80', 99);
    });
    return;
  }

  if (name === 'win') {
    // The heist complete screen, with the final score on it.
    stage(2, () => {
      G.lootTaken.add('ledger');
      G.lootTaken.add('gold-c');
      G.lootTaken.add('gold-d');
      G.lootTaken.add('gold-e');
      // Match the real full-heist playtest win: $24,900 of $28,800.
      G.lootValue = 24900;
      G.score = 46863;
      G.exitOpen = true;
      G.alarm = 22;
      G.maxAlarm = 78;
      G.ghost = false;
      G.screen = 'win';
    });
    return;
  }

  // Unknown ?shot=: leave the title screen alone.
}
