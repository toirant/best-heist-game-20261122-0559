// The guards of the Marlow Gallery. Each one walks a patrol route,
// pauses at each waypoint to scan the room, and reacts to what it sees:
// a glimpse raises suspicion, a good look sends it to investigate, and a
// clear sighting makes it give chase. A thrown coin is a noise worth
// checking out, and smoke hides the thief completely.

import { GUARD, VISION } from './config.js';
import { visionStrength } from './vision.js';

export function makeGuard(def) {
  const [sx, sy] = def.waypoints[0];
  return {
    name: def.name,
    waypoints: def.waypoints,
    x: sx,
    y: sy,
    angle: 0,
    waypointIndex: 1,
    state: 'patrol', // patrol | scan | investigate | chase | return
    suspicion: 0,
    scanTimer: 0,
    investigateTarget: null,
    stuckTimer: 0,
  };
}

function moveToward(g, tx, ty, speed, dt, walls) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = g.x + (dx / dist) * step;
  const ny = g.y + (dy / dist) * step;
  g.angle = Math.atan2(dy, dx);
  // Slide along walls instead of sticking to them: try x, then y.
  if (!hitsWall(nx, g.y, walls)) g.x = nx;
  if (!hitsWall(g.x, ny, walls)) g.y = ny;
  return dist <= step;
}

function hitsWall(x, y, walls) {
  for (const w of walls) {
    if (x > w.x - 10 && x < w.x + w.w + 10 && y > w.y - 10 && y < w.y + w.h + 10) return true;
  }
  return false;
}

export function updateGuard(g, dt, world) {
  const { player, walls, smoke } = world;
  const hidden = smoke.some((s) => Math.hypot(player.x - s.x, player.y - s.y) < s.radius);

  // Seeing: the cone test, softened when the thief sneaks. Smoke blocks it.
  let seen = 0;
  if (!hidden) {
    seen = visionStrength(g.x, g.y, g.angle, VISION.guardHalfAngle, VISION.guardRange, player.x, player.y, walls);
    if (player.sneaking) seen *= 0.45;
  }

  if (seen > 0) {
    g.suspicion = Math.min(1, g.suspicion + seen * GUARD.suspicionRise * dt);
  } else {
    g.suspicion = Math.max(0, g.suspicion - GUARD.suspicionFall * dt);
  }

  // A clear sighting is a chase; a glimpse is an investigation.
  if (g.suspicion >= 1) {
    g.state = 'chase';
  } else if (g.suspicion >= 0.45 && g.state === 'patrol') {
    g.state = 'investigate';
    g.investigateTarget = { x: player.x, y: player.y };
  }

  // A coin landing nearby is worth a look, even for a calm guard.
  if (world.coinNoise && g.state !== 'chase') {
    const d = Math.hypot(world.coinNoise.x - g.x, world.coinNoise.y - g.y);
    if (d < 320) {
      g.state = 'investigate';
      g.investigateTarget = { x: world.coinNoise.x, y: world.coinNoise.y };
    }
  }

  switch (g.state) {
    case 'patrol': {
      const target = g.waypoints[g.waypointIndex];
      if (moveToward(g, target[0], target[1], GUARD.patrolSpeed, dt, walls)) {
        g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
        g.state = 'scan';
        g.scanTimer = GUARD.scanPauseSeconds;
      }
      break;
    }
    case 'scan': {
      // Stand still and sweep the room: the cone turns, the thief waits.
      g.angle += dt * 1.1;
      g.scanTimer -= dt;
      if (g.scanTimer <= 0) g.state = 'patrol';
      break;
    }
    case 'investigate': {
      const t = g.investigateTarget;
      if (!t || moveToward(g, t.x, t.y, GUARD.investigateSpeed, dt, walls)) {
        g.state = 'scan';
        g.scanTimer = 1.2;
        g.investigateTarget = null;
      }
      break;
    }
    case 'chase': {
      // Chase the thief's last seen position; lose the trail and give up.
      if (seen > 0) {
        g.investigateTarget = { x: player.x, y: player.y };
        moveToward(g, player.x, player.y, GUARD.chaseSpeed, dt, walls);
      } else if (g.investigateTarget) {
        if (moveToward(g, g.investigateTarget.x, g.investigateTarget.y, GUARD.investigateSpeed, dt, walls)) {
          g.state = 'return';
        }
      } else {
        g.state = 'return';
      }
      if (g.suspicion < 0.35) g.state = 'return';
      break;
    }
    case 'return': {
      // Walk back to the patrol route and pick it up again.
      const target = g.waypoints[g.waypointIndex];
      if (moveToward(g, target[0], target[1], GUARD.patrolSpeed, dt, walls)) g.state = 'patrol';
      break;
    }
  }

  // Caught: the guard reaches the thief.
  const caught = Math.hypot(player.x - g.x, player.y - g.y) < GUARD.catchRadius;
  return { seen, caught };
}

// A guard's cone is drawn from where it stands, facing where it looks.
export function guardCone(g) {
  return { x: g.x, y: g.y, angle: g.angle, halfAngle: VISION.guardHalfAngle, range: VISION.guardRange };
}
