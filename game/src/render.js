// Everything the player sees: the gallery floor, the walls and cover, the
// loot glittering on its pedestals, the guards and their vision cones, the
// sweeping cameras, the thief, the smoke, and the HUD with its alarm meter.
// The same cone polygons the vision code computes are drawn here, so the
// picture on screen is exactly what the guards can see.

import { COLORS, VIEW_W, VIEW_H } from './config.js';
import { conePolygon } from './vision.js';
import { guardCone } from './guards.js';
import { cameraCone } from './cameras.js';

export function drawWorld(ctx, world) {
  const { level, player, guards, cameras, loot, smoke, alarm } = world;
  drawFloor(ctx);
  drawExit(ctx, level.exit);
  drawLoot(ctx, loot, world.time);
  drawSafe(ctx, world);
  drawWalls(ctx, level.walls);
  drawSmoke(ctx, smoke);
  drawCameraCones(ctx, cameras, level.walls);
  drawGuardCones(ctx, guards, level.walls, alarm);
  drawCameras(ctx, cameras);
  drawGuards(ctx, guards, world.time);
  drawPlayer(ctx, player, world.time);
  drawCoinNoise(ctx, world);
  drawHud(ctx, world);
  drawBanners(ctx, world);
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // A faint checker of floor tiles, so motion across the room reads.
  ctx.fillStyle = COLORS.floorAlt;
  for (let y = 60; y < 740; y += 80) {
    for (let x = 60; x < 1220; x += 80) {
      if (((x + y) / 80) % 2 === 0) ctx.fillRect(x, y, 80, 80);
    }
  }
  // Gold carpet runner down the centre of the gallery.
  ctx.fillStyle = 'rgba(245, 197, 66, 0.07)';
  ctx.fillRect(600, 60, 80, 680);
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
}

function drawExit(ctx, exit) {
  const pulse = 0.55 + 0.25 * Math.sin(Date.now() / 300);
  ctx.fillStyle = `rgba(61, 220, 120, ${pulse})`;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = '#062b14';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + 26);
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(exit.label, exit.x + exit.w / 2, exit.y + 44);
  ctx.textAlign = 'left';
}

