// Velvet Vault: the museum's CCTV cameras and laser grids.
// One job: sweeping camera cones that raise the alarm, and laser beams
// that sting the thief who crosses them.

import { CAMERA, LASER } from './config.js';
import { canSee } from './vision.js';

/** A wall-mounted camera sweeping its cone back and forth. */
export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.angle;
    this.sweep = def.sweep;
    this.angle = def.angle;
    this.phase = ((def.x + def.y) % 6) - 3; // deterministic sweep start
    this.seesPlayer = false;
    this.pingT = 0;
  }

  update(dt, ctx) {
    const { player, walls, smokes } = ctx;
    this.phase += dt * CAMERA.sweepSpeed;
    this.angle = this.baseAngle + Math.sin(this.phase) * this.sweep;
    const inSmoke = smokes.some((s) => Math.hypot(player.x - s.x, player.y - s.y) < s.radius);
    const seen =
      !inSmoke && canSee(this.x, this.y, this.angle, CAMERA.viewFov, CAMERA.viewRange, player.x, player.y, walls);
    this.seesPlayer = seen;
    if (seen) {
      ctx.addAlarm(CAMERA.alarmRate * dt, this.x, this.y);
      this.pingT -= dt;
      if (this.pingT <= 0) {
        this.pingT = 0.8;
        if (ctx.onCameraPing) ctx.onCameraPing(this);
      }
    }
  }
}

/** One laser beam between two emitters. Crossing it trips the alarm. */
export class Laser {
  constructor(def) {
    this.x1 = def.x1;
    this.y1 = def.y1;
    this.x2 = def.x2;
    this.y2 = def.y2;
    this.cooldown = 0;
    this.flash = 0;
  }

  /** Distance from the thief to the beam segment. */
  distToPlayer(px, py) {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - this.x1) * dx + (py - this.y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = this.x1 + t * dx;
    const cy = this.y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  update(dt, ctx) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
    if (this.cooldown > 0) return;
    if (this.distToPlayer(ctx.player.x, ctx.player.y) < ctx.player.radius + 3) {
      this.cooldown = LASER.cooldown;
      this.flash = 0.7;
      ctx.addAlarm(LASER.alarmHit, ctx.player.x, ctx.player.y);
      if (ctx.onLaserTrip) ctx.onLaserTrip(this);
    }
  }
}
