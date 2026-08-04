import { describe, it, expect, beforeEach } from 'vitest';
import { StorageError, runStorageOperation, SAVE_FAILURE_MESSAGE } from '../src/game/storage/storageErrors';
import { determineSaveOutcome } from '../src/game/systems/SaveOutcome';
import { setMutedAndPersist, toggleMutedAndPersist } from '../src/game/systems/AudioSettings';
import { sessionState } from '../src/game/state/sessionState';
import type { SubmitResultOutcome } from '../src/game/storage/repositories';
import type { AppSettings } from '../src/game/types/settings';

describe('StorageError / runStorageOperation', () => {
  it('SAVE_FAILURE_MESSAGE는 두 문장으로 구성된 친절한 안내 문구다', () => {
    expect(SAVE_FAILURE_MESSAGE).toContain('저장하지 못했어요');
    expect(SAVE_FAILURE_MESSAGE).toContain('저장 공간');
  });

  it('일반 Error를 던지는 작업도 StorageError로 정규화된다', async () => {
    const op = async () => {
      throw new Error('IndexedDB 미지원');
    };
    await expect(runStorageOperation(op, 'indexeddb-unsupported')).rejects.toBeInstanceOf(StorageError);
  });

  it('정규화된 StorageError는 지정한 reason을 갖는다', async () => {
    const op = async () => {
      throw new Error('트랜잭션 실패');
    };
    try {
      await runStorageOperation(op, 'transaction-failed');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError);
      expect((error as StorageError).reason).toBe('transaction-failed');
      expect((error as StorageError).message).toBe(SAVE_FAILURE_MESSAGE);
    }
  });

  it('이미 StorageError면 이유를 덮어쓰지 않고 그대로 전파한다', async () => {
    const original = new StorageError('원본 메시지', 'data-corrupted');
    const op = async () => {
      throw original;
    };
    try {
      await runStorageOperation(op, 'unknown');
      expect.unreachable();
    } catch (error) {
      expect(error).toBe(original);
      expect((error as StorageError).reason).toBe('data-corrupted');
    }
  });

  it('성공한 작업은 정상적으로 결과를 반환한다', async () => {
    const result = await runStorageOperation(async () => 42, 'unknown');
    expect(result).toBe(42);
  });
});

describe('determineSaveOutcome', () => {
  const fakeOutcome: SubmitResultOutcome = {
    isNewRecord: true,
    enteredTopDisplay: true,
    entries: [],
  };

  it('저장이 성공하면 saveFailed: false와 outcome을 반환한다', async () => {
    const result = await determineSaveOutcome(async () => fakeOutcome);
    expect(result.saveFailed).toBe(false);
    expect(result.outcome).toBe(fakeOutcome);
  });

  it('저장이 IndexedDB 열기 실패로 거부되어도 예외를 던지지 않고 saveFailed: true를 반환한다', async () => {
    const result = await determineSaveOutcome(async () => {
      throw new StorageError('DB 열기 실패', 'db-open-failed');
    });
    expect(result.saveFailed).toBe(true);
    expect(result.outcome).toBeNull();
  });

  it('저장이 트랜잭션 실패로 거부되어도 예외를 던지지 않고 saveFailed: true를 반환한다', async () => {
    const result = await determineSaveOutcome(async () => {
      throw new StorageError('트랜잭션 실패', 'transaction-failed');
    });
    expect(result.saveFailed).toBe(true);
    expect(result.outcome).toBeNull();
  });

  it('저장 실패 이후에도 함수 자체는 다시 호출할 수 있다 (재도전 가능성 검증)', async () => {
    let attempt = 0;
    const submitFn = async () => {
      attempt += 1;
      if (attempt === 1) throw new StorageError();
      return fakeOutcome;
    };
    const first = await determineSaveOutcome(submitFn);
    expect(first.saveFailed).toBe(true);
    const second = await determineSaveOutcome(submitFn);
    expect(second.saveFailed).toBe(false);
    expect(second.outcome).toBe(fakeOutcome);
  });
});

describe('AudioSettings 저장 일관성 (Home/Pause/Admin 공용 헬퍼)', () => {
  beforeEach(() => {
    sessionState.settings.muted = false;
  });

  it('setMutedAndPersist는 세션 상태를 즉시 반영한다', async () => {
    const fakePersist = async (partial: Partial<AppSettings>) => ({ ...sessionState.settings, ...partial });
    await setMutedAndPersist(true, fakePersist);
    expect(sessionState.settings.muted).toBe(true);
  });

  it('persist 함수가 호출되며 올바른 값을 전달받는다', async () => {
    const calls: Array<Partial<AppSettings>> = [];
    const fakePersist = async (partial: Partial<AppSettings>) => {
      calls.push(partial);
      return { ...sessionState.settings, ...partial };
    };
    await setMutedAndPersist(true, fakePersist);
    expect(calls).toEqual([{ muted: true }]);
  });

  it('persist가 실패해도(저장 실패) 세션의 음소거 변경은 유지되고 예외가 전파되지 않는다', async () => {
    const failingPersist = async (): Promise<AppSettings> => {
      throw new StorageError();
    };
    await expect(setMutedAndPersist(true, failingPersist)).resolves.toBeUndefined();
    expect(sessionState.settings.muted).toBe(true);
  });

  it('toggleMutedAndPersist는 현재 상태를 반전시킨다', async () => {
    const fakePersist = async (partial: Partial<AppSettings>) => ({ ...sessionState.settings, ...partial });
    sessionState.settings.muted = false;
    const next = await toggleMutedAndPersist(fakePersist);
    expect(next).toBe(true);
    expect(sessionState.settings.muted).toBe(true);
  });
});