function lootShape(ctx, kind, x, y, time, taken) {
  const bob = Math.sin(time * 2 + x) * 3;
  if (kind === 'painting') {
    ctx.fillStyle = '#3a2c12';
    ctx.fillRect(x - 26, y - 18, 52, 36);
    ctx.fillStyle = taken ? '#222' : '#c96bff';
    ctx.fillRect(x - 21, y - 13, 42, 26);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 26, y - 18, 52, 36);
    return;
  }
  const colors = { sapphire: '#4dc3ff', gem: '#ff5d8f', crown: COLORS.gold, safe: '#e8e8e8' };
  ctx.fillStyle = taken ? '#333' : colors[kind] || COLORS.gold;
  ctx.beginPath();
  ctx.arc(x, y + bob, kind === 'crown' ? 16 : 12, 0, Math.PI * 2);
  ctx.fill();
  if (!taken) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y + bob, (kind === 'crown' ? 16 : 12) + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLoot(ctx, loot, time) {
  for (const item of loot) {
    if (item.taken) continue;
    // A soft glow marks every prize, so loot is obvious at a glance.
    const glow = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, 46);
    glow.addColorStop(0, 'rgba(245, 197, 66, 0.35)');
    glow.addColorStop(1, 'rgba(245, 197, 66, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 46, 0, Math.PI * 2);
    ctx.fill();
    lootShape(ctx, item.kind, item.x, item.y, time, false);
    ctx.fillStyle = COLORS.text;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${item.value}`, item.x, item.y + 30);
    ctx.textAlign = 'left';
  }
}

function drawSafe(ctx, world) {
  const safe = world.safe;
  if (!safe) return;
  const ring = safe.opened ? COLORS.green : COLORS.gold;
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(safe.x, safe.y, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = safe.opened ? '#1d3a24' : '#3a2f10';
  ctx.beginPath();
  ctx.arc(safe.x, safe.y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(safe.opened ? 'OPEN' : 'VAULT', safe.x, safe.y + 4);
  ctx.textAlign = 'left';
  if (world.player.cracking) {
    const p = world.player.crackProgress;
    ctx.fillStyle = '#000';
    ctx.fillRect(safe.x - 40, safe.y - 56, 80, 10);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(safe.x - 38, safe.y - 54, 76 * p, 6);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRACKING…', safe.x, safe.y - 62);
    ctx.textAlign = 'left';
  }
}

function drawSmoke(ctx, smoke) {
  for (const s of smoke) {
    const fade = Math.min(1, s.timer / 1.2);
    ctx.fillStyle = `rgba(180, 180, 200, ${0.5 * fade})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220, 220, 240, ${0.35 * fade})`;
    ctx.beginPath();
    ctx.arc(s.x - 20, s.y + 10, s.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCone(ctx, poly, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fill();
}

function drawGuardCones(ctx, guards, walls, alarm) {
  for (const g of guards) {
    const c = guardCone(g);
    const poly = conePolygon(c.x, c.y, c.angle, c.halfAngle, c.range, walls);
    const alerted = g.state === 'chase' || g.suspicion > 0.6;
    drawCone(ctx, poly, alerted ? COLORS.coneAlert : COLORS.cone);
  }
}

function drawCameraCones(ctx, cameras, walls) {
  for (const cam of cameras) {
    if (cam.disabledTimer > 0) continue;
    const c = cameraCone(cam);
    const poly = conePolygon(c.x, c.y, c.angle, c.halfAngle, c.range, walls);
    drawCone(ctx, poly, COLORS.cameraCone);
  }
}

function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    const disabled = cam.disabledTimer > 0;
    ctx.fillStyle = disabled ? '#555' : COLORS.cyan;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a14';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2);
    ctx.fill();
    if (disabled) {
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cam.x - 7, cam.y - 7);
      ctx.lineTo(cam.x + 7, cam.y + 7);
      ctx.stroke();
    }
  }
}

function drawGuards(ctx, guards, time) {
  for (const g of guards) {
    const alerted = g.state === 'chase';
    const suspicious = g.suspicion > 0.45 && !alerted;
    // Body: a dark-suited figure with a coloured collar by state.
    ctx.fillStyle = '#101018';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = alerted ? COLORS.red : suspicious ? COLORS.gold : '#7d7da8';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Facing tick, so the patrol direction reads at a glance.
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
    ctx.stroke();
    // Suspicion mark above the head: ? while curious, ! while chasing.
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    if (alerted) {
      ctx.fillStyle = COLORS.red;
      ctx.fillText('!', g.x, g.y - 22);
    } else if (suspicious) {
      ctx.fillStyle = COLORS.gold;
      ctx.fillText('?', g.x, g.y - 22);
    }
    ctx.textAlign = 'left';
    // Suspicion bar while the guard is on to something.
    if (g.suspicion > 0.05 && !alerted) {
      ctx.fillStyle = '#000';
      ctx.fillRect(g.x - 16, g.y - 18, 32, 5);
      ctx.fillStyle = COLORS.gold;
      ctx.fillRect(g.x - 15, g.y - 17, 30 * g.suspicion, 3);
    }
  }
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(time * 12) * 1.5 : 0;
  // Gold ring and dark coat: the thief, unmistakable in the dark room.
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, PLAYER_RADIUS + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + bob);
  ctx.lineTo(player.x + Math.cos(player.angle) * 18, player.y + bob + Math.sin(player.angle) * 18);
  ctx.stroke();
  if (player.sneaking) {
    ctx.fillStyle = COLORS.cyan;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', player.x, player.y - 24);
    ctx.textAlign = 'left';
  }
}
const PLAYER_RADIUS = 13;

function drawCoinNoise(ctx, world) {
  if (!world.coinNoise) return;
  const age = world.time - world.coinNoise.at;
  const r = 12 + age * 60;
  ctx.strokeStyle = `rgba(245, 197, 66, ${Math.max(0, 0.8 - age)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(world.coinNoise.x, world.coinNoise.y, Math.min(r, 60), 0, Math.PI * 2);
  ctx.stroke();
}

function drawHud(ctx, world) {
  const { alarm, lootValue, level, player, timeLeft } = world;
  // Top bar.
  ctx.fillStyle = 'rgba(5, 5, 12, 0.85)';
  ctx.fillRect(0, 0, VIEW_W, 52);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(level.name, 16, 22);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(world.objective, 16, 40);

  // Alarm meter: the heart of the HUD, green to red as it climbs.
  const ax = 480;
  const aw = 320;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ALARM', ax, 22);
  ctx.fillStyle = '#000';
  ctx.fillRect(ax + 70, 10, aw, 16);
  const frac = alarm / 100;
  ctx.fillStyle = frac < 0.4 ? COLORS.green : frac < 0.75 ? COLORS.gold : COLORS.red;
  ctx.fillRect(ax + 72, 12, (aw - 4) * frac, 12);
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 1;
  ctx.strokeRect(ax + 70, 10, aw, 16);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px sans-serif';
  ctx.fillText(`${Math.round(alarm)}%`, ax + 70 + aw + 8, 23);

  // Loot and tools on the right.
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`LOOT $${lootValue}`, VIEW_W - 16, 22);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px sans-serif';
  const tools = `Coins ${player.coins}   Smoke ${player.smoke} [Q]   EMP ${player.emp} [E]`;
  ctx.fillText(tools, VIEW_W - 16, 40);
  ctx.textAlign = 'left';
  if (timeLeft != null) {
    ctx.fillStyle = timeLeft < 30 ? COLORS.red : COLORS.muted;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`TIME ${Math.ceil(timeLeft)}s`, 880, 40);
  }
}

