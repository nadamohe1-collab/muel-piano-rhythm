import { STORE_NAMES } from '../types/storage';

/**
 * 버전별 마이그레이션을 순서대로 적용한다.
 * 새 버전을 추가할 때는 DB_VERSION을 올리고 아래에 case를 추가하면 된다.
 */
export function applyMigrations(db: IDBDatabase, oldVersion: number, newVersion: number): void {
  for (let version = oldVersion + 1; version <= newVersion; version++) {
    switch (version) {
      case 1:
        migrateToV1(db);
        break;
      default:
        break;
    }
  }
}

function migrateToV1(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(STORE_NAMES.recentNames)) {
    db.createObjectStore(STORE_NAMES.recentNames, { keyPath: 'key' });
  }
  if (!db.objectStoreNames.contains(STORE_NAMES.playResults)) {
    const store = db.createObjectStore(STORE_NAMES.playResults, { keyPath: 'id', autoIncrement: true });
    store.createIndex('bySongDifficulty', ['songId', 'difficultyId']);
  }
  if (!db.objectStoreNames.contains(STORE_NAMES.rankings)) {
    db.createObjectStore(STORE_NAMES.rankings, { keyPath: 'key' });
  }
  if (!db.objectStoreNames.contains(STORE_NAMES.meta)) {
    db.createObjectStore(STORE_NAMES.meta, { keyPath: 'key' });
  }
}
