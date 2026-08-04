import { PianoSynth } from './PianoSynth';
import { EffectSynth } from './EffectSynth';

/**
 * AudioContext는 iOS Safari/Chrome의 자동재생 제한 때문에 반드시 사용자 제스처
 * (버튼 터치 등) 이후에 생성/resume 해야 한다. 이 클래스는 그 초기화와
 * 곡 재생 위치(오디오 시간 기준 clock), 마스터 볼륨/음소거를 관리한다.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _pianoSynth: PianoSynth | null = null;
  private _effectSynth: EffectSynth | null = null;

  private muted = false;
  private volume = 0.8;

  // 곡 위치(clock) 상태
  private songStartCtxTime = 0;
  private pausedPositionMs: number | null = null;
  private songRunning = false;

  /** 기기별 오디오 출력 지연 보정값(ms). 관리자 설정으로 조정 가능 */
  latencyOffsetMs = 0;

  get initialized(): boolean {
    return this.ctx !== null;
  }

  /** 반드시 사용자 제스처(클릭/터치) 핸들러 안에서 호출해야 한다 */
  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    const AudioContextClass =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : this.volume;
    this.masterGain.connect(this.ctx.destination);
    this._pianoSynth = new PianoSynth(this.ctx, this.masterGain);
    this._effectSynth = new EffectSynth(this.ctx, this.masterGain);
  }

  get pianoSynth(): PianoSynth {
    if (!this._pianoSynth) throw new Error('AudioManager가 초기화되지 않았습니다. init()을 먼저 호출하세요.');
    return this._pianoSynth;
  }

  get effectSynth(): EffectSynth {
    if (!this._effectSynth) throw new Error('AudioManager가 초기화되지 않았습니다. init()을 먼저 호출하세요.');
    return this._effectSynth;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /** 탭이 백그라운드로 이동했을 때 등, 오디오 컨텍스트 자체를 일시 정지 */
  suspendContext(): void {
    if (this.ctx && this.ctx.state === 'running') {
      void this.ctx.suspend();
    }
  }

  resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private get ctxTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** 곡 재생 시작 (위치 0ms부터) */
  startSong(): void {
    this.songStartCtxTime = this.ctxTime;
    this.pausedPositionMs = null;
    this.songRunning = true;
  }

  /** 현재 곡 위치를 그대로 보존하며 일시정지 */
  pauseSong(): void {
    if (!this.songRunning) return;
    this.pausedPositionMs = this.getSongPositionMs();
    this.songRunning = false;
  }

  /** 일시정지된 지점부터 정확히 이어서 재개 */
  resumeSong(): void {
    if (this.songRunning || this.pausedPositionMs === null) return;
    this.songStartCtxTime = this.ctxTime - this.pausedPositionMs / 1000;
    this.pausedPositionMs = null;
    this.songRunning = true;
  }

  stopSong(): void {
    this.songRunning = false;
    this.pausedPositionMs = null;
  }

  /** 현재 곡 재생 위치(ms). 지연 보정값은 포함하지 않은 "순수" 음악 위치 */
  getSongPositionMs(): number {
    if (!this.songRunning) {
      return this.pausedPositionMs ?? 0;
    }
    return (this.ctxTime - this.songStartCtxTime) * 1000;
  }

  /** 판정 계산 등에 사용할, 지연 보정이 적용된 현재 위치(ms) */
  getAdjustedPositionMs(): number {
    return this.getSongPositionMs() + this.latencyOffsetMs;
  }

  scheduleAt(offsetMs: number): number {
    return this.ctxTime + offsetMs / 1000;
  }
}