function drawBanners(ctx, world) {
  if (world.spottedFlash > 0) {
    ctx.fillStyle = `rgba(255, 59, 78, ${Math.min(0.85, world.spottedFlash)})`;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', VIEW_W / 2, 140);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Break line of sight — the alarm is climbing!', VIEW_W / 2, 172);
    ctx.textAlign = 'left';
  }
  if (world.levelClearTimer > 0) {
    ctx.fillStyle = 'rgba(5, 5, 12, 0.8)';
    ctx.fillRect(VIEW_W / 2 - 260, 300, 520, 120);
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;
    ctx.strokeRect(VIEW_W / 2 - 260, 300, 520, 120);
    ctx.fillStyle = COLORS.green;
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ROOM CLEARED', VIEW_W / 2, 348);
    ctx.fillStyle = COLORS.text;
    ctx.font = '16px sans-serif';
    ctx.fillText(world.levelClearText, VIEW_W / 2, 382);
    ctx.textAlign = 'left';
  }
}

// Full-screen states: title, busted, win. Drawn over the world so the
// screenshots show the game, not a blank page.
export function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(5, 5, 15, 0.92)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE MARLOW JOB', VIEW_W / 2, 190);
  ctx.fillStyle = COLORS.magenta;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('A NEON-NOIR HEIST IN THREE ROOMS', VIEW_W / 2, 232);
  ctx.fillStyle = COLORS.text;
  ctx.font = '17px sans-serif';
  ctx.fillText('Tonight the Marlow Gallery hangs the Star Sapphire — and you are going to take it.', VIEW_W / 2, 300);
  ctx.fillText('Slip past the guards, time the cameras, grab the loot and reach the getaway.', VIEW_W / 2, 328);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px sans-serif';
  ctx.fillText('WASD / Arrows — move      Shift — sneak      Click — toss a coin to lure a guard', VIEW_W / 2, 400);
  ctx.fillText('Q — smoke pellet ($150)      E — EMP burst, freezes cameras ($150)      F — crack a safe', VIEW_W / 2, 428);
  ctx.fillText('Watch the ALARM meter: at 100% the job is blown. Grab the target loot, then reach the EXIT.', VIEW_W / 2, 456);
  const blink = 0.6 + 0.4 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(61, 220, 120, ${blink})`;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO START THE JOB', VIEW_W / 2, 540);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px sans-serif';
  ctx.fillText('An original game — no borrowed art, names or levels. Good luck, thief.', VIEW_W / 2, 620);
  ctx.textAlign = 'left';
}

export function drawBusted(ctx, reason) {
  ctx.fillStyle = 'rgba(20, 2, 6, 0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.red;
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BUSTED!', VIEW_W / 2, 300);
  ctx.fillStyle = COLORS.text;
  ctx.font = '19px sans-serif';
  ctx.fillText(reason, VIEW_W / 2, 352);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px sans-serif';
  ctx.fillText('The guards were faster than the plan. Press R or Enter to run it back.', VIEW_W / 2, 400);
  ctx.textAlign = 'left';
}

export function drawWin(ctx, world) {
  ctx.fillStyle = 'rgba(5, 12, 5, 0.92)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLEAN GETAWAY!', VIEW_W / 2, 240);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px sans-serif';
  ctx.fillText('The van pulls away into the neon night. The Marlow is yours.', VIEW_W / 2, 292);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`LOOT  $${world.lootValue}`, VIEW_W / 2, 370);
  ctx.fillStyle = COLORS.magenta;
  ctx.fillText(`TOOLS SPENT  −$${world.spent}`, VIEW_W / 2, 410);
  ctx.fillStyle = COLORS.green;
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`TAKE-HOME  $${Math.max(0, world.lootValue - world.spent)}`, VIEW_W / 2, 462);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px sans-serif';
  ctx.fillText(`Rooms cleared: ${world.levelIndex + 1} of 3   •   Time ${Math.floor(world.elapsed)}s   •   Press R to play again`, VIEW_W / 2, 520);
  ctx.textAlign = 'left';
}
