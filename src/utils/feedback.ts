/**
 * ITERUM Sensory Feedback Engine
 * Combines haptic, audio, and visual feedback for satisfying interactions.
 * Zero dependencies — uses Web Audio API and navigator.vibrate().
 */

// ─── Audio Context (lazy init) ───────────────────────────
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Check if sounds are muted for this browser.
function isMuted(): boolean {
  return localStorage.getItem('iterum_sound_muted') === 'true';
}

export function toggleMute(): boolean {
  const muted = !isMuted();
  localStorage.setItem('iterum_sound_muted', String(muted));
  return muted;
}

export function getMuteState(): boolean {
  return isMuted();
}

// ─── Sound Synthesis ─────────────────────────────────────

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volumeStart = 0.15,
  volumeEnd = 0.001,
  rampTime?: number,
) {
  if (isMuted()) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (rampTime) {
      osc.frequency.exponentialRampToValueAtTime(
        frequency * (rampTime > 0 ? 1.5 : 0.5),
        ctx.currentTime + duration,
      );
    }

    gain.gain.setValueAtTime(volumeStart, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volumeEnd, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio is not available
  }
}

function soundPop() {
  playTone(600, 0.12, 'sine', 0.12, 0.001, 1);
  setTimeout(() => playTone(900, 0.08, 'sine', 0.08, 0.001), 60);
}

function soundClick() {
  playTone(800, 0.04, 'square', 0.05, 0.001);
}

function soundLevelUp() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'sine', 0.1, 0.001), i * 120);
  });
}

function soundError() {
  playTone(300, 0.15, 'sawtooth', 0.08, 0.001, -1);
}

function soundUndo() {
  playTone(500, 0.1, 'sine', 0.08, 0.001, -1);
  setTimeout(() => playTone(350, 0.12, 'sine', 0.06, 0.001), 80);
}

function soundStreak() {
  playTone(700, 0.15, 'sine', 0.1, 0.001, 1);
  setTimeout(() => playTone(880, 0.2, 'triangle', 0.08, 0.001), 100);
}

// ─── Haptic Patterns ─────────────────────────────────────

function vibrate(pattern: number | number[]) {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Not supported
  }
}

// ─── Event Emitter for Visual Feedback ───────────────────

type FeedbackEventType = 'confetti' | 'pulse' | 'shake';

function emitVisual(type: FeedbackEventType, detail?: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('iterum-feedback', { detail: { type, ...detail } }),
  );
}

// ─── Public API ──────────────────────────────────────────

export const feedback = {
  /** Habit completed, task checked */
  success() {
    soundPop();
    vibrate([15, 50, 15]);
  },

  /** Generic button tap */
  tap() {
    soundClick();
    vibrate(10);
  },

  /** Level up, milestone reached, streak of 7/30 */
  celebrate() {
    soundLevelUp();
    vibrate([20, 40, 20, 40, 30]);
    emitVisual('confetti');
  },

  /** Streak milestone (3, 7, 14, 30 days) */
  streak() {
    soundStreak();
    vibrate([15, 30, 15]);
  },

  /** Undo action */
  undo() {
    soundUndo();
    vibrate(20);
  },

  /** Error / failure */
  error() {
    soundError();
    vibrate([50, 30, 80]);
  },
};
