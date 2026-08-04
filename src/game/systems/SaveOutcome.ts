import type { SubmitResultOutcome } from '../storage/repositories';

export interface SaveAttemptResult {
  outcome: SubmitResultOutcome | null;
  saveFailed: boolean;
}

/**
 * 저장 함수(submitFn)를 실행하고 결과를 정규화한다.
 * submitFn이 성공하면 outcome을 그대로 반환하고, 어떤 이유로든 실패하면
 * (IndexedDB 미지원, 트랜잭션 실패 등) saveFailed: true 와 함께 outcome: null을 반환한다.
 *
 * GameScene은 실제 submitPlayResult()를 넘겨서 사용하고,
 * 테스트에서는 성공/실패를 흉내 내는 가짜 함수를 넘겨서 검증한다.
 * 이 함수 자체는 IndexedDB 등 브라우저 API에 직접 의존하지 않아 테스트하기 쉽다.
 */
export async function determineSaveOutcome(submitFn: () => Promise<SubmitResultOutcome>): Promise<SaveAttemptResult> {
  try {
    const outcome = await submitFn();
    return { outcome, saveFailed: false };
  } catch {
    return { outcome: null, saveFailed: true };
  }
}
