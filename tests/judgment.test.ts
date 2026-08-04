import { describe, it, expect } from 'vitest';
import {
  computeJudgmentWindows,
  judgeByOffset,
  isNotePassedWindow,
  findClosestUnjudgedNote,
} from '../src/game/systems/JudgmentSystem';

describe('computeJudgmentWindows', () => {
  it('배율 1.0이면 기본 판정 범위를 그대로 사용한다', () => {
    const windows = computeJudgmentWindows(1.0);
    expect(windows).toEqual({ perfect: 70, great: 130, good: 200 });
  });
  it('처음 난이도(1.2배)는 판정 범위가 20% 넓어진다', () => {
    const windows = computeJudgmentWindows(1.2);
    expect(windows.perfect).toBeCloseTo(84);
    expect(windows.great).toBeCloseTo(156);
    expect(windows.good).toBeCloseTo(240);
  });
});

describe('judgeByOffset - 경계값', () => {
  const windows = { perfect: 70, great: 130, good: 200 };

  it('±70ms 이내는 Perfect (경계값 포함)', () => {
    expect(judgeByOffset(0, windows)).toBe('perfect');
    expect(judgeByOffset(70, windows)).toBe('perfect');
    expect(judgeByOffset(-70, windows)).toBe('perfect');
  });
  it('70ms 초과 130ms 이내는 Great', () => {
    expect(judgeByOffset(71, windows)).toBe('great');
    expect(judgeByOffset(130, windows)).toBe('great');
  });
  it('130ms 초과 200ms 이내는 Good', () => {
    expect(judgeByOffset(131, windows)).toBe('good');
    expect(judgeByOffset(200, windows)).toBe('good');
  });
  it('200ms 초과는 Miss', () => {
    expect(judgeByOffset(201, windows)).toBe('miss');
    expect(judgeByOffset(-500, windows)).toBe('miss');
  });
});

describe('isNotePassedWindow', () => {
  const windows = { perfect: 70, great: 130, good: 200 };
  it('good 범위를 넘어서면 true', () => {
    expect(isNotePassedWindow(1000, 1201, windows)).toBe(true);
  });
  it('good 범위 이내면 false', () => {
    expect(isNotePassedWindow(1000, 1150, windows)).toBe(false);
  });
});

describe('findClosestUnjudgedNote', () => {
  const windows = { perfect: 70, great: 130, good: 200 };

  it('같은 레인에 여러 노트가 있으면 시간 차이가 가장 적은 노트를 찾는다', () => {
    const notes = [
      { id: 'a', lane: 0, targetTimeMs: 1000, judged: false },
      { id: 'b', lane: 0, targetTimeMs: 1150, judged: false },
    ];
    const result = findClosestUnjudgedNote(notes, 0, 1120, windows);
    expect(result?.id).toBe('b');
  });

  it('이미 판정된 노트는 대상에서 제외한다', () => {
    const notes = [
      { id: 'a', lane: 0, targetTimeMs: 1000, judged: true },
      { id: 'b', lane: 0, targetTimeMs: 1150, judged: false },
    ];
    const result = findClosestUnjudgedNote(notes, 0, 1000, windows);
    expect(result?.id).toBe('b');
  });

  it('다른 레인의 노트는 판정 대상이 아니다', () => {
    const notes = [{ id: 'a', lane: 1, targetTimeMs: 1000, judged: false }];
    const result = findClosestUnjudgedNote(notes, 0, 1000, windows);
    expect(result).toBeUndefined();
  });

  it('판정 범위(good) 밖의 노트는 찾지 않는다', () => {
    const notes = [{ id: 'a', lane: 0, targetTimeMs: 1000, judged: false }];
    const result = findClosestUnjudgedNote(notes, 0, 1300, windows);
    expect(result).toBeUndefined();
  });
});
