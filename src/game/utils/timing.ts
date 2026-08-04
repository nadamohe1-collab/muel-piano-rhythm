/**
 * BPM과 beat 값을 기준으로 시간을 계산하는 유틸리티.
 * 밀리초를 직접 하드코딩하지 않고 항상 이 함수들을 통해 계산합니다.
 */

/** 1박(quarter note)의 길이(초) */
export function beatDurationSeconds(bpm: number): number {
  if (bpm <= 0) {
    throw new Error('BPM은 0보다 커야 합니다.');
  }
  return 60 / bpm;
}

/** beat 값을 곡 시작 기준 초 단위 시간으로 변환 */
export function beatToSeconds(beat: number, bpm: number): number {
  return beat * beatDurationSeconds(bpm);
}

/** beat 값을 곡 시작 기준 밀리초 단위 시간으로 변환 */
export function beatToMs(beat: number, bpm: number): number {
  return beatToSeconds(beat, bpm) * 1000;
}

/** 초 단위 시간을 beat 값으로 변환 */
export function secondsToBeat(seconds: number, bpm: number): number {
  return seconds / beatDurationSeconds(bpm);
}

/** 밀리초 단위 시간을 beat 값으로 변환 */
export function msToBeat(ms: number, bpm: number): number {
  return secondsToBeat(ms / 1000, bpm);
}

/** 두 오디오 시각(초) 사이의 차이를 밀리초로 반환 */
export function secondsDiffToMs(a: number, b: number): number {
  return (a - b) * 1000;
}
