// Synthesized sound for The Marlow Job: every blip is drawn from a
// WebAudio oscillator, so the game ships no audio files and makes no
// network request. The context starts on the first user gesture, as the
// browser requires, and stays silent until then.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(freq, seconds, type = 'sine', volume = 0.12, slideTo = null) {
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + seconds);
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

// One small sound per game moment, each with its own shape.
export const sfx = {
  pickup() { tone(880, 0.12, 'sine', 0.14); tone(1320, 0.16, 'sine', 0.1); },
  coin() { tone(1568, 0.08, 'triangle', 0.1); },
  smoke() { tone(220, 0.4, 'sawtooth', 0.05, 90); },
  emp() { tone(1200, 0.3, 'square', 0.05, 120); },
  spotted() { tone(196, 0.5, 'sawtooth', 0.12, 392); },
  crackTick() { tone(660, 0.05, 'square', 0.05); },
  safeOpen() { tone(523, 0.15, 'sine', 0.12); tone(784, 0.2, 'sine', 0.12); tone(1047, 0.3, 'sine', 0.12); },
  levelClear() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sine', 0.12), i * 110)); },
  busted() { tone(392, 0.7, 'sawtooth', 0.12, 98); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sine', 0.12), i * 130)); },
  click() { tone(440, 0.05, 'square', 0.05); },
};
