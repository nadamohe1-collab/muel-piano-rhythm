/**
 * 게임의 핵심 수치와 설정값을 한 곳에서 관리합니다.
 * 이 파일의 값만 변경하면 판정 범위, 점수, 등급 기준 등을 조정할 수 있습니다.
 */

/** 기본(도전 난이도) 판정 범위 (밀리초, 목표 시점 기준 ±ms) */
export const JUDGMENT_WINDOWS_MS = {
  perfect: 70,
  great: 130,
  good: 200,
} as const;

/** '처음' 난이도의 판정 범위 확대 배율 */
export const BEGINNER_WINDOW_MULTIPLIER = 1.2;

/** 판정별 기본 점수 */
export const JUDGMENT_SCORE = {
  perfect: 1000,
  great: 700,
  good: 300,
  miss: 0,
} as const;

/** 콤보 구간별 점수 배율 */
export const COMBO_MULTIPLIER_TIERS: Array<{ minCombo: number; multiplier: number }> = [
  { minCombo: 50, multiplier: 1.3 },
  { minCombo: 30, multiplier: 1.2 },
  { minCombo: 10, multiplier: 1.1 },
  { minCombo: 0, multiplier: 1.0 },
];

/** 정확도 계산용 판정 가중치 (%) */
export const ACCURACY_WEIGHT = {
  perfect: 100,
  great: 80,
  good: 50,
  miss: 0,
} as const;

/** 등급 기준 (정확도 %, 이상) */
export const GRADE_THRESHOLDS: Array<{ grade: 'S' | 'A' | 'B' | 'C'; minAccuracy: number }> = [
  { grade: 'S', minAccuracy: 95 },
  { grade: 'A', minAccuracy: 90 },
  { grade: 'B', minAccuracy: 80 },
  { grade: 'C', minAccuracy: 70 },
];

/** 별 기준 */
export const STAR_RULES = {
  threeStar: { minAccuracy: 95, maxMiss: 2 },
  twoStar: { minAccuracy: 85 },
} as const;

/** 랭킹: 곡+난이도별 화면 노출 상위 인원 */
export const RANKING_DISPLAY_LIMIT = 5;
/** 랭킹: 내부 저장소에 유지하는 최대 인원 (무제한 증가 방지) */
export const RANKING_STORAGE_LIMIT = 20;

/** 이름 규칙 */
export const NAME_RULES = {
  minLength: 2,
  maxLength: 8,
  maxRecentNames: 5,
} as const;

/** 최근 이름 최대 저장 개수 */
export const MAX_RECENT_NAMES = 5;

/** IndexedDB */
export const DB_NAME = 'muel-piano-rhythm-db';
export const DB_VERSION = 1;

/** 교사용 관리 화면 진입을 위한 롱프레스 시간 (ms) */
export const ADMIN_LONG_PRESS_MS = 5000;

/** 카운트다운 단계 (표시 문구) */
export const COUNTDOWN_STEPS = ['준비', '3', '2', '1', '시작!'] as const;
export const COUNTDOWN_STEP_DURATION_MS = 700;

/** 화면 기본 논리 해상도 (가로 모드 기준, 반응형으로 스케일됨) */
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

/** 노트가 화면 상단에서 판정선까지 내려오는 데 걸리는 시간(ms). 클수록 노트가 천천히, 여유있게 내려온다 */
export const NOTE_TRAVEL_TIME_MS = 2400;
/** 노트가 판정선 기준으로 얼마나 높은 곳(px)에서 나타나기 시작하는지. 게임 시작 직후에도 충분히 위에서부터 내려오도록 판정선~시작 지점 거리를 넉넉히 잡는다 */
export const NOTE_TRAVEL_START_OFFSET = 560;
/**
 * 곡의 첫 노트(beat 0)도 화면 위에서부터 충분히 내려올 시간을 갖도록,
 * 모든 노트의 목표 시각에 더해주는 도입부 여백(ms). 이 값이 없으면
 * 첫 노트가 곡 시작과 동시에 이미 판정선에 도착한 것처럼 보인다.
 */
export const NOTE_LEAD_IN_MS = NOTE_TRAVEL_TIME_MS;

/** 곡을 클리어하고 다음 단계로 넘어갈 때마다 속도 배율에 더해지는 값 (1.0배 → 1.5배 → 2.0배 → 2.5배 → 3.0배, 총 5단계) */
export const SPEED_UP_STEP_INCREMENT = 0.5;
/** 무한히 빨라지지 않도록 두는 속도 배율 상한. 1.0에서 0.5씩 4번 증가하면 정확히 5단계가 된다 */
export const SPEED_UP_MAX_MULTIPLIER = 3.0;
/** 이 단계(레벨)부터 실수 게이지(에너지 바)가 등장한다 */
export const MISTAKE_GAUGE_START_LEVEL = 3;
/** 실수 게이지가 다 차면(이 횟수만큼 Miss하면) 게임이 즉시 종료된다 */
export const MISTAKE_GAUGE_LIMIT = 5;

/** 앱스토리지 최신 버전 표기 (README/관리화면에 노출) */
export const APP_VERSION = '0.1.0';
export const DATA_SCHEMA_VERSION = DB_VERSION;

/** 건반 레인 <-> 음이름 매핑 */
export const LANE_COUNT = 8;
/** 음이름(솔페이지). 마지막은 한 옥타브 위의 도(높은 도)로, 실제 음악 표기와 동일하게 '도'로 표시한다 */
export const LANE_NOTE_NAMES = ['도', '레', '미', '파', '솔', '라', '시', '도'] as const;
/** 영문 음이름 코드. 옥타브가 달라도 같은 음이름은 같은 문자를 사용하는 실제 음악 표기를 따른다 */
export const LANE_NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'] as const;

/** 키보드 테스트 입력 매핑 (레인 인덱스 -> 키코드) */
export const LANE_KEYBOARD_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'] as const;

/** 기본 피아노 주파수 (Hz). 레인 0~6은 C4 옥타브, 레인 7(높은 도)은 C5 옥타브 */
export const NOTE_FREQUENCIES_HZ: Record<number, number> = {
  0: 261.63, // 도 C4
  1: 293.66, // 레 D4
  2: 329.63, // 미 E4
  3: 349.23, // 파 F4
  4: 392.0, // 솔 G4
  5: 440.0, // 라 A4
  6: 493.88, // 시 B4
  7: 523.25, // 높은 도 C5
};
