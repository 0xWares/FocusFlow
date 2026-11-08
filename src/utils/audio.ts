/**
 * Pure Web Audio API Sound Synthesizer for FocusFlow.
 * Provides zen bell/chime alerts and procedural ambient focus sounds (rain, stream, white noise).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;
  private currentAmbientType: string = 'none';

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays a resonant singing bowl / gentle meditation bell.
   */
  public playChime(freq = 528, duration = 3.5): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Primary tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Overtone harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.5, now);

      // Master gain envelope
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + (duration * 0.7));

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {
      // AudioContext unavailable or autoplay blocked
    }
  }

  /**
   * Plays a crisp celebration harmonic chime when completing a session.
   */
  public playCelebrationChime(): void {
    try {
      const notes = [528, 660, 792, 1056];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playChime(freq, 2.5);
        }, idx * 160);
      });
    } catch {}
  }

  /**
   * Generates procedural ambient noise (Rain, Stream, or White Noise).
   */
  public startAmbient(type: 'rain' | 'stream' | 'white-noise', volume = 0.3): void {
    try {
      this.stopAmbient();
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate pink/brown noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'white-noise') {
          data[i] = white * 0.15;
        } else if (type === 'rain') {
          // Pink noise filter
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        } else {
          // Brown noise (gentle stream)
          lastOut = (lastOut + (0.02 * white)) / 1.02;
          data[i] = lastOut * 0.35;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter
      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
      } else if (type === 'stream') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(0);

      this.ambientSource = noise;
      this.ambientGain = gain;
      this.isAmbientPlaying = true;
      this.currentAmbientType = type;
    } catch {}
  }

  public setAmbientVolume(vol: number): void {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(Math.min(1, Math.max(0, vol)), this.ctx.currentTime);
    }
  }

  public stopAmbient(): void {
    try {
      if (this.ambientSource) {
        (this.ambientSource as AudioBufferSourceNode).stop();
        this.ambientSource.disconnect();
        this.ambientSource = null;
      }
      this.isAmbientPlaying = false;
      this.currentAmbientType = 'none';
    } catch {}
  }

  public isPlaying(): boolean {
    return this.isAmbientPlaying;
  }

  public getCurrentType(): string {
    return this.currentAmbientType;
  }
}

export const soundEngine = new SoundEngine();
