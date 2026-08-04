import {
  JUDGMENT_SCORE,
  COMBO_MULTIPLIER_TIERS,
  ACCURACY_WEIGHT,
  GRADE_THRESHOLDS,
  STAR_RULES,
} from '../config/constants';
import type { JudgmentType, Grade, JudgmentCounts } from '../types/score';

/** 현재 콤보 수에 해당하는 점수 배율을 반환한다 */
export function getComboMultiplier(combo: number): number {
  for (const tier of COMBO_MULTIPLIER_TIERS) {
    if (combo >= tier.minCombo) {
      return tier.multiplier;
    }
  }
  return 1.0;
}

/** 하나의 판정에 대한 획득 점수 (콤보 배율 적용, 정수 반올림) */
export function calculateJudgmentScore(judgment: JudgmentType, comboBeforeThisNote: number): number {
  const base = JUDGMENT_SCORE[judgment];
  if (base === 0) return 0;
  const multiplier = getComboMultiplier(comboBeforeThisNote);
  return Math.round(base * multiplier);
}

/** Miss가 아니면 콤보 +1, Miss면 0으로 초기화 */
export function nextCombo(currentCombo: number, judgment: JudgmentType): number {
  if (judgment === 'miss') return 0;
  return currentCombo + 1;
}

/**
 * 정확도(%) 계산. 내부적으로는 충분한 정밀도를 유지하고,
 * 화면 표시 시에만 소수점 첫째 자리로 반올림한다 (formatAccuracy 참고).
 */
export function calculateAccuracy(counts: JudgmentCounts): number {
  const total = counts.perfect + counts.great + counts.good + counts.miss;
  if (total === 0) return 0;
  const weightedSum =
    counts.perfect * ACCURACY_WEIGHT.perfect +
    counts.great * ACCURACY_WEIGHT.great +
    counts.good * ACCURACY_WEIGHT.good +
    counts.miss * ACCURACY_WEIGHT.miss;
  return weightedSum / total;
}

export function calculateGrade(accuracy: number): Grade {
  for (const threshold of GRADE_THRESHOLDS) {
    if (accuracy >= threshold.minAccuracy) {
      return threshold.grade;
    }
  }
  return 'RETRY';
}

/**
 * 별 계산.
 * - 3별: 정확도 95% 이상 & Miss 2개 이하
 * - 2별: 정확도 85% 이상
 * - 1별: 곡 완주
 * - 0별: 중도 종료
 */
export function calculateStars(accuracy: number, missCount: number, completed: boolean): 0 | 1 | 2 | 3 {
  if (!completed) return 0;
  if (accuracy >= STAR_RULES.threeStar.minAccuracy && missCount <= STAR_RULES.threeStar.maxMiss) {
    return 3;
  }
  if (accuracy >= STAR_RULES.twoStar.minAccuracy) {
    return 2;
  }
  return 1;
}
