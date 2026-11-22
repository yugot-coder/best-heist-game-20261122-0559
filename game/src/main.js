// Velvet Vault: the game itself.
// One job: own the state machine (title, briefing, play, caught, win),
// run one tick of everything, and wire input to tools, loot, the vault
// and the exit. Rendering lives in render.js; brains live in guards.js.

import { VIEW, PLAYER, TOOLS, SCORE, ALARM, GUARD } from './config.js';
import { LEVELS } from './levels.js';
import { Guard } from './guards.js';
import { Camera, Laser } from './cameras.js';
import { Player, Coin, Smoke } from './player.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { drawGame, fmtMoney } from './render.js';
import { applyShot } from './shots.js';
import { mulberry32, range } from './random.js';
import { pointInRect } from './vision.js';

/** The whole game state, handed to the renderer as one object. */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sound = new SoundBank();
    this.screen = 'title';
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.player = null;
    this.guards = [];
    this.cameras = [];
    this.lasers = [];
    this.coins = [];
    this.smokes = [];
    this.particles = [];
    this.lootTaken = new Set();
    this.alarm = 0;
    this.maxAlarm = 0;
    this.lootValue = 0;
    this.score = 0;
    this.time = 0;
    this.levelTime = 0;
    this.exitOpen = false;
    this.vaultOpen = false;
    this.message = '';
    this.messageT = 0;
    this.messageColor = null;
    this.ghost = true;
    this.levelsTotal = LEVELS.reduce((n, l) => n + l.loot.reduce((m, x) => m + x.value, 0), 0);
    this.lootValueAtLevelStart = 0;
    this.rng = mulberry32(20261122);
    this.lastTs = 0;
    this.loadLevel(0);
    this.screen = 'title';

    // Screenshot staging: ?shot=cover|vault|getaway|win (deterministic).
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) applyShot(this, shot);
  }

  /** (Re)build the current level's entities from its definition. */
  loadLevel(i) {
    this.levelIndex = i;
    this.level = LEVELS[i];
    const [sx, sy] = this.level.playerStart;
    this.player = new Player(sx, sy);
    this.guards = this.level.guards.map((g) => new Guard(g));
    this.cameras = this.level.cameras.map((c) => new Camera(c));
    this.lasers = this.level.lasers.map((l) => new Laser(l));
    this.coins = [];
    this.smokes = [];
    this.particles = [];
    this.lootTaken = new Set();
    this.alarm = this.level.alarmStart;
    this.maxAlarm = this.level.alarmStart;
    this.levelTime = 0;
    this.exitOpen = false;
    this.vaultOpen = false;
    this.message = '';
    this.messageT = 0;
    this.lootValueAtLevelStart = this.lootValue;
    this.rng = mulberry32(20261122 + i * 7919);
  }

  showMessage(text, color = null, dur = 2.2) {
    this.message = text;
    this.messageColor = color;
    this.messageT = dur;
  }

  addAlarm(amount, x = null, y = null) {
    const before = this.alarm;
    this.alarm = Math.min(100, this.alarm + amount);
    this.maxAlarm = Math.max(this.maxAlarm, this.alarm);
    if (this.alarm >= 100) this.ghost = false;
    if (before < 100 && this.alarm >= 100) this.lockdown();
  }

  /** Lockdown: every guard hunts the thief's last known position. */
  lockdown() {
    this.showMessage('LOCKDOWN! EVERY GUARD IS HUNTING YOU', '#ef4444', 2.6);
    this.sound.spotted();
    for (const g of this.guards) {
      g.lastSeen = { x: this.player.x, y: this.player.y };
      if (g.state !== 'chase') {
        g.state = 'chase';
        g.stateT = 0;
      }
    }
  }

  /** Sparkles over a picked-up loot piece. */
  burst(x, y, color, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const d = range(this.rng, 6, 34);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * d,
        vy: Math.sin(a) * d - 12,
        life: range(this.rng, 0.4, 0.9),
        maxLife: 0.9,
        color,
        size: range(this.rng, 1.5, 3.5),
      });
    }
  }

  /** Collect loot the thief walks over (the vault's diamond needs the crack first). */
  collectLoot() {
    for (const loot of this.level.loot) {
      if (this.lootTaken.has(loot.id)) continue;
      if (loot.main && this.level.vaultDoor && !this.vaultOpen) continue;
      const d = Math.hypot(loot.x - this.player.x, loot.y - this.player.y);
      if (d < PLAYER.pickupRadius) {
        this.lootTaken.add(loot.id);
        this.lootValue += loot.value;
        this.score += loot.value;
        this.sound.pickup(loot.value);
        this.burst(loot.x, loot.y, loot.kind === 'sapphire' ? '#4fc3ff' : loot.kind === 'diamond' ? '#bfe9ff' : '#e8b93c');
        const name = loot.kind === 'sapphire' ? 'STAR SAPPHIRE' : loot.kind === 'diamond' ? 'MERIDIAN DIAMOND' : loot.kind === 'ledger' ? 'THE LEDGER' : 'LOOT';
        this.showMessage(`${name} — +${fmtMoney(loot.value)}`, '#e8b93c');
        if (loot.main) {
          this.exitOpen = true;
          this.showMessage(`${name} SECURED — GET TO THE EXIT!`, '#4ade80', 2.6);
        }
      }
    }
  }

  /** Hold E by the vault door to crack it. */
  crackVault(dt) {
    if (!this.level.vaultDoor || this.vaultOpen) {
      this.player.crackProgress = 0;
      return;
    }
    const d = Math.hypot(this.level.vaultDoor.x - this.player.x, this.level.vaultDoor.y - this.player.y);
    const holding = this.input.held('e') && d < 70;
    if (holding) {
      this.player.crackProgress += dt / PLAYER.crackTime;
      if (Math.random() < dt * 6) this.sound.crackTick();
      if (this.player.crackProgress >= 1) {
        this.player.crackProgress = 0;
        this.vaultOpen = true;
        this.sound.vaultOpen();
        this.showMessage('VAULT CRACKED — THE DIAMOND IS YOURS', '#4ade80', 2.6);
      }
    } else {
      this.player.crackProgress = Math.max(0, this.player.crackProgress - dt * 0.8);
    }
  }

  throwCoin(tx, ty) {
    if (this.player.coins <= 0) {
      this.showMessage('No coins left', '#f87171', 1.2);
      return;
    }
    this.player.coins -= 1;
    // Clamp the throw to a believable arc.
    const dx = tx - this.player.x;
    const dy = ty - this.player.y;
    const d = Math.hypot(dx, dy);
    const max = 280;
    const k = d > max ? max / d : 1;
    const coin = new Coin(this.player.x, this.player.y, this.player.x + dx * k, this.player.y + dy * k);
    this.coins.push(coin);
    this.sound.coinThrow();
  }

  throwSmoke() {
    if (this.player.smokes <= 0) {
      this.showMessage('No smoke bombs left', '#f87171', 1.2);
      return;
    }
    this.player.smokes -= 1;
    this.smokes.push(new Smoke(this.player.x, this.player.y));
    this.sound.smoke();
    this.showMessage('SMOKE — you are invisible inside the cloud', '#cbd5e1', 1.6);
  }

  /** One tick of the play screen. */
  updatePlay(dt) {
    const p = this.player;
    this.levelTime += dt;

    // Tools.
    if (this.input.wasPressed(' ')) {
      if (p.tryDash(...Object.values(this.input.moveVector()))) this.sound.dash();
    }
    if (this.input.wasPressed('q')) this.throwSmoke();
    for (const c of this.input.takeClicks()) this.throwCoin(c.x, c.y);

    const stepped = p.update(dt, this.input, this.level.walls);
    if (stepped) this.sound.step(p.sneaking);
    this.crackVault(dt);
    this.collectLoot();

    // Coins lure guards when they land.
    for (const coin of this.coins) {
      const wasLanded = coin.landed;
      coin.update(dt);
      if (coin.landed && !wasLanded) {
        this.sound.coinLand();
        for (const g of this.guards) {
          if (g.distTo(coin.x, coin.y) < TOOLS.coinLureRadius) g.investigatePoint(coin.x, coin.y);
        }
      }
    }
    this.coins = this.coins.filter((c) => !c.done);
    for (const s of this.smokes) s.update(dt);
    this.smokes = this.smokes.filter((s) => !s.done);

    // Guards.
    let anySees = false;
    for (const g of this.guards) {
      g.update(dt, {
        player: p,
        walls: this.level.walls,
        shadows: this.level.shadows,
        smokes: this.smokes,
        onSpotted: () => {
          this.addAlarm(ALARM.chaseTrigger);
          this.showMessage('SPOTTED!', '#ef4444', 1.6);
          this.sound.spotted();
        },
        onFootstep: (guard) => {
          if (guard.distTo(p.x, p.y) < 340) this.sound.step(false);
        },
      });
      if (g.seesPlayer) anySees = true;
      // Caught: a chasing guard lays hands on the thief.
      if (g.state === 'chase' && g.distTo(p.x, p.y) < GUARD.catchRadius) {
        this.caught();
        return;
      }
    }

    // Cameras.
    for (const cam of this.cameras) {
      cam.update(dt, {
        player: p,
        walls: this.level.walls,
        smokes: this.smokes,
        addAlarm: (amount) => this.addAlarm(amount),
        onCameraPing: () => this.sound.cameraPing(),
      });
      if (cam.seesPlayer) anySees = true;
    }

    // Lasers.
    for (const laser of this.lasers) {
      laser.update(dt, {
        player: p,
        onLaserTrip: (l) => {
          this.sound.laserTrip();
          this.showMessage('LASER TRIPPED!', '#ef4444', 1.6);
          for (const g of this.guards) {
            if (g.distTo(p.x, p.y) < 420) g.investigatePoint(p.x, p.y);
          }
        },
      });
    }

    // The alarm cools while nobody sees the thief.
    if (!anySees && this.alarm > 0) {
      this.alarm = Math.max(0, this.alarm - ALARM.decay * dt);
    }

    // Particles.
    for (const pt of this.particles) {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 30 * dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);

    // Exit: reach it with the main loot to clear the room.
    if (this.exitOpen && pointInRect(p.x, p.y, this.level.exit, 4)) {
      this.levelClear();
    }
  }

  levelClear() {
    const timeBonus = Math.max(0, Math.round((this.level.par - this.levelTime) * SCORE.timeBonusPerSecond));
    const ghostBonus = this.maxAlarm <= 50 ? SCORE.ghostBonus : 0;
    this.score += timeBonus + ghostBonus;
    this.sound.levelClear();
    this.screen = 'leveldone';
  }

  caught() {
    this.score = Math.max(0, this.score - SCORE.caughtPenalty);
    this.sound.caught();
    this.screen = 'caught';
  }

  /** One tick for any screen. */
  update(dt) {
    this.time += dt;
    if (this.messageT > 0) this.messageT -= dt;

    if (this.screen === 'title') {
      if (this.input.wasPressed('Enter') || this.input.takeClicks().length > 0) {
        this.sound.ensure();
        this.sound.startAmbience();
        this.screen = 'briefing';
      }
      return;
    }
    if (this.screen === 'briefing') {
      if (this.input.wasPressed('Enter')) {
        this.screen = 'play';
      }
      return;
    }
    if (this.screen === 'play') {
      if (this.input.wasPressed('p')) {
        this.screen = 'paused';
        return;
      }
      if (this.input.wasPressed('m')) {
        const muted = this.sound.toggleMute();
        this.showMessage(muted ? 'Sound muted' : 'Sound on', null, 1.2);
      }
      this.updatePlay(dt);
      return;
    }
    if (this.screen === 'paused') {
      if (this.input.wasPressed('p')) this.screen = 'play';
      return;
    }
    if (this.screen === 'leveldone') {
      if (this.input.wasPressed('Enter')) {
        if (this.levelIndex + 1 < LEVELS.length) {
          this.loadLevel(this.levelIndex + 1);
          this.screen = 'briefing';
        } else {
          this.screen = 'win';
          this.sound.heistWin();
        }
      }
      return;
    }
    if (this.screen === 'caught') {
      if (this.input.wasPressed('Enter')) {
        this.lootValue = this.lootValueAtLevelStart;
        this.loadLevel(this.levelIndex);
        this.screen = 'briefing';
      }
      return;
    }
    if (this.screen === 'win') {
      if (this.input.wasPressed('r')) {
        this.score = 0;
        this.lootValue = 0;
        this.ghost = true;
        this.loadLevel(0);
        this.screen = 'briefing';
      }
    }
  }

  frame(ts) {
    const dt = Math.min(0.05, this.lastTs ? (ts - this.lastTs) / 1000 : 0.016);
    this.lastTs = ts;
    this.update(dt);
    drawGame(this.ctx, this);
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  start() {
    requestAnimationFrame((t) => this.frame(t));
  }
}

/** Boot the game when the page loads. */
export function boot() {
  const canvas = document.getElementById('game');
  const game = new Game(canvas);
  // A debug handle for playtesting: read state, never cheat the score.
  window.__heist = game;
  game.start();
  return game;
}
