// The Marlow Job — game loop and state. Title, playing, level-clear,
// busted and win. The alarm meter is the spine of the game: it climbs
// whenever a guard or a camera has eyes on the thief and falls when the
// thief is hidden, and at 100 the job is blown. Loot is picked up by
// walking over it; the exit only opens the next room once the level's
// target loot is in hand.

import { ALARM, VIEW_H, VIEW_W } from './config.js';
import { LEVELS } from './levels.js';
import { makeGuard, updateGuard } from './guards.js';
import { makeCamera, updateCamera, cameraSees } from './cameras.js';
import { makePlayer, updatePlayer, useTool } from './player.js';
import { ensureAudio, sfx, toggleMute } from './audio.js';
import { makeInput, bindInput } from './input.js';
import { drawWorld, drawTitle, drawBusted, drawWin } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// The single game object: everything the loop, the renderer and the
// screenshot staging read and write.
const game = {
  screen: 'title', // title | playing | busted | win
  levelIndex: 0,
  level: LEVELS[0],
  player: null,
  guards: [],
  cameras: [],
  loot: [],
  safe: null,
  smoke: [],
  alarm: 0,
  lootValue: 0,
  spent: 0,
  elapsed: 0,
  time: 0,
  spottedFlash: 0,
  levelClearTimer: 0,
  levelClearText: '',
  bustedReason: '',
  coinNoise: null,
  frozen: false,
  objective: '',
};

function loadLevel(index) {
  const level = LEVELS[index];
  game.levelIndex = index;
  game.level = level;
  game.player = makePlayer(level.entry);
  game.guards = level.guards.map(makeGuard);
  game.cameras = level.cameras.map(makeCamera);
  game.loot = level.loot.map((l) => ({ ...l, taken: false }));
  game.safe = level.safe ? { ...level.safe, opened: false } : null;
  game.smoke = [];
  game.coinNoise = null;
  game.alarm = Math.max(0, game.alarm - 25);
  game.objective = `Grab $${level.targetLoot} of loot, then reach the ${level.exit.label.toLowerCase()}.`;
  game.levelClearTimer = 0;
  game.spottedFlash = 0;
}

function targetLootTaken() {
  // The exit opens once the level's target loot value is in hand. For a
  // level with a safe, the safe's prize is the target.
  const targetIds = game.level.loot.filter((l) => l.value >= game.level.targetLoot - 300).map((l) => l.id);
  const taken = game.loot.filter((l) => l.taken && targetIds.includes(l.id));
  return taken.length > 0 || game.lootValue >= game.level.targetLoot;
}

function announce(text) {
  statusEl.textContent = text;
}

const input = makeInput();
bindInput(input, canvas, (cx, cy) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((cx - rect.left) / rect.width) * VIEW_W,
    y: ((cy - rect.top) / rect.height) * VIEW_H,
  };
});

function startGame() {
  ensureAudio();
  game.screen = 'playing';
  game.levelIndex = 0;
  game.lootValue = 0;
  game.spent = 0;
  game.elapsed = 0;
  game.alarm = 0;
  loadLevel(0);
  announce('The job begins. Grab the target loot, then reach the exit.');
  sfx.click();
}

function bust(reason) {
  game.screen = 'busted';
  game.bustedReason = reason;
  announce(`Busted. ${reason}`);
  sfx.busted();
}

function winGame() {
  game.screen = 'win';
  announce('Clean getaway! Take-home ' + Math.max(0, game.lootValue - game.spent) + ' dollars.');
  sfx.win();
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    winGame();
    return;
  }
  loadLevel(game.levelIndex + 1);
  game.screen = 'playing';
  announce(`${game.level.name}. ${game.level.briefing}`);
  sfx.levelClear();
}

