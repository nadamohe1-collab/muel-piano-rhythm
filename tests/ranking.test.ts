import { describe, it, expect } from 'vitest';
import { compareRankingEntries, upsertRankingEntry, topDisplayEntries } from '../src/game/systems/RankingSystem';
import type { RankingEntry } from '../src/game/types/ranking';

function makeEntry(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return {
    id: 'x',
    songId: 'scale-steps',
    difficultyId: 'beginner',
    studentName: '민석',
    normalizedName: '민석',
    score: 1000,
    accuracy: 90,
    missCount: 0,
    maxCombo: 10,
    grade: 'A',
    achievedAt: 1000,
    ...overrides,
  };
}

describe('compareRankingEntries', () => {
  it('점수가 높은 쪽이 우선한다', () => {
    const a = makeEntry({ score: 2000 });
    const b = makeEntry({ score: 1000 });
    expect(compareRankingEntries(a, b)).toBeLessThan(0);
  });

  it('점수가 같으면 정확도가 높은 쪽이 우선한다', () => {
    const a = makeEntry({ score: 1000, accuracy: 95 });
    const b = makeEntry({ score: 1000, accuracy: 90 });
    expect(compareRankingEntries(a, b)).toBeLessThan(0);
  });

  it('점수·정확도가 같으면 Miss가 적은 쪽이 우선한다', () => {
    const a = makeEntry({ score: 1000, accuracy: 90, missCount: 1 });
    const b = makeEntry({ score: 1000, accuracy: 90, missCount: 3 });
    expect(compareRankingEntries(a, b)).toBeLessThan(0);
  });

  it('모두 같으면 최고 콤보가 높은 쪽이 우선한다', () => {
    const a = makeEntry({ maxCombo: 50 });
    const b = makeEntry({ maxCombo: 30 });
    expect(compareRankingEntries(a, b)).toBeLessThan(0);
  });

  it('전부 같으면 먼저 달성한 기록이 우선한다', () => {
    const a = makeEntry({ achievedAt: 100 });
    const b = makeEntry({ achievedAt: 200 });
    expect(compareRankingEntries(a, b)).toBeLessThan(0);
  });
});

describe('upsertRankingEntry', () => {
  it('새 학생의 기록은 추가된다', () => {
    const existing: RankingEntry[] = [];
    const result = upsertRankingEntry(existing, makeEntry({ normalizedName: 'a' }));
    expect(result.entries).toHaveLength(1);
    expect(result.isNewRecord).toBe(true);
  });

  it('같은 학생이 더 낮은 점수를 기록하면 갱신되지 않는다', () => {
    const existing: RankingEntry[] = [makeEntry({ normalizedName: 'a', score: 2000 })];
    const result = upsertRankingEntry(existing, makeEntry({ normalizedName: 'a', score: 1000 }));
    expect(result.entries[0]?.score).toBe(2000);
    expect(result.isNewRecord).toBe(false);
  });

  it('같은 학생이 더 높은 점수를 기록하면 갱신된다', () => {
    const existing: RankingEntry[] = [makeEntry({ normalizedName: 'a', score: 1000 })];
    const result = upsertRankingEntry(existing, makeEntry({ normalizedName: 'a', score: 2000 }));
    expect(result.entries[0]?.score).toBe(2000);
    expect(result.isNewRecord).toBe(true);
  });

  it('상위 5명 표시 제한을 지킨다', () => {
    let entries: RankingEntry[] = [];
    for (let i = 0; i < 5; i++) {
      entries = upsertRankingEntry(entries, makeEntry({ normalizedName: `student${i}`, score: 1000 + i })).entries;
    }
    const outcome = upsertRankingEntry(entries, makeEntry({ normalizedName: 'newcomer', score: 1 }));
    expect(outcome.enteredTopDisplay).toBe(false);
    expect(topDisplayEntries(outcome.entries)).toHaveLength(5);
  });

  it('내부 저장은 RANKING_STORAGE_LIMIT을 초과하지 않는다', () => {
    let entries: RankingEntry[] = [];
    for (let i = 0; i < 25; i++) {
      entries = upsertRankingEntry(entries, makeEntry({ normalizedName: `s${i}`, score: 1000 + i })).entries;
    }
    expect(entries.length).toBeLessThanOrEqual(20);
  });
});
