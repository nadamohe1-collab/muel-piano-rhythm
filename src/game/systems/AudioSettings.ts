import { sessionState } from '../state/sessionState';
import { saveSettings } from '../storage/repositories';
import type { AppSettings } from '../types/settings';

/**
 * 음소거 상태를 세션(즉시 반영)과 저장소(다음 실행에도 유지) 양쪽에 반영한다.
 * persistFn을 주입할 수 있게 해서, 테스트에서는 실제 IndexedDB 없이
 * 가짜 저장 함수로 동작을 검증할 수 있다.
 *
 * 저장에 실패해도 이번 세션의 음소거 변경 자체는 그대로 유지되며 게임은
 * 중단되지 않는다 (요구사항: "저장 실패 시 현재 게임 세션의 음향 변경은
 * 유지하되 게임을 중단하지 않는다").
 */
export async function setMutedAndPersist(
  muted: boolean,
  persistFn: (partial: Partial<AppSettings>) => Promise<AppSettings> = saveSettings,
): Promise<void> {
  sessionState.settings.muted = muted;
  sessionState.audio.setMuted(muted);
  try {
    await persistFn({ muted });
  } catch {
    // 세션 상의 변경은 이미 적용되었으므로 저장 실패는 조용히 무시한다
  }
}

export async function toggleMutedAndPersist(
  persistFn: (partial: Partial<AppSettings>) => Promise<AppSettings> = saveSettings,
): Promise<boolean> {
  const next = !sessionState.settings.muted;
  await setMutedAndPersist(next, persistFn);
  return next;
}
