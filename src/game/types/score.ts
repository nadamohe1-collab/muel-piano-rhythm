export type JudgmentType = 'perfect' | 'great' | 'good' | 'miss';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'RETRY';

export interface JudgmentCounts {
  perfect: number;
  great: number;
  good: number;
  miss: number;
}

export interface PlayResult {
  songId: string;
  difficultyId: string;
  studentName: string;
  score: number;
  maxCombo: number;
  accuracy: number; // 0~100, 소수점 첫째 자리 표시용 (내부는 고정밀도 유지)
  judgments: JudgmentCounts;
  grade: Grade;
  stars: 0 | 1 | 2 | 3;
  completed: boolean; // 곡을 끝까지 플레이했는지 여부
  playedAt: number; // epoch ms
}
