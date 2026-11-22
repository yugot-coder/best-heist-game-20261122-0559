// Velvet Vault: the thief.
// One job: move the thief — walk, sneak, dash — against the walls, and
// hold the thief's tools, stamina and facing. Interactions (loot, coins,
// smoke, the vault) live in main.js.

import { PLAYER, TOOLS } from './config.js';
import { circleHitsRect, resolveCircleRect, pointInRect } from './vision.js';

/** The thief: position, facing, stamina, tools, and movement. */
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER.radius;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.stamina = PLAYER.staminaMax;
    this.dashT = 0;
    this.dashDir = { x: 0, y: -1 };
    this.coins = TOOLS.coinsPerLevel;
    this.smokes = TOOLS.smokesPerLevel;
    this.stepT = 0;
    this.crackProgress = 0;
  }

  /** True when the thief stands in a shadow tile. */
  inShadow(shadows) {
    return shadows.some((s) => pointInRect(this.x, this.y, s));
  }

  /** Start a dash in the current move direction (or facing) if stamina allows. */
  tryDash(mx, my) {
    if (this.dashT > 0 || this.stamina < PLAYER.dashCost) return false;
    this.stamina -= PLAYER.dashCost;
    this.dashT = PLAYER.dashTime;
    if (mx !== 0 || my !== 0) {
      const d = Math.hypot(mx, my);
      this.dashDir = { x: mx / d, y: my / d };
    } else {
      this.dashDir = { x: Math.cos(this.angle), y: Math.sin(this.angle) };
    }
    return true;
  }

  /** One tick of movement and stamina. Returns true when a footstep sounded. */
  update(dt, input, walls) {
    const vec = input.moveVector();
    this.sneaking = input.held('Shift');
    let stepped = false;

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.move(this.dashDir.x, this.dashDir.y, PLAYER.dashSpeed * dt, walls);
      this.moving = true;
    } else if (vec.x !== 0 || vec.y !== 0) {
      const speed = this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
      this.move(vec.x, vec.y, speed * dt, walls);
      this.angle = Math.atan2(vec.y, vec.x);
      this.moving = true;
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.stepT = this.sneaking ? 0.42 : 0.3;
        stepped = true;
      }
    } else {
      this.moving = false;
    }

    if (this.dashT <= 0) {
      this.stamina = Math.min(PLAYER.staminaMax, this.stamina + PLAYER.staminaRegen * dt);
    }
    return stepped;
  }

  /** Move one step, sliding along walls (axis-separated, circle vs rect). */
  move(dx, dy, dist, walls) {
    const nx = this.x + dx * dist;
    if (!this.hitsWall(nx, this.y, walls)) this.x = nx;
    const ny = this.y + dy * dist;
    if (!this.hitsWall(this.x, ny, walls)) this.y = ny;
    // Resolve any residual overlap (corners).
    for (const w of walls) {
      if (circleHitsRect(this.x, this.y, this.radius, w)) {
        [this.x, this.y] = resolveCircleRect(this.x, this.y, this.radius, w);
      }
    }
  }

  hitsWall(x, y, walls) {
    for (const w of walls) {
      if (circleHitsRect(x, y, this.radius, w)) return true;
    }
    return false;
  }
}

/** A thrown coin: flies to its target, lands, and lures nearby guards. */
export class Coin {
  constructor(x, y, tx, ty) {
    this.x = x;
    this.y = y;
    this.tx = tx;
    this.ty = ty;
    this.t = 0;
    this.flight = TOOLS.coinFlightTime;
    this.landed = false;
    this.life = 6; // seconds the coin keeps luring after landing
  }

  update(dt) {
    if (!this.landed) {
      this.t += dt / this.flight;
      if (this.t >= 1) {
        this.t = 1;
        this.landed = true;
      }
      this.x += (this.tx - this.x) * Math.min(1, dt * 10);
      this.y += (this.ty - this.y) * Math.min(1, dt * 10);
    } else {
      this.life -= dt;
    }
  }

  get done() {
    return this.landed && this.life <= 0;
  }
}

/** A smoke cloud that blocks every vision cone while it lasts. */
export class Smoke {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = TOOLS.smokeRadius;
    this.life = TOOLS.smokeTime;
  }

  update(dt) {
    this.life -= dt;
  }

  get done() {
    return this.life <= 0;
  }
}
