/**
 * 저장 실패 관련 타입과 문구를 한 곳에서 관리한다.
 * (요구사항: "오류 메시지를 임의 문자열로 흩어놓지 말고 상수 또는 타입으로 관리")
 */

/** 저장 실패의 구체적인 원인. 로그/디버깅 및 향후 문구 분기에 사용할 수 있다 */
export type SaveFailureReason =
  | 'indexeddb-unsupported'
  | 'db-open-failed'
  | 'transaction-failed'
  | 'data-corrupted'
  | 'unknown';

/** 아이가 불안해하지 않는 친절한 안내 문구 (결과 화면 경고 카드에 그대로 사용) */
export const SAVE_FAILURE_MESSAGE = '기록을 저장하지 못했어요.\n기기의 저장 공간과 브라우저 설정을 확인해 주세요.';

/**
 * 모든 저장소 관련 오류는 이 클래스로 정규화한다.
 * IndexedDB 미지원, 비공개 브라우징 제한, 저장 공간 부족, DB 열기 실패,
 * 트랜잭션 실패, 데이터 손상 등 원인과 무관하게 항상 StorageError로 감싸서
 * 게임 로직이 저장소 세부 구현을 몰라도 안전하게 처리할 수 있게 한다.
 */
export class StorageError extends Error {
  readonly reason: SaveFailureReason;

  constructor(message: string = SAVE_FAILURE_MESSAGE, reason: SaveFailureReason = 'unknown') {
    super(message);
    this.name = 'StorageError';
    this.reason = reason;
  }
}

/**
 * 임의의 비동기 저장소 작업을 감싸, 어떤 이유로 실패하든 StorageError로
 * 정규화해서 던진다. 순수 함수에 가까운 형태로 만들어 (부작용은 operation 안에만
 * 있음) 테스트에서 가짜 operation을 주입해 검증할 수 있게 했다.
 */
export async function runStorageOperation<T>(operation: () => Promise<T>, reason: SaveFailureReason): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(SAVE_FAILURE_MESSAGE, reason);
  }
}
