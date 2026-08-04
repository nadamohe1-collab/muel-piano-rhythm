import type { SongData } from '../types/song';
import { scaleSteps } from './songs/scaleSteps';
import { littleStarPractice } from './songs/littleStarPractice';
import { rhythmJump } from './songs/rhythmJump';
import { butterfly } from './songs/butterfly';
import { schoolBell } from './songs/schoolBell';

/** 새 곡을 추가하려면 이 배열에 등록하기만 하면 됩니다. (README '곡 추가 방법' 참고) */
export const SONG_REGISTRY: SongData[] = [scaleSteps, littleStarPractice, rhythmJump, butterfly, schoolBell];

export function getSongById(id: string): SongData | undefined {
  return SONG_REGISTRY.find((song) => song.id === id);
}

export function getDifficultyChart(songId: string, difficultyId: string) {
  const song = getSongById(songId);
  if (!song) return undefined;
  return song.difficulties.find((d) => d.id === difficultyId);
}
