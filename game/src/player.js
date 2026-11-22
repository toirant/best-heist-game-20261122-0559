// The thief. WASD or arrows to move, Shift to sneak, click to toss a
// coin that lures a guard, Q for a smoke pellet, E for an EMP burst, and
// hold F inside a safe's ring to crack it. Every tool spends loot value,
// so the getaway payout is the loot minus the tools the job needed.

import { PLAYER, SAFE, TOOLS } from './config.js';

export function makePlayer(entry) {
  return {
    x: entry.x,
    y: entry.y,
    angle: -Math.PI / 2,
    sneaking: false,
    moving: false,
    coins: TOOLS.coinCount,
    smoke: TOOLS.smokeCount,
    emp: TOOLS.empCount,
    cracking: false,
    crackProgress: 0,
  };
}

function hitsWall(x, y, walls, radius) {
  for (const w of walls) {
    if (x > w.x - radius && x < w.x + w.w + radius && y > w.y - radius && y < w.y + w.h + radius) return true;
  }
  return false;
}

export function updatePlayer(p, input, dt, world) {
  const { walls } = world;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  p.sneaking = !!input.sneak;
  p.moving = mx !== 0 || my !== 0;

  if (p.moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    const nx = p.x + mx * speed * dt;
    const ny = p.y + my * speed * dt;
    p.angle = Math.atan2(my, mx);
    // Slide along walls: try x, then y, so corners never trap the thief.
    if (!hitsWall(nx, p.y, walls, PLAYER.radius)) p.x = nx;
    if (!hitsWall(p.x, ny, walls, PLAYER.radius)) p.y = ny;
    // Moving breaks a crack: the safe needs a steady hand.
    p.cracking = false;
    p.crackProgress = 0;
  }

  // Cracking: hold F inside the safe's ring and the dial turns.
  const safe = world.safe;
  if (safe && !safe.opened && input.crack) {
    const d = Math.hypot(p.x - safe.x, p.y - safe.y);
    if (d < SAFE.radius) {
      p.cracking = true;
      p.crackProgress += dt / SAFE.crackSeconds;
      if (p.crackProgress >= 1) {
        safe.opened = true;
        return 'safe-cracked';
      }
    } else {
      p.cracking = false;
      p.crackProgress = 0;
    }
  } else {
    p.cracking = false;
    if (!input.crack) p.crackProgress = 0;
  }
  return null;
}

// Spend a tool. Returns the tool used, or null when it is not available.
export function useTool(p, kind, world) {
  if (kind === 'smoke' && p.smoke > 0) {
    p.smoke -= 1;
    world.smoke.push({ x: p.x, y: p.y, radius: 90, timer: TOOLS.smokeSeconds });
    world.spent += TOOLS.smokeCost;
    return 'smoke';
  }
  if (kind === 'emp' && p.emp > 0) {
    p.emp -= 1;
    for (const cam of world.cameras) cam.disabledTimer = TOOLS.empSeconds;
    world.spent += TOOLS.empCost;
    return 'emp';
  }
  if (kind === 'coin' && p.coins > 0) {
    p.coins -= 1;
    return 'coin';
  }
  return null;
}
