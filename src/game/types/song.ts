/** 노트 종류. 1차 버전은 tap만 실제로 사용한다. */
export type NoteType = 'tap' | 'hold';

/** 곡의 저작 유형 */
export type ComposerType = 'original' | 'traditional' | 'public-domain';

/** 난이도 식별자 */
export type DifficultyId = 'beginner' | 'challenge';

export interface NoteData {
  /** 박자 단위 시작 시점 (0 = 곡 시작) */
  beat: number;
  /** 건반 레인 (0=도 ~ 6=시) */
  lane: number;
  /** hold 노트일 경우 지속 박자 수. tap 노트는 생략 가능 */
  durationBeats?: number;
  /** 노트 종류. 생략 시 'tap' */
  type?: NoteType;
}

export interface DifficultyChart {
  id: DifficultyId;
  label: string;
  /** 판정 범위 배율 (1.0 = 기본, 1.2 = 20% 확대) */
  judgmentWindowMultiplier: number;
  /** 노트 진입 시 건반을 미리 강조할지 여부 */
  highlightUpcomingKey: boolean;
  /** 음이름 라벨을 항상 표시할지 여부 */
  showNoteNames: boolean;
  notes: NoteData[];
}

export interface SongData {
  id: string;
  title: string;
  description: string;
  educationalGoal: string;
  bpm: number;
  timeSignature: [number, number];
  durationSeconds: number;
  composerType: ComposerType;
  copyrightNote: string;
  difficulties: DifficultyChart[];
}
