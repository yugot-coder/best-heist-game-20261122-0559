// Velvet Vault: everything the eye sees.
// One job: draw one frame — the museum floor, the cones, the people, the
// loot, the alarm HUD and every screen — from the game state, nothing else.

import { PALETTE, VIEW, GUARD } from './config.js';
import { conePolygon, pointInRect } from './vision.js';

/** Format seconds as M:SS. */
export function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

/** Format dollars with a thousands separator. */
export function fmtMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

/** Draw a filled polygon from [x, y] points. */
function poly(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** The marble checker floor, carpet, shadows and wall trim. */
function drawFloor(ctx, level, t) {
  const tile = 64;
  for (let y = 0; y < VIEW.h; y += tile) {
    for (let x = 0; x < VIEW.w; x += tile) {
      ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Velvet carpet down the middle hall.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(444, 252, 392, 218);
  ctx.fillStyle = PALETTE.carpetEdge;
  ctx.fillRect(444, 252, 392, 6);
  ctx.fillRect(444, 464, 392, 6);
  // Shadow tiles: pools of dark where the thief is hard to spot.
  for (const s of level.shadows) {
    ctx.fillStyle = PALETTE.shadow;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(160, 170, 220, 0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w, s.h);
  }
  // Walls: dark blocks with a gold-lit top edge.
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.fillStyle = PALETTE.wallTrim;
    ctx.fillRect(w.x, w.y + w.h - 2, w.w, 2);
  }
}

/** A loot piece: sapphire, diamond, ledger, gold bars, painting, vase. */
function drawLoot(ctx, loot, t) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 3 + loot.x);
  const glow = 10 + pulse * 8;
  ctx.save();
  ctx.shadowBlur = glow;
  if (loot.kind === 'sapphire' || loot.kind === 'diamond') {
    ctx.shadowColor = loot.kind === 'sapphire' ? PALETTE.sapphire : PALETTE.diamond;
    ctx.fillStyle = loot.kind === 'sapphire' ? PALETTE.sapphire : PALETTE.diamond;
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y - 12);
    ctx.lineTo(loot.x + 10, loot.y);
    ctx.lineTo(loot.x, loot.y + 12);
    ctx.lineTo(loot.x - 10, loot.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(loot.x - 10, loot.y);
    ctx.lineTo(loot.x + 10, loot.y);
    ctx.moveTo(loot.x, loot.y - 12);
    ctx.lineTo(loot.x, loot.y + 12);
    ctx.stroke();
  } else if (loot.kind === 'ledger') {
    ctx.shadowColor = PALETTE.ledger;
    ctx.fillStyle = PALETTE.ledger;
    ctx.fillRect(loot.x - 11, loot.y - 8, 22, 16);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#8a6d3b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(loot.x - 11, loot.y - 8, 22, 16);
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y - 8);
    ctx.lineTo(loot.x, loot.y + 8);
    ctx.stroke();
  } else if (loot.kind === 'gold') {
    ctx.shadowColor = PALETTE.gold;
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = i === 0 ? PALETTE.gold : PALETTE.goldDim;
      ctx.fillRect(loot.x + i * 9 - 6, loot.y - 5 + Math.abs(i) * 3, 12, 8);
    }
    ctx.shadowBlur = 0;
  } else if (loot.kind === 'painting') {
    ctx.shadowColor = PALETTE.gold;
    ctx.fillStyle = '#3d2b1f';
    ctx.fillRect(loot.x - 16, loot.y - 12, 32, 24);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(loot.x - 16, loot.y - 12, 32, 24);
    ctx.fillStyle = '#7fb069';
    ctx.beginPath();
    ctx.arc(loot.x - 4, loot.y - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e07a5f';
    ctx.beginPath();
    ctx.arc(loot.x + 6, loot.y + 3, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // vase
    ctx.shadowColor = '#c084fc';
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.ellipse(loot.x, loot.y, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  // Value tag.
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hudText;
  ctx.fillText(fmtMoney(loot.value), loot.x, loot.y + 30);
}

/** The exit door: green and open once the main loot is taken. */
function drawExit(ctx, level, open, t) {
  const e = level.exit;
  ctx.save();
  ctx.fillStyle = open ? '#14532d' : '#3f1d24';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#4ade80' : '#ef4444';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x + 1.5, e.y + 1.5, e.w - 3, e.h - 3);
  if (open) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(74, 222, 128, ${0.25 + pulse * 0.25})`;
    ctx.fillRect(e.x + 4, e.y + 4, e.w - 8, e.h - 8);
  }
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = open ? '#bbf7d0' : '#fca5a5';
  ctx.fillText(open ? 'EXIT OPEN' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 - 6);
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText(e.label, e.x + e.w / 2, e.y + e.h / 2 + 10);
  ctx.restore();
}

/** A guard: navy body, cap, facing tick, and ! / ? above the head. */
function drawGuard(ctx, g, t) {
  const coneColor =
    g.state === 'chase'
      ? PALETTE.coneChase
      : g.state === 'suspicious' || g.suspicion > 0.25
        ? PALETTE.coneSuspicious
        : PALETTE.coneCalm;
  // Vision cone is drawn by the caller (needs walls); here only the body.
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(2, 4, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GUARD_BODY;
  ctx.beginPath();
  ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim in the facing direction.
  ctx.rotate(g.angle);
  ctx.fillStyle = PALETTE.guardCap;
  ctx.beginPath();
  ctx.arc(0, 0, 9, -0.9, 0.9);
  ctx.lineTo(15, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(4, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Suspicion arc above the head.
  if (g.suspicion > 0.03 && g.state !== 'chase') {
    ctx.save();
    ctx.translate(g.x, g.y - 24);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-14, -4, 28, 7);
    ctx.fillStyle = g.suspicion > 0.6 ? '#f97316' : PALETTE.gold;
    ctx.fillRect(-13, -3, 26 * g.suspicion, 5);
    ctx.restore();
  }
  const mark = g.state === 'chase' ? '!' : g.state === 'investigate' ? '?' : g.state === 'suspicious' ? '!' : null;
  if (mark) {
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = g.state === 'chase' ? '#ef4444' : '#fbbf24';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 4;
    ctx.strokeText(mark, g.x, g.y - 30);
    ctx.fillText(mark, g.x, g.y - 30);
  }
  return coneColor;
}
const GUARD_BODY = PALETTE.guardBody;

/** A CCTV camera: wall mount, lens, and its sweeping cone. */
function drawCamera(ctx, cam) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-7, -7, 14, 14);
  ctx.rotate(cam.angle);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, -4, 14, 8);
  ctx.fillStyle = cam.seesPlayer ? '#ef4444' : '#38bdf8';
  ctx.beginPath();
  ctx.arc(14, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (cam.seesPlayer) {
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('REC ●', cam.x, cam.y - 16);
  }
}

/** A laser beam between its emitters, flashing red when tripped. */
function drawLaser(ctx, laser, t) {
  const blink = laser.flash > 0 ? 0.5 + 0.5 * Math.sin(t * 30) : 0.55 + 0.25 * Math.sin(t * 2.4);
  ctx.save();
  ctx.strokeStyle = `rgba(255, 45, 85, ${blink})`;
  ctx.lineWidth = laser.flash > 0 ? 5 : 2.5;
  ctx.shadowColor = PALETTE.laser;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(laser.x1, laser.y1);
  ctx.lineTo(laser.x2, laser.y2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#7f1d2e';
  for (const [x, y] of [[laser.x1, laser.y1], [laser.x2, laser.y2]]) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.laser;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7f1d2e';
  }
  ctx.restore();
}

/** The thief: teal body, hat, facing tick, sneak crouch. */
function drawPlayer(ctx, p, t) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(2, 5, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const r = p.sneaking ? 11 : 13;
  ctx.fillStyle = PALETTE.thiefBody;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#042f2e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.rotate(p.angle);
  // Hat brim.
  ctx.fillStyle = PALETTE.thiefHat;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.fillStyle = '#f2e8c9';
  ctx.beginPath();
  ctx.arc(14, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Vault-crack progress ring.
  if (p.crackProgress > 0 && p.crackProgress < 1) {
    ctx.save();
    ctx.translate(p.x, p.y - 26);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(0, 0, 11, -Math.PI / 2, -Math.PI / 2 + p.crackProgress * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/** Coins in flight and smoke clouds. */
function drawTools(ctx, coins, smokes, t) {
  for (const c of coins) {
    const bob = c.landed ? 0 : Math.sin(c.t * Math.PI) * -14;
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c5a10';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
  for (const s of smokes) {
    const alpha = Math.min(0.55, (s.life / 4.5) * 0.55);
    ctx.save();
    ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(148, 163, 184, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(s.x - 24, s.y + 12, s.radius * 0.55, 0, Math.PI * 2);
    ctx.arc(s.x + 26, s.y - 14, s.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Sparkle particles over loot and pickups. */
function drawParticles(ctx, particles) {
  for (const p of particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** The top HUD bar: level, alarm meter, loot, timer, tools. */
function drawHud(ctx, G) {
  const level = G.level;
  ctx.save();
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, VIEW.w, 52);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 52, VIEW.w, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(level.name, 14, 21);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText(level.objective, 14, 39);

  // Alarm meter, centre.
  const ax = 470;
  const aw = 340;
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = G.alarm >= 75 ? '#f87171' : G.alarm >= 40 ? '#fbbf24' : PALETTE.hudText;
  ctx.fillText(G.alarm >= 100 ? 'ALARM — LOCKDOWN!' : `ALARM ${Math.round(G.alarm)}%`, ax, 21);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(ax, 27, aw, 12);
  const frac = Math.min(1, G.alarm / 100);
  const grad = ctx.createLinearGradient(ax, 0, ax + aw, 0);
  grad.addColorStop(0, '#22c55e');
  grad.addColorStop(0.5, '#eab308');
  grad.addColorStop(1, '#ef4444');
  ctx.fillStyle = grad;
  ctx.fillRect(ax, 27, aw * frac, 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax + 0.5, 27.5, aw, 12);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText('seen = alarm rises · unseen = it cools', ax, 50);

  // Loot, timer, tools, right. Loot is per-level: what this room yielded.
  const levelLoot = level.loot.filter((l) => G.lootTaken.has(l.id)).reduce((n, l) => n + l.value, 0);
  const total = level.loot.reduce((n, l) => n + l.value, 0);
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`LOOT ${fmtMoney(levelLoot)} / ${fmtMoney(total)}`, VIEW.w - 14, 21);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.hudText;
  ctx.fillText(
    `TIME ${fmtTime(G.time)}   ● COIN ×${G.player.coins}   ◐ SMOKE ×${G.player.smokes}   STAMINA ${Math.round(G.player.stamina)}`,
    VIEW.w - 14,
    39,
  );
  ctx.restore();
}

/** The bottom hint line during play. */
function drawHints(ctx, G) {
  ctx.save();
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(242, 232, 201, 0.75)';
  const hint = G.level.vaultDoor && !G.vaultOpen
    ? 'WASD move · SHIFT sneak · SPACE dash · CLICK throw a coin · Q smoke · hold E at the vault door to crack it'
    : 'WASD move · SHIFT sneak · SPACE dash · CLICK throw a coin · Q smoke · E pick up loot · M mute · P pause';
  ctx.fillText(hint, VIEW.w / 2, VIEW.h - 12);
  ctx.restore();
}

/** A centred panel with a title, lines and a prompt. */
function drawPanel(ctx, title, lines, prompt, titleColor = PALETTE.gold) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 24, 0.78)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const pw = 640;
  const ph = 150 + lines.length * 30;
  const px = (VIEW.w - pw) / 2;
  const py = (VIEW.h - ph) / 2;
  ctx.fillStyle = 'rgba(16, 19, 38, 0.97)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(title, VIEW.w / 2, py + 58);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.w / 2, py + 102 + i * 30));
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(prompt, VIEW.w / 2, py + ph - 22);
  ctx.restore();
}

/**
 * Draw the whole game for state G.
 * G: { screen, level, levelIndex, player, guards, cameras, lasers, coins,
 *   smokes, particles, lootTaken:Set, alarm, lootValue, time, score,
 *   vaultOpen, crackProgress, message, time }
 */
export function drawGame(ctx, G) {
  const t = G.time;
  const level = G.level;

  if (G.screen === 'title') {
    // A dimmed museum behind the title: level 1, staged.
    drawFloor(ctx, level, t);
    drawExit(ctx, level, false, t);
    for (const loot of level.loot) drawLoot(ctx, loot, t);
    drawPanel(
      ctx,
      'VELVET VAULT',
      [
        'The Meridian Heist — one thief, three rooms, one night.',
        'Cross the gallery, crack the vault, grab the Ledger and vanish.',
        'Guards watch with cones. Cameras sweep. Lasers sting. Stay unseen.',
      ],
      'Press ENTER or click to begin the heist',
    );
    return;
  }

  // World.
  drawFloor(ctx, level, t);

  // Vision cones under everything that walks.
  for (const cam of G.cameras) {
    const pts = conePolygon(cam.x, cam.y, cam.angle, 0.907, 250, level.walls);
    poly(ctx, pts, cam.seesPlayer ? 'rgba(255, 80, 80, 0.28)' : PALETTE.coneCamera);
  }
  for (const g of G.guards) {
    const color =
      g.state === 'chase'
        ? PALETTE.coneChase
        : g.state === 'suspicious' || g.suspicion > 0.25
          ? PALETTE.coneSuspicious
          : PALETTE.coneCalm;
    const pts = conePolygon(g.x, g.y, g.angle, GUARD.viewFov, GUARD.viewRange, level.walls);
    poly(ctx, pts, color);
  }

  // Vault door (level 2).
  if (level.vaultDoor) {
    ctx.save();
    ctx.fillStyle = G.vaultOpen ? '#14532d' : '#3f3f46';
    ctx.fillRect(level.vaultDoor.x - 26, level.vaultDoor.y - 40, 14, 80);
    ctx.strokeStyle = G.vaultOpen ? '#4ade80' : PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(level.vaultDoor.x - 26, level.vaultDoor.y - 40, 14, 80);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(G.vaultOpen ? 'OPEN' : 'VAULT', level.vaultDoor.x - 19, level.vaultDoor.y - 48);
    ctx.restore();
  }

  drawExit(ctx, level, G.exitOpen, t);
  for (const loot of level.loot) {
    if (!G.lootTaken.has(loot.id)) drawLoot(ctx, loot, t);
  }
  for (const laser of G.lasers) drawLaser(ctx, laser, t);
  for (const cam of G.cameras) drawCamera(ctx, cam);
  drawTools(ctx, G.coins, G.smokes, t);
  drawParticles(ctx, G.particles);
  for (const g of G.guards) drawGuard(ctx, g, t);
  drawPlayer(ctx, G.player, t);

  drawHud(ctx, G);
  drawHints(ctx, G);

  // Transient centre message ("SPOTTED!", "VAULT CRACKED", ...).
  if (G.message && G.messageT > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.messageT);
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = G.messageColor || PALETTE.gold;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 5;
    const y = 120;
    ctx.strokeText(G.message, VIEW.w / 2, y);
    ctx.fillText(G.message, VIEW.w / 2, y);
    ctx.restore();
  }

  if (G.screen === 'briefing') {
    drawPanel(ctx, level.name, [level.subtitle, level.objective, `Par time ${fmtTime(level.par)} — beat it for a time bonus.`], 'Press ENTER to start the level');
  } else if (G.screen === 'leveldone') {
    drawPanel(
      ctx,
      'CLEAN GETAWAY',
      [
        `Room cleared — loot so far ${fmtMoney(G.lootValue)}.`,
        `Score ${G.score.toLocaleString('en-US')} · time ${fmtTime(G.levelTime)}.`,
      ],
      'Press ENTER for the next room',
    );
  } else if (G.screen === 'caught') {
    drawPanel(
      ctx,
      'BUSTED!',
      ['A guard laid hands on you. The crew bails you out — for a price.', `−${250} score. The room resets.`],
      'Press ENTER to try the room again',
      '#ef4444',
    );
  } else if (G.screen === 'paused') {
    drawPanel(ctx, 'PAUSED', ['The museum waits. The guards do not — they are frozen too.'], 'Press P to resume');
  } else if (G.screen === 'win') {
    const total = G.levelsTotal;
    drawPanel(
      ctx,
      'THE HEIST IS COMPLETE',
      [
        `Every room cleaned. Total loot ${fmtMoney(G.lootValue)} of ${fmtMoney(total)}.`,
        `Final score ${G.score.toLocaleString('en-US')} — the crew splits it three ways.`,
        G.ghost ? 'GHOST RUN: the alarm never passed 50. Flawless.' : 'The alarm spiked, but the van was faster.',
      ],
      'Press R to run the heist again',
    );
  }
}
