// The security cameras. Each one is fixed to a wall and sweeps its cone
// back and forth across the room on a steady rhythm, so the thief times
// the gaps. An EMP burst freezes every camera for a few seconds — at a
// price in loot value — and a camera that spots the thief feeds the alarm
// just like a guard does.

import { VISION } from './config.js';
import { visionStrength } from './vision.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    phase: Math.random() * Math.PI * 2,
    angle: def.baseAngle,
    disabledTimer: 0,
  };
}

export function updateCamera(cam, dt, time) {
  if (cam.disabledTimer > 0) {
    cam.disabledTimer -= dt;
    return;
  }
  // A smooth sweep: the cone swings out and back around its base angle.
  cam.angle = cam.baseAngle + Math.sin(time * cam.speed + cam.phase) * cam.sweep;
}

export function cameraSees(cam, player, walls) {
  if (cam.disabledTimer > 0) return 0;
  let seen = visionStrength(cam.x, cam.y, cam.angle, VISION.cameraHalfAngle, VISION.cameraRange, player.x, player.y, walls);
  if (player.sneaking) seen *= 0.45;
  return seen;
}

export function cameraCone(cam) {
  return { x: cam.x, y: cam.y, angle: cam.angle, halfAngle: VISION.cameraHalfAngle, range: VISION.cameraRange };
}
