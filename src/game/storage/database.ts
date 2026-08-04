import { DB_NAME, DB_VERSION } from '../config/constants';
import { STORE_NAMES } from '../types/storage';
import { applyMigrations } from './migrations';
import { StorageError } from './storageErrors';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * IndexedDB를 연다. 여러 곳에서 동시에 호출되어도 하나의 연결만 생성되도록
 * Promise를 캐싱한다. 저장 실패(비공개 브라우징 등)에도 앱 전체가 죽지 않도록
 * 호출부에서 반드시 catch 처리한다.
 */
export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!('indexedDB' in window) || !window.indexedDB) {
      reject(new StorageError('이 브라우저는 IndexedDB를 지원하지 않습니다.', 'indexeddb-unsupported'));
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      reject(new StorageError('저장소를 여는 데 실패했습니다.', 'db-open-failed'));
      return;
    }

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;
      try {
        applyMigrations(db, oldVersion, DB_VERSION);
      } catch {
        // 마이그레이션 실패는 onerror/onblocked 경로로 이어지므로 여기서는 그대로 둔다
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null; // 다음 시도에서 다시 열어볼 수 있도록 캐시를 비운다
      reject(new StorageError('IndexedDB를 여는 데 실패했습니다.', 'db-open-failed'));
    };

    request.onblocked = () => {
      dbPromise = null;
      reject(new StorageError('저장소가 다른 탭에서 사용 중입니다.', 'db-open-failed'));
    };
  });

  return dbPromise;
}

export function resetDatabaseConnectionForTests(): void {
  dbPromise = null;
}

export { STORE_NAMES };
