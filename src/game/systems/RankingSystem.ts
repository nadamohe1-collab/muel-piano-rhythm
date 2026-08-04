import { RANKING_DISPLAY_LIMIT, RANKING_STORAGE_LIMIT } from '../config/constants';
import { normalizeNameForComparison } from '../utils/validation';
import type { RankingEntry } from '../types/ranking';
import type { PlayResult } from '../types/score';

/**
 * 두 기록을 비교한다. a가 b보다 더 좋은 기록이면 음수, 더 나쁘면 양수, 동일하면 0.
 * 비교 순서: 1) 높은 점수 2) 높은 정확도 3) 적은 Miss 4) 높은 최고 콤보 5) 먼저 달성한 기록
 */
export function compareRankingEntries(a: RankingEntry, b: RankingEntry): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
  if (a.missCount !== b.missCount) return a.missCount - b.missCount;
  if (a.maxCombo !== b.maxCombo) return b.maxCombo - a.maxCombo;
  return a.achievedAt - b.achievedAt;
}

export function sortRankingEntries(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort(compareRankingEntries);
}

export function playResultToRankingEntry(result: PlayResult): RankingEntry {
  const normalizedName = normalizeNameForComparison(result.studentName);
  return {
    id: `${result.songId}:${result.difficultyId}:${normalizedName}`,
    songId: result.songId,
    difficultyId: result.difficultyId,
    studentName: result.studentName,
    normalizedName,
    score: result.score,
    accuracy: result.accuracy,
    missCount: result.judgments.miss,
    maxCombo: result.maxCombo,
    grade: result.grade,
    achievedAt: result.playedAt,
  };
}

export interface UpsertOutcome {
  entries: RankingEntry[];
  isNewRecord: boolean;
  /** 상위 5위 안에 들었는지 여부 (표시 기준) */
  enteredTopDisplay: boolean;
}

/**
 * 새 기록을 랭킹 보드에 반영한다.
 * - 같은 학생(정규화된 이름 기준)의 기존 기록이 있으면, 더 좋은 경우에만 갱신한다.
 * - 내부 저장은 RANKING_STORAGE_LIMIT 까지만 유지해 무제한 증가를 막는다.
 */
export function upsertRankingEntry(existing: RankingEntry[], newEntry: RankingEntry): UpsertOutcome {
  const sameStudentIndex = existing.findIndex((e) => e.normalizedName === newEntry.normalizedName);

  let updated: RankingEntry[];
  let isNewRecord = false;

  if (sameStudentIndex === -1) {
    updated = [...existing, newEntry];
    isNewRecord = true;
  } else {
    const currentBest = existing[sameStudentIndex] as RankingEntry;
    const better = compareRankingEntries(newEntry, currentBest) < 0;
    if (better) {
      updated = [...existing];
      updated[sameStudentIndex] = newEntry;
      isNewRecord = true;
    } else {
      updated = existing;
    }
  }

  const sorted = sortRankingEntries(updated).slice(0, RANKING_STORAGE_LIMIT);
  const topDisplay = sorted.slice(0, RANKING_DISPLAY_LIMIT);
  const enteredTopDisplay = topDisplay.some((e) => e.normalizedName === newEntry.normalizedName);

  return { entries: sorted, isNewRecord, enteredTopDisplay };
}

/** 화면에 표시할 상위 N명만 반환 */
export function topDisplayEntries(entries: RankingEntry[]): RankingEntry[] {
  return sortRankingEntries(entries).slice(0, RANKING_DISPLAY_LIMIT);
}