function update(dt) {
  game.time += dt;
  if (game.screen === 'playing') game.elapsed += dt;

  // Tools and clicks are consumed once per press.
  if (input.smokePressed) {
    input.smokePressed = false;
    if (game.screen === 'playing') {
      const used = useTool(game.player, 'smoke', game);
      if (used) sfx.smoke();
    }
  }
  if (input.empPressed) {
    input.empPressed = false;
    if (game.screen === 'playing') {
      const used = useTool(game.player, 'emp', game);
      if (used) sfx.emp();
    }
  }
  if (input.mute) {
    input.mute = false;
    toggleMute();
  }
  if (input.click) {
    const click = input.click;
    input.click = null;
    if (game.screen === 'title') {
      startGame();
      return;
    }
    if (game.screen === 'playing') {
      ensureAudio();
      const used = useTool(game.player, 'coin', game);
      if (used) {
        game.coinNoise = { x: click.x, y: click.y, at: game.time };
        sfx.coin();
      }
    }
  }
  if (input.started) {
    input.started = false;
    if (game.screen === 'title') startGame();
  }
  if (input.restart) {
    input.restart = false;
    if (game.screen === 'busted' || game.screen === 'win') startGame();
  }

  if (game.screen !== 'playing') return;

  // Smoke fades; the coin's ring is a momentary noise.
  for (const s of game.smoke) s.timer -= dt;
  game.smoke = game.smoke.filter((s) => s.timer > 0);
  if (game.coinNoise && game.time - game.coinNoise.at > 1.2) game.coinNoise = null;
  if (game.spottedFlash > 0) game.spottedFlash = Math.max(0, game.spottedFlash - dt * 0.9);

  // Level-clear intermission counts down, then the next room loads.
  if (game.levelClearTimer > 0) {
    game.levelClearTimer -= dt;
    if (game.levelClearTimer <= 0) nextLevel();
    return;
  }

  const world = {
    player: game.player,
    walls: game.level.walls,
    smoke: game.smoke,
    cameras: game.cameras,
    coinNoise: game.coinNoise,
    safe: game.safe,
  };

  const crack = updatePlayer(game.player, input, dt, world);
  if (crack === 'safe-cracked') {
    const loot = game.loot.find((l) => l.id === game.safe.lootId);
    if (loot && !loot.taken) {
      loot.taken = true;
      game.lootValue += loot.value;
      announce(`${loot.name} cracked open — $${loot.value}.`);
      sfx.safeOpen();
    }
  }

  // Guards: patrol, suspect, chase. Any sighting feeds the alarm.
  let anySeen = 0;
  let spottedNow = false;
  for (const g of game.guards) {
    const { seen, caught } = updateGuard(g, dt, world);
    if (caught) {
      bust(`${g.name} grabbed you in the ${game.level.name.toLowerCase()}.`);
      return;
    }
    if (seen > 0.55) {
      spottedNow = true;
      anySeen = Math.max(anySeen, seen);
    } else if (seen > 0) {
      anySeen = Math.max(anySeen, seen * 0.6);
    }
  }

  // Cameras feed the alarm too, unless an EMP froze them.
  for (const cam of game.cameras) {
    updateCamera(cam, dt, game.time);
    const seen = cameraSees(cam, game.player, game.level.walls);
    if (seen > 0.5) {
      spottedNow = true;
      anySeen = Math.max(anySeen, seen);
    }
  }

  if (spottedNow && game.spottedFlash <= 0) {
    game.spottedFlash = 1;
    sfx.spotted();
    announce('Spotted! Break line of sight.');
  }

  if (anySeen > 0) {
    const close = anySeen > 0.8 ? ALARM.riseCloseMultiplier : 1;
    game.alarm = Math.min(100, game.alarm + ALARM.risePerSecond * anySeen * close * dt);
  } else {
    game.alarm = Math.max(0, game.alarm - ALARM.fallPerSecond * dt);
  }
  if (game.alarm >= 100) {
    bust('The alarm hit 100% — security flooded the room.');
    return;
  }

  // Loot: walk over a prize to lift it. The safe's prize only counts once
  // the safe is cracked open.
  for (const item of game.loot) {
    if (item.taken) continue;
    if (item.kind === 'safe' && game.safe && !game.safe.opened) continue;
    const d = Math.hypot(game.player.x - item.x, game.player.y - item.y);
    if (d < 30) {
      item.taken = true;
      game.lootValue += item.value;
      announce(`${item.name} lifted — $${item.value}. Total $${game.lootValue}.`);
      sfx.pickup();
    }
  }

  // Exit: only once the target loot is in hand, and only on foot.
  const exit = game.level.exit;
  const inExit =
    game.player.x > exit.x && game.player.x < exit.x + exit.w &&
    game.player.y > exit.y && game.player.y < exit.y + exit.h;
  if (inExit && targetLootTaken()) {
    game.levelClearText = `Loot $${game.lootValue} — on to the next room.`;
    game.levelClearTimer = 2.2;
    announce('Room cleared. Next room loading.');
    sfx.levelClear();
  }
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === 'title') {
    // The gallery sits behind the title, so the first frame is the game.
    if (!game.player) loadLevel(0);
    drawWorld(ctx, game);
    drawTitle(ctx, game.time);
  } else if (game.screen === 'busted') {
    drawWorld(ctx, game);
    drawBusted(ctx, game.bustedReason);
  } else if (game.screen === 'win') {
    drawWin(ctx, game);
  } else {
    drawWorld(ctx, game);
  }
}

// Staged screenshots: ?shot=start|play|alert|win freezes a real game state.
// Load the first room first, so the staging has a thief and guards to place.
loadLevel(0);
const params = new URLSearchParams(window.location.search);
applyShot(game, params.get('shot'));

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose the game for play-testing in a headless browser.
window.__marlow = game;
