// Line of sight for The Marlow Job. Guards and cameras see through open
// floor only: a wall, a pillar or a display case between the watcher and
// the thief breaks the sight line, so cover is the whole game. Vision cones
// are drawn as polygons clipped by the same walls, so what the player sees
// is exactly what the guard sees.

import { VISION } from './config.js';

function pointInWall(x, y, walls) {
  for (const w of walls) {
    if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return true;
  }
  return false;
}

// True when nothing solid stands between (x1,y1) and (x2,y2). Steps along
// the segment in small hops; a hop of 6px is finer than the thinnest wall.
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointInWall(x1 + dx * t, y1 + dy * t, walls)) return false;
  }
  return true;
}

// Distance from the watcher to the first wall along a ray, capped at range.
function rayDistance(x, y, angle, range, walls) {
  const step = 6;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let px = x;
  let py = y;
  for (let d = 0; d < range; d += step) {
    px += dx;
    py += dy;
    if (pointInWall(px, py, walls)) return d;
  }
  return range;
}

// The visible polygon of a cone: the watcher's position plus one point per
// sampled ray, each stopped at the first wall. Render draws this; the
// detection test uses the same geometry, so the cone never lies.
export function conePolygon(x, y, angle, halfAngle, range, walls) {
  const points = [{ x, y }];
  const rays = 26;
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = rayDistance(x, y, a, range, walls);
    points.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return points;
}

// How strongly a watcher at (wx,wy) facing `angle` sees a thief at (tx,ty):
// 0 when out of range, outside the cone, or behind a wall; 1 when close
// and dead centre; scaled down the farther off-centre the thief stands.
export function visionStrength(wx, wy, angle, halfAngle, range, tx, ty, walls) {
  const dx = tx - wx;
  const dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  if (dist < VISION.pointBlank) return 1;
  const toThief = Math.atan2(dy, dx);
  let diff = Math.abs(toThief - angle);
  while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);
  if (diff > halfAngle) return 0;
  if (!hasLineOfSight(wx, wy, tx, ty, walls)) return 0;
  const centre = 1 - diff / halfAngle;
  const near = 1 - dist / range;
  return 0.35 + 0.65 * centre * (0.4 + 0.6 * near);
}
