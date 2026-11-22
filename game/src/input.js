// Keyboard and mouse for The Marlow Job. WASD or arrows move, Shift
// sneaks, F cracks a safe, Q throws smoke, E fires the EMP, M mutes, and a
// mouse click tosses a coin to the clicked spot to lure a guard. Enter or
// a click starts the game from the title screen.

export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    crack: false,
    click: null, // {x, y} in playfield coordinates, consumed by main
    started: false,
    restart: false,
    mute: false,
  };
}

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  KeyF: 'crack',
};

export function bindInput(input, canvas, toPlayfield) {
  window.addEventListener('keydown', (e) => {
    const field = KEYMAP[e.code];
    if (field) {
      input[field] = true;
      e.preventDefault();
    }
    if (e.code === 'Enter' || e.code === 'Space') {
      input.started = true;
      e.preventDefault();
    }
    if (e.code === 'KeyR') input.restart = true;
    if (e.code === 'KeyM') input.mute = true;
    // One-shot tool presses: latched until the game loop consumes them, so
    // a quick tap is never lost between two frames.
    if (e.code === 'KeyQ') input.smokePressed = true;
    if (e.code === 'KeyE') input.empPressed = true;
  });
  window.addEventListener('keyup', (e) => {
    const field = KEYMAP[e.code];
    if (field) input[field] = false;
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = toPlayfield(e.clientX, e.clientY);
    input.click = p;
    input.started = true;
  });
  // Keep focus on the game so arrow keys never scroll the page.
  canvas.addEventListener('click', () => canvas.focus());
}
