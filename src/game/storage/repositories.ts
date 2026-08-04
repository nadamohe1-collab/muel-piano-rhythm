import { openDatabase } from './database';
import { STORE_NAMES } from '../types/storage';
import { MAX_RECENT_NAMES } from '../config/constants';
import { normalizeNameForComparison } from '../utils/validation';
import { upsertRankingEntry, playResultToRankingEntry } from '../systems/RankingSystem';
import { DEFAULT_SETTINGS } from '../types/settings';
import { StorageError, runStorageOperation } from './storageErrors';
import type { AppSettings } from '../types/settings';
import type { RankingEntry, RankingBoard } from '../types/ranking';
import type { PlayResult } from '../types/score';

export { StorageError };

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new StorageError());
  });
}

// ---------------------------------------------------------------------------
// 최근 이름
// ---------------------------------------------------------------------------

interface RecentNamesRecordWrapper {
  key: 'list';
  names: Array<{ name: string; lastUsedAt: number }>;
}

export async function getRecentNames(): Promise<string[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAMES.recentNames, 'readonly');
    const store = tx.objectStore(STORE_NAMES.recentNames);
    const record = await promisifyRequest<RecentNamesRecordWrapper | undefined>(store.get('list'));
    return record?.names.map((n) => n.name) ?? [];
  } catch {
    return [];
  }
}

export async function addRecentName(name: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAMES.recentNames, 'readwrite');
  const store = tx.objectStore(STORE_NAMES.recentNames);
  const existing = (await promisifyRequest<RecentNamesRecordWrapper | undefined>(store.get('list')))?.names ?? [];

  const normalized = normalizeNameForComparison(name);
  const filtered = existing.filter((n) => normalizeNameForComparison(n.name) !== normalized);
  const updated = [{ name, lastUsedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT_NAMES);

  store.put({ key: 'list', names: updated } satisfies RecentNamesRecordWrapper);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearRecentNames(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAMES.recentNames, 'readwrite');
  tx.objectStore(STORE_NAMES.recentNames).delete('list');
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------------
// 설정 (음소거, 최근 곡/난이도, 튜토리얼 여부 등)
// ---------------------------------------------------------------------------

interface SettingsRecordWrapper {
  key: 'settings';
  value: AppSettings;
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAMES.meta, 'readonly');
    const store = tx.objectStore(STORE_NAMES.meta);
    const record = await promisifyRequest<SettingsRecordWrapper | undefined>(store.get('settings'));
    return record ? { ...DEFAULT_SETTINGS, ...record.value } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated: AppSettings = { ...current, ...partial };
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAMES.meta, 'readwrite');
    tx.objectStore(STORE_NAMES.meta).put({ key: 'settings', value: updated } satisfies SettingsRecordWrapper);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // 저장 실패해도 메모리상 값은 반환해 게임 진행에 지장이 없게 한다
  }
  return updated;
}

// ---------------------------------------------------------------------------
// 랭킹
// ---------------------------------------------------------------------------

function rankingKey(songId: string, difficultyId: string): string {
  return `${songId}:${difficultyId}`;
}

export async function getRankingBoard(songId: string, difficultyId: string): Promise<RankingEntry[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAMES.rankings, 'readonly');
    const store = tx.objectStore(STORE_NAMES.rankings);
    const record = await promisifyRequest<(RankingBoard & { key: string }) | undefined>(
      store.get(rankingKey(songId, difficultyId)),
    );
    return record?.entries ?? [];
  } catch {
    return [];
  }
}

export interface SubmitResultOutcome {
  isNewRecord: boolean;
  enteredTopDisplay: boolean;
  entries: RankingEntry[];
}

export async function submitPlayResult(result: PlayResult): Promise<SubmitResultOutcome> {
  return runStorageOperation(async () => {
    const key = rankingKey(result.songId, result.difficultyId);

    // openDatabase()가 실패하면(미지원/비공개 브라우징/열기 실패 등) 아래에서
    // 던지는 원본 에러를 runStorageOperation이 StorageError로 정규화해 감싼다.
    const db = await openDatabase();

    // 실패 시 조용히 빈 배열로 복구하지 않고, submitPlayResult 전체를 실패로
    // 취급해 호출부(GameScene)가 "저장 실패"를 정확히 인지할 수 있게 한다.
    const tx1 = db.transaction(STORE_NAMES.rankings, 'readonly');
    const existingRecord = await promisifyRequest<(RankingBoard & { key: string }) | undefined>(
      tx1.objectStore(STORE_NAMES.rankings).get(key),
    );
    const existing = existingRecord?.entries ?? [];

    const newEntry = playResultToRankingEntry(result);
    const outcome = upsertRankingEntry(existing, newEntry);

    const tx2 = db.transaction([STORE_NAMES.rankings, STORE_NAMES.playResults], 'readwrite');
    tx2.objectStore(STORE_NAMES.rankings).put({
      key,
      songId: result.songId,
      difficultyId: result.difficultyId,
      entries: outcome.entries,
    });
    tx2.objectStore(STORE_NAMES.playResults).add(result);
    await new Promise<void>((resolve, reject) => {
      tx2.oncomplete = () => resolve();
      tx2.onerror = () => reject(tx2.error ?? new StorageError(undefined, 'transaction-failed'));
      tx2.onabort = () => reject(tx2.error ?? new StorageError(undefined, 'transaction-failed'));
    });

    return outcome;
  }, 'transaction-failed');
}

export async function resetRankingBoard(songId: string, difficultyId: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAMES.rankings, 'readwrite');
  tx.objectStore(STORE_NAMES.rankings).delete(rankingKey(songId, difficultyId));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function resetAllRankings(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAMES.rankings, 'readwrite');
  tx.objectStore(STORE_NAMES.rankings).clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------------
// 전체 초기화 (교사용 관리 화면)
// ---------------------------------------------------------------------------

export async function resetAllData(): Promise<void> {
  const db = await openDatabase();
  const storeNames = [STORE_NAMES.recentNames, STORE_NAMES.playResults, STORE_NAMES.rankings, STORE_NAMES.meta];
  const tx = db.transaction(storeNames, 'readwrite');
  for (const name of storeNames) {
    tx.objectStore(name).clear();
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
