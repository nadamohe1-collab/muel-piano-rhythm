import { NOTE_FREQUENCIES_HZ } from '../config/constants';

/**
 * 단순 사인파 하나가 아니라 여러 오실레이터 + 필터 + gain envelope를 조합해
 * 부드러운 피아노 음을 생성한다. 빠른 어택, 자연스러운 감쇠, 짧은 서스테인,
 * 부드러운 릴리즈를 갖도록 설계했다.
 */
export class PianoSynth {
  constructor(private readonly ctx: AudioContext, private readonly masterGain: GainNode) {}

  /** 레인 번호(0~6)에 해당하는 피아노 음을 재생한다 */
  playLane(lane: number, when: number = this.ctx.currentTime, velocity = 0.9): void {
    const freq = NOTE_FREQUENCIES_HZ[lane];
    if (freq === undefined) return;
    this.playFrequency(freq, when, velocity);
  }

  playFrequency(freq: number, when: number, velocity = 0.9): void {
    const ctx = this.ctx;
    const duration = 1.1; // 음이 자연스럽게 사라질 때까지의 전체 길이

    const noteGain = ctx.createGain();
    noteGain.gain.value = 0;
    noteGain.connect(this.masterGain);

    // 저역통과 필터: 배음을 부드럽게 눌러 태블릿 스피커에서 찢어지지 않게 한다
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(freq * 6, 8000);
    filter.Q.value = 0.7;
    filter.connect(noteGain);

    // 기본음 + 배음(옥타브, 5도) 오실레이터를 섞어 피아노에 가까운 음색을 만든다
    const partials: Array<{ ratio: number; type: OscillatorType; gain: number }> = [
      { ratio: 1, type: 'triangle', gain: 0.55 },
      { ratio: 2, type: 'sine', gain: 0.22 },
      { ratio: 3, type: 'sine', gain: 0.09 },
      { ratio: 4.005, type: 'sine', gain: 0.05 }, // 살짝 어긋난 배음으로 자연스러운 두께감
    ];

    const oscillators: OscillatorNode[] = [];
    for (const partial of partials) {
      const osc = ctx.createOscillator();
      osc.type = partial.type;
      osc.frequency.value = freq * partial.ratio;

      const partialGain = ctx.createGain();
      partialGain.gain.value = partial.gain;

      osc.connect(partialGain);
      partialGain.connect(filter);
      osc.start(when);
      osc.stop(when + duration + 0.1);
      oscillators.push(osc);
    }

    // ADSR과 유사한 envelope: 빠른 어택 -> 자연스러운 감쇠 -> 짧은 서스테인 -> 부드러운 릴리즈
    const peak = velocity;
    const g = noteGain.gain;
    g.setValueAtTime(0, when);
    g.linearRampToValueAtTime(peak, when + 0.008); // 어택
    g.exponentialRampToValueAtTime(Math.max(peak * 0.35, 0.0001), when + 0.18); // 감쇠
    g.setValueAtTime(Math.max(peak * 0.35, 0.0001), when + 0.35); // 서스테인
    g.exponentialRampToValueAtTime(0.0001, when + duration); // 릴리즈

    // 메모리 정리
    const cleanupDelayMs = (duration + 0.2) * 1000;
    setTimeout(() => {
      for (const osc of oscillators) osc.disconnect();
      filter.disconnect();
      noteGain.disconnect();
    }, cleanupDelayMs);
  }
}
