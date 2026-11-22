// Velvet Vault: the guards who walk the museum at night.
// One job: one guard's brain — patrol, suspicion, chase, investigate,
// return — and the question "does this guard see the thief right now?"

import { GUARD } from './config.js';
import { canSee, pointInRect } from './vision.js';

/** A patrolling guard with a vision cone and a suspicion meter. */
export class Guard {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.waypoints = def.waypoints.map(([x, y]) => ({ x, y }));
    this.speed = def.speed ?? GUARD.patrolSpeed;
    this.wpIndex = 1 % this.waypoints.length;
    this.angle = Math.atan2(
      this.waypoints[this.wpIndex].y - this.y,
      this.waypoints[this.wpIndex].x - this.x,
    );
    this.state = 'patrol'; // patrol | suspicious | chase | investigate | return
    this.suspicion = 0;
    this.stateT = 0;
    this.lastSeen = null;
    this.lookTarget = null;
    this.noSightT = 0;
    this.seesPlayer = false;
    this.stepT = 0;
  }

  /** Distance to a point. */
  distTo(x, y) {
    return Math.hypot(x - this.x, y - this.y);
  }

  /** True when the thief stands in a shadow tile. */
  inShadow(px, py, shadows) {
    return shadows.some((s) => pointInRect(px, py, s));
  }

  /**
   * One tick. ctx: { player, walls, shadows, smokes, dt, onSpotted, onFootstep }.
   * Returns nothing; the guard moves, turns and changes state in place.
   */
  update(dt, ctx) {
    const { player, walls, shadows, smokes } = ctx;
    this.stateT += dt;

    // Vision: blocked by smoke, then cone + line of sight.
    const inSmoke = smokes.some((s) => Math.hypot(player.x - s.x, player.y - s.y) < s.radius);
    const seen =
      !inSmoke && canSee(this.x, this.y, this.angle, GUARD.viewFov, GUARD.viewRange, player.x, player.y, walls);
    this.seesPlayer = seen;

    // Suspicion fills while seen, faster up close; sneaking and shadows slow it.
    if (seen) {
      const d = this.distTo(player.x, player.y);
      let rate = d < 90 ? GUARD.spotRateNear : d < 170 ? GUARD.spotRateMid : GUARD.spotRateFar;
      if (player.sneaking) rate *= GUARD.sneakFactor;
      if (this.inShadow(player.x, player.y, shadows)) rate *= GUARD.shadowFactor;
      this.suspicion = Math.min(1, this.suspicion + rate * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.noSightT = 0;
      if (this.suspicion >= 1 && this.state !== 'chase') {
        this.state = 'chase';
        this.stateT = 0;
        ctx.onSpotted(this);
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - GUARD.spotDecay * dt);
      if (this.state === 'chase') {
        this.noSightT += dt;
        if (this.noSightT >= GUARD.loseSightTime) {
          this.state = 'investigate';
          this.stateT = 0;
        }
      }
    }

    if (this.state === 'suspicious' && this.suspicion <= 0.02) {
      this.state = 'patrol';
      this.stateT = 0;
    }
    if (this.state === 'patrol' && this.suspicion > 0.25) {
      this.state = 'suspicious';
      this.stateT = 0;
    }

    // Movement per state.
    if (this.state === 'patrol') {
      this.walkToward(this.waypoints[this.wpIndex], this.speed, dt, () => {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      });
    } else if (this.state === 'suspicious') {
      // Freeze and stare at the last glimpse for a beat, then resume.
      if (this.lastSeen) this.turnToward(this.lastSeen.x, this.lastSeen.y, dt, 6);
      if (this.stateT > 1.1) {
        this.state = 'patrol';
        this.stateT = 0;
      }
    } else if (this.state === 'chase') {
      const target = this.lastSeen ?? { x: player.x, y: player.y };
      this.walkToward(target, GUARD.chaseSpeed, dt);
      this.turnToward(player.x, player.y, dt, 8);
    } else if (this.state === 'investigate') {
      const target = this.lookTarget ?? this.lastSeen ?? { x: this.x, y: this.y };
      const arrived = this.walkToward(target, GUARD.investigateSpeed, dt);
      if (arrived) {
        // Look around, then head home.
        this.angle += dt * 1.8;
        if (this.stateT > 3.2) {
          this.state = 'return';
          this.stateT = 0;
          this.lookTarget = null;
        }
      }
    } else if (this.state === 'return') {
      const home = this.waypoints[this.wpIndex];
      const arrived = this.walkToward(home, this.speed, dt);
      if (arrived) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        this.state = 'patrol';
        this.stateT = 0;
      }
    }

    // Footstep sounds while moving.
    this.stepT -= dt;
    if (this.stepT <= 0 && (this.state === 'patrol' || this.state === 'chase' || this.state === 'investigate')) {
      this.stepT = this.state === 'chase' ? 0.34 : 0.55;
      if (ctx.onFootstep) ctx.onFootstep(this);
    }
  }

  /** Walk toward a point; returns true when arrived (within 6px). Calls onArrive once. */
  walkToward(target, speed, dt, onArrive) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      if (onArrive) onArrive();
      return true;
    }
    const vx = (dx / d) * speed * dt;
    const vy = (dy / d) * speed * dt;
    this.x += vx;
    this.y += vy;
    this.turnToward(this.x + dx, this.y + dy, dt, 5);
    return false;
  }

  /** Turn the facing angle toward a point, at most `rate` radians per second. */
  turnToward(tx, ty, dt, rate) {
    const want = Math.atan2(ty - this.y, tx - this.x);
    let diff = want - this.angle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
    this.angle += step;
  }

  /** Send this guard to look at a point (a thrown coin, a laser trip). */
  investigatePoint(x, y) {
    if (this.state === 'chase') return;
    this.lookTarget = { x, y };
    this.lastSeen = { x, y };
    this.state = 'investigate';
    this.stateT = 0;
  }
}
