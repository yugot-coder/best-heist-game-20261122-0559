// Velvet Vault: line of sight and vision cones.
// One job: answer "can this watcher see that point?" honestly — walls
// really block sight — and build the cone polygons the renderer draws.

/** True when the segment (x1,y1)-(x2,y2) touches the rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/** True when any wall stands between the two points. */
export function losBlocked(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return true;
  }
  return false;
}

/** Distance from (ox,oy) along angle `a` to the nearest wall, capped at maxDist. */
export function rayDistance(ox, oy, a, maxDist, walls) {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let best = maxDist;
  for (const w of walls) {
    // Slab test for ray vs rectangle.
    let tmin = 0;
    let tmax = best;
    let ok = true;
    if (Math.abs(dx) < 1e-9) {
      if (ox < w.x || ox > w.x + w.w) ok = false;
    } else {
      let t1 = (w.x - ox) / dx;
      let t2 = (w.x + w.w - ox) / dx;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) ok = false;
    }
    if (ok) {
      if (Math.abs(dy) < 1e-9) {
        if (oy < w.y || oy > w.y + w.h) ok = false;
      } else {
        let t1 = (w.y - oy) / dy;
        let t2 = (w.y + w.h - oy) / dy;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) ok = false;
      }
    }
    if (ok && tmin < best && tmin >= 0) best = tmin;
  }
  return best;
}

/** True when the point is inside the cone (range + half-angle), ignoring walls. */
export function inCone(px, py, ox, oy, angle, fov, range) {
  const dx = px - ox;
  const dy = py - oy;
  const d = Math.hypot(dx, dy);
  if (d > range) return false;
  if (d < 1e-6) return true;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= fov / 2;
}

/** The full sight test: inside the cone and no wall between watcher and point. */
export function canSee(ox, oy, angle, fov, range, tx, ty, walls) {
  return inCone(tx, ty, ox, oy, angle, fov, range) && !losBlocked(ox, oy, tx, ty, walls);
}

/**
 * The cone as a polygon for drawing: the watcher plus a fan of raycast
 * points, so walls really cut the drawn cone short.
 */
export function conePolygon(ox, oy, angle, fov, range, walls, steps = 26) {
  const pts = [[ox, oy]];
  for (let i = 0; i <= steps; i++) {
    const a = angle - fov / 2 + (fov * i) / steps;
    const d = rayDistance(ox, oy, a, range, walls);
    pts.push([ox + Math.cos(a) * d, oy + Math.sin(a) * d]);
  }
  return pts;
}

/** True when the point is inside the rectangle (with a small margin). */
export function pointInRect(px, py, r, margin = 0) {
  return px >= r.x - margin && px <= r.x + r.w + margin && py >= r.y - margin && py <= r.y + r.h + margin;
}

/** Circle-vs-rectangle overlap, used for movement collision. */
export function circleHitsRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}

/** Push a circle out of a rectangle it overlaps; returns the corrected position. */
export function resolveCircleRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  let dx = cx - nx;
  let dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= radius * radius) return [cx, cy];
  if (d2 < 1e-9) {
    // Centre inside the rectangle: push out along the smallest penetration.
    const left = cx - r.x;
    const right = r.x + r.w - cx;
    const top = cy - r.y;
    const bottom = r.y + r.h - cy;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return [r.x - radius, cy];
    if (m === right) return [r.x + r.w + radius, cy];
    if (m === top) return [cx, r.y - radius];
    return [cx, r.y + r.h + radius];
  }
  const d = Math.sqrt(d2);
  dx /= d;
  dy /= d;
  return [nx + dx * radius, ny + dy * radius];
}
