// Small sounds, synthesized with the Web Audio API: no audio files, no network.
// Everything is guarded, so a browser without audio (or a muted tab) plays on
// in silence.

let audio = null;

function context() {
  if (audio) return audio;
  try {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return null;
    audio = new Ctor();
    return audio;
  } catch {
    return null;
  }
}

/** One short note: frequency, seconds long, this loud, this wave. */
function blip(freq, seconds, gainValue, wave = 'sine') {
  const ctx = context();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  } catch {
    // Sound is garnish: never let it break the game.
  }
}

export const sounds = {
  playCard() {
    blip(520, 0.12, 0.12, 'triangle');
  },
  winTrick() {
    blip(660, 0.1, 0.1, 'sine');
    setTimeout(() => blip(880, 0.14, 0.1, 'sine'), 90);
  },
  loseTrick() {
    blip(220, 0.18, 0.1, 'sawtooth');
  },
  victory() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => blip(freq, 0.22, 0.12, 'triangle'), i * 120);
    });
  },
  defeat() {
    [392, 330, 262].forEach((freq, i) => {
      setTimeout(() => blip(freq, 0.25, 0.1, 'triangle'), i * 140);
    });
  },
};
