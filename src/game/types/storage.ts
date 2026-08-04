export interface RecentNameRecord {
  name: string;
  lastUsedAt: number;
}

export interface TutorialStateRecord {
  seen: boolean;
  dontShowAgain: boolean;
}

export interface AppMetaRecord {
  key: string;
  value: string | number | boolean;
}

/** IndexedDB object store 이름 모음 (한 곳에서 관리) */
export const STORE_NAMES = {
  recentNames: 'recentNames',
  playResults: 'playResults',
  rankings: 'rankings',
  meta: 'meta',
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];
