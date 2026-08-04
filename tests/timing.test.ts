import { describe, it, expect } from 'vitest';
import { beatDurationSeconds, beatToSeconds, beatToMs, secondsToBeat, msToBeat } from '../src/game/utils/timing';

describe('beatDurationSeconds', () => {
  it('BPM 60이면 1박 = 1초', () => {
    expect(beatDurationSeconds(60)).toBe(1);
  });
  it('BPM 120이면 1박 = 0.5초', () => {
    expect(beatDurationSeconds(120)).toBe(0.5);
  });
  it('BPM이 0 이하이면 에러를 던진다', () => {
    expect(() => beatDurationSeconds(0)).toThrow();
    expect(() => beatDurationSeconds(-10)).toThrow();
  });
});

describe('beatToSeconds / beatToMs', () => {
  it('BPM 80, beat 4 -> 3초', () => {
    expect(beatToSeconds(4, 80)).toBeCloseTo(3);
  });
  it('BPM 80, beat 4 -> 3000ms', () => {
    expect(beatToMs(4, 80)).toBeCloseTo(3000);
  });
});

describe('secondsToBeat / msToBeat', () => {
  it('BPM 80, 3초 -> beat 4', () => {
    expect(secondsToBeat(3, 80)).toBeCloseTo(4);
  });
  it('BPM 80, 3000ms -> beat 4', () => {
    expect(msToBeat(3000, 80)).toBeCloseTo(4);
  });
  it('beatToMs와 msToBeat은 서로 역함수 관계다', () => {
    const bpm = 96;
    const beat = 12.5;
    expect(msToBeat(beatToMs(beat, bpm), bpm)).toBeCloseTo(beat);
  });
});
