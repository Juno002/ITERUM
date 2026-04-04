/**
 * Simple utility to play UI sounds using Web Audio API
 */
class SoundManager {
  private context: AudioContext | null = null;

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playPop() {
    this.init();
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.1);
  }

  playSuccess() {
    this.init();
    if (!this.context) return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5

    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.start();
    oscillator.stop(now + 0.3);
  }
}

export const soundManager = new SoundManager();
