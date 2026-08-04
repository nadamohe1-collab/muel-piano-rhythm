import type { Grade } from './score';

export interface RankingEntry {
  id: string; // `${songId}:${difficultyId}:${normalizedName}`
  songId: string;
  difficultyId: string;
  studentName: string; // 정규화 전 표시용 이름
  normalizedName: string; // 비교용 (trim + lowercase)
  score: number;
  accuracy: number;
  missCount: number;
  maxCombo: number;
  grade: Grade;
  achievedAt: number; // epoch ms
}

/** 곡+난이도별 랭킹 상위 5명 (내부 저장은 여유분을 둘 수 있으나 화면 노출은 5명) */
export interface RankingBoard {
  songId: string;
  difficultyId: string;
  entries: RankingEntry[];
}
