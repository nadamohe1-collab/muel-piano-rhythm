export interface AppSettings {
  muted: boolean;
  masterVolume: number; // 0~1
  tutorialDontShowAgain: boolean;
  fullscreenHintSeen: boolean;
  lastSongId: string | null;
  lastDifficultyId: string | null;
  /** 기기별 오디오 출력 지연 보정값 (ms). 관리자가 조정 가능 */
  audioLatencyOffsetMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  muted: false,
  masterVolume: 0.8,
  tutorialDontShowAgain: false,
  fullscreenHintSeen: false,
  lastSongId: null,
  lastDifficultyId: null,
  audioLatencyOffsetMs: 0,
};
