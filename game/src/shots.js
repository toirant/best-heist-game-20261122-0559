// Screenshot staging for The Marlow Job. The bounty asks for real renders
// of the game in a browser, so each shot sets the game to a genuine state
// — title, mid-heist, spotted, getaway — and freezes the clock there, so a
// headless browser captures the same frame every time. Nothing here edits
// the game: it only places the thief, the guards and the alarm where a real
// run would put them, then lets the normal render draw them.
//
//   ?shot=start  — title screen over the gallery
//   ?shot=play   — mid-heist: thief by the sapphire, cones sweeping, alarm 35%
//   ?shot=alert  — spotted: a guard chasing, alarm 85%, SPOTTED banner
//   ?shot=win    — the getaway screen with the payout

import { ALARM } from './config.js';

export function applyShot(game, shot) {
  if (!shot) return false;
  if (shot === 'start') {
    game.screen = 'title';
    game.frozen = true;
    return true;
  }
  if (shot === 'play') {
    game.screen = 'playing';
    game.frozen = true;
    // Thief crouched behind the central display case, sapphire in reach.
    game.player.x = 560;
    game.player.y = 445;
    game.player.sneaking = true;
    game.player.angle = 0;
    // One guard mid-patrol above, cone sweeping down the room.
    const g = game.guards[0];
    g.x = 640;
    g.y = 200;
    g.angle = Math.PI / 2;
    g.state = 'patrol';
    g.suspicion = 0.3;
    const g2 = game.guards[1];
    g2.x = 980;
    g2.y = 620;
    g2.angle = Math.PI;
    g2.state = 'patrol';
    game.alarm = 35;
    // Two prizes already lifted, the sapphire still glittering.
    game.loot.find((l) => l.id === 'gem1').taken = true;
    game.loot.find((l) => l.id === 'gem2').taken = true;
    game.lootValue = 600;
    return true;
  }
  if (shot === 'alert') {
    game.screen = 'playing';
    game.frozen = true;
    // The thief broke cover: a guard is on them, alarm nearly blown.
    game.player.x = 700;
    game.player.y = 300;
    game.player.angle = Math.PI / 4;
    const g = game.guards[0];
    g.x = 640;
    g.y = 240;
    g.angle = Math.PI / 2;
    g.state = 'chase';
    g.suspicion = 1;
    const g2 = game.guards[1];
    g2.x = 900;
    g2.y = 480;
    g2.angle = -Math.PI / 2;
    g2.state = 'investigate';
    g2.suspicion = 0.7;
    game.alarm = 85;
    game.spottedFlash = 0.85;
    game.loot.find((l) => l.id === 'sapphire').taken = true;
    game.lootValue = 900;
    return true;
  }
  if (shot === 'win') {
    game.screen = 'win';
    game.frozen = true;
    game.lootValue = 3850;
    game.spent = 300;
    game.elapsed = 214;
    game.levelIndex = 2;
    return true;
  }
  return false;
}
