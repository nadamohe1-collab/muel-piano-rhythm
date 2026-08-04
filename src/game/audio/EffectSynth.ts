/**
 * Web Audio API만으로 효과음을 생성한다. 유료 음원을 사용하지 않으며,
 * 피아노 음(PianoSynth)과 주파수대가 겹치지 않도록 짧고 톤이 다른 소리로 설계했다.
 */
export class EffectSynth {
  constructor(private readonly ctx: AudioContext, private readonly masterGain: GainNode) {}

  private blip(freq: number, duration: number, type: OscillatorType, gainPeak: number, when: number): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(gainPeak, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(when);
    osc.stop(when + duration + 0.05);

    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, (duration + 0.1) * 1000);
  }

  buttonTouch(): void {
    this.blip(520, 0.06, 'sine', 0.25, this.ctx.currentTime);
  }

  perfect(): void {
    const now = this.ctx.currentTime;
    this.blip(1046.5, 0.12, 'sine', 0.3, now);
    this.blip(1568, 0.14, 'sine', 0.22, now + 0.03);
  }

  great(): void {
    this.blip(880, 0.12, 'sine', 0.28, this.ctx.currentTime);
  }

  good(): void {
    this.blip(660, 0.1, 'triangle', 0.22, this.ctx.currentTime);
  }

  miss(): void {
    const now = this.ctx.currentTime;
    this.blip(220, 0.14, 'sine', 0.18, now);
  }

  countdownTick(): void {
    this.blip(440, 0.08, 'square', 0.15, this.ctx.currentTime);
  }

  countdownGo(): void {
    const now = this.ctx.currentTime;
    this.blip(660, 0.15, 'square', 0.2, now);
    this.blip(880, 0.18, 'square', 0.2, now + 0.08);
  }

  songComplete(): void {
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      this.blip(freq, 0.2, 'sine', 0.25, now + i * 0.09);
    });
  }

  newRecord(): void {
    const now = this.ctx.currentTime;
    [659.25, 783.99, 987.77, 1318.5].forEach((freq, i) => {
      this.blip(freq, 0.22, 'triangle', 0.28, now + i * 0.07);
    });
  }

  rankingEntered(): void {
    const now = this.ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      this.blip(freq, 0.16, 'sine', 0.24, now + i * 0.08);
    });
  }
}
