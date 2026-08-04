import { AudioManager } from '../audio/AudioManager';
import { DEFAULT_SETTINGS } from '../types/settings';
import type { AppSettings } from '../types/settings';
import type { PlayResult, JudgmentCounts } from '../types/score';
import type { SubmitResultOutcome } from '../storage/repositories';

function emptyJudgmentCounts(): JudgmentCounts {
  return { perfect: 0, great: 0, good: 0, miss: 0 };
}

/**
 * 씬 사이를 이동해도 유지되어야 하는 현재 플레이 세션 정보를 담는다.
 * Phaser의 scene.start(key, data)는 뒤로가기 시 데이터가 유실되기 쉬워서,
 * 이 모듈 하나를 여러 씬이 공유하는 방식을 사용한다 (SPA이므로 페이지 리로드가 없음).
 */
class SessionState {
  readonly audio = new AudioManager();

  studentName = '';
  songId: string | null = null;
  difficultyId: string | null = null;
  lastResult: PlayResult | null = null;
  lastResultOutcome: SubmitResultOutcome | null = null;
  lastSaveFailed = false;
  settings: AppSettings = { ...DEFAULT_SETTINGS };

  /** 클리어할 때마다 자동으로 속도가 빨라지는 단계 진행 상태 */
  progressiveLevel = 1;
  speedMultiplier = 1;

  /** 단계가 이어지는 동안 누적되는 점수/판정 (랭킹은 이 누적치를 기준으로 기록된다) */
  cumulativeScore = 0;
  cumulativeJudgments: JudgmentCounts = emptyJudgmentCounts();
  cumulativeMaxCombo = 0;

  reset(): void {
    this.studentName = '';
    this.songId = null;
    this.difficultyId = null;
    this.lastResult = null;
    this.lastResultOutcome = null;
    this.lastSaveFailed = false;
    this.resetProgressiveMode();
  }

  resetProgressiveMode(): void {
    this.progressiveLevel = 1;
    this.speedMultiplier = 1;
    this.cumulativeScore = 0;
    this.cumulativeJudgments = emptyJudgmentCounts();
    this.cumulativeMaxCombo = 0;
  }
}

export const sessionState = new SessionState();
