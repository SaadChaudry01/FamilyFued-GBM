// Family Feud Sound Effects using Web Audio API

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Play a tone with envelope
  private playTone(
    frequency: number, 
    duration: number, 
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    delay: number = 0
  ): void {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      const startTime = ctx.currentTime + delay;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }

  // Classic Family Feud "DING" for correct answer reveal
  playReveal(): void {
    // Two-tone ding like the show
    this.playTone(880, 0.15, 'sine', 0.4);
    this.playTone(1320, 0.25, 'sine', 0.35, 0.08);
  }

  // Family Feud BUZZER - the big X sound
  playStrike(): void {
    // Low harsh buzzer
    this.playTone(150, 0.6, 'sawtooth', 0.5);
    this.playTone(120, 0.6, 'square', 0.3);
    this.playTone(90, 0.7, 'sawtooth', 0.2, 0.1);
  }

  // Steal success - triumphant sound
  playStealSuccess(): void {
    this.playTone(523, 0.12, 'sine', 0.4); // C
    this.playTone(659, 0.12, 'sine', 0.4, 0.1); // E
    this.playTone(784, 0.12, 'sine', 0.4, 0.2); // G
    this.playTone(1047, 0.3, 'sine', 0.5, 0.3); // High C
  }

  // Steal fail - sad trombone style
  playStealFail(): void {
    this.playTone(300, 0.25, 'sawtooth', 0.3);
    this.playTone(280, 0.25, 'sawtooth', 0.3, 0.2);
    this.playTone(260, 0.25, 'sawtooth', 0.3, 0.4);
    this.playTone(200, 0.5, 'sawtooth', 0.4, 0.6);
  }

  // Round win fanfare
  playRoundWin(): void {
    const notes = [523, 659, 784, 880, 1047];
    notes.forEach((note, i) => {
      this.playTone(note, 0.15, 'sine', 0.35, i * 0.08);
    });
    // Final chord
    this.playTone(523, 0.4, 'sine', 0.25, 0.5);
    this.playTone(659, 0.4, 'sine', 0.25, 0.5);
    this.playTone(784, 0.4, 'sine', 0.25, 0.5);
  }

  // Game over celebration
  playGameOver(): void {
    // Victory fanfare
    const melody = [523, 523, 523, 698, 880, 784, 698, 880, 1047];
    melody.forEach((note, i) => {
      this.playTone(note, i < 3 ? 0.1 : 0.2, 'sine', 0.35, i * 0.12);
    });
  }

  // Face-off ding - anticipation
  playFaceoffDing(): void {
    this.playTone(660, 0.2, 'sine', 0.4);
  }

  // Number flip sound
  playFlip(): void {
    this.playTone(600, 0.08, 'sine', 0.25);
    this.playTone(800, 0.1, 'sine', 0.3, 0.05);
  }

  // Points counting up
  playPointTick(): void {
    this.playTone(1000, 0.05, 'sine', 0.2);
  }
}

export const soundManager = new SoundManager();
