import { describe, it, expect } from 'vitest';
import {
  getComboMultiplier,
  calculateJudgmentScore,
  nextCombo,
  calculateAccuracy,
  calculateGrade,
  calculateStars,
} from '../src/game/systems/ScoreSystem';

describe('getComboMultiplier', () => {
  it('0~9 콤보는 1.0배', () => {
    expect(getComboMultiplier(0)).toBe(1.0);
    expect(getComboMultiplier(9)).toBe(1.0);
  });
  it('10~29 콤보는 1.1배', () => {
    expect(getComboMultiplier(10)).toBe(1.1);
    expect(getComboMultiplier(29)).toBe(1.1);
  });
  it('30~49 콤보는 1.2배', () => {
    expect(getComboMultiplier(30)).toBe(1.2);
    expect(getComboMultiplier(49)).toBe(1.2);
  });
  it('50콤보 이상은 1.3배', () => {
    expect(getComboMultiplier(50)).toBe(1.3);
    expect(getComboMultiplier(999)).toBe(1.3);
  });
});

describe('calculateJudgmentScore', () => {
  it('Perfect 기본 점수는 1000점 (콤보 0)', () => {
    expect(calculateJudgmentScore('perfect', 0)).toBe(1000);
  });
  it('Miss는 항상 0점', () => {
    expect(calculateJudgmentScore('miss', 40)).toBe(0);
  });
  it('콤보 배율이 적용된다 (Perfect, 콤보 30 -> x1.2)', () => {
    expect(calculateJudgmentScore('perfect', 30)).toBe(1200);
  });
  it('Great 기본 점수는 700점', () => {
    expect(calculateJudgmentScore('great', 0)).toBe(700);
  });
  it('Good 기본 점수는 300점', () => {
    expect(calculateJudgmentScore('good', 0)).toBe(300);
  });
});

describe('nextCombo', () => {
  it('Miss가 아니면 콤보가 1 증가한다', () => {
    expect(nextCombo(5, 'perfect')).toBe(6);
    expect(nextCombo(5, 'great')).toBe(6);
    expect(nextCombo(5, 'good')).toBe(6);
  });
  it('Miss면 콤보가 0으로 초기화된다', () => {
    expect(nextCombo(20, 'miss')).toBe(0);
  });
});

describe('calculateAccuracy', () => {
  it('모두 Perfect면 정확도 100%', () => {
    expect(calculateAccuracy({ perfect: 10, great: 0, good: 0, miss: 0 })).toBe(100);
  });
  it('모두 Miss면 정확도 0%', () => {
    expect(calculateAccuracy({ perfect: 0, great: 0, good: 0, miss: 10 })).toBe(0);
  });
  it('혼합된 판정의 가중 평균을 계산한다', () => {
    // 2 perfect(100) + 2 miss(0) = 200/4 = 50
    expect(calculateAccuracy({ perfect: 2, great: 0, good: 0, miss: 2 })).toBe(50);
  });
  it('노트가 없으면 0%', () => {
    expect(calculateAccuracy({ perfect: 0, great: 0, good: 0, miss: 0 })).toBe(0);
  });
});

describe('calculateGrade', () => {
  it('95% 이상은 S등급', () => {
    expect(calculateGrade(95)).toBe('S');
    expect(calculateGrade(100)).toBe('S');
  });
  it('90% 이상 95% 미만은 A등급', () => {
    expect(calculateGrade(90)).toBe('A');
    expect(calculateGrade(94.9)).toBe('A');
  });
  it('80% 이상 90% 미만은 B등급', () => {
    expect(calculateGrade(80)).toBe('B');
  });
  it('70% 이상 80% 미만은 C등급', () => {
    expect(calculateGrade(70)).toBe('C');
  });
  it('70% 미만은 다시 도전', () => {
    expect(calculateGrade(69.9)).toBe('RETRY');
    expect(calculateGrade(0)).toBe('RETRY');
  });
});

describe('calculateStars', () => {
  it('중도 종료면 0별', () => {
    expect(calculateStars(100, 0, false)).toBe(0);
  });
  it('완주 + 정확도 95%↑ + Miss 2개 이하면 3별', () => {
    expect(calculateStars(96, 2, true)).toBe(3);
    expect(calculateStars(96, 3, true)).toBe(2); // Miss가 많으면 3별 아님
  });
  it('완주 + 정확도 85%↑면 2별', () => {
    expect(calculateStars(85, 5, true)).toBe(2);
  });
  it('완주만 하면 최소 1별', () => {
    expect(calculateStars(50, 20, true)).toBe(1);
  });
});
