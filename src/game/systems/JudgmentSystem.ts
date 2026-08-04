import { JUDGMENT_WINDOWS_MS } from '../config/constants';
import type { JudgmentType } from '../types/score';

export interface JudgmentWindows {
  perfect: number;
  great: number;
  good: number;
}

/** 난이도 배율을 적용한 판정 범위(ms)를 계산한다 */
export function computeJudgmentWindows(multiplier: number): JudgmentWindows {
  return {
    perfect: JUDGMENT_WINDOWS_MS.perfect * multiplier,
    great: JUDGMENT_WINDOWS_MS.great * multiplier,
    good: JUDGMENT_WINDOWS_MS.good * multiplier,
  };
}

/**
 * 입력 시각과 목표 시각의 차이(ms, 절대값 아님)를 받아 판정을 반환한다.
 * 반드시 오디오 시간(AudioContext.currentTime) 기반으로 계산된 offsetMs를 전달해야 한다.
 */
export function judgeByOffset(offsetMs: number, windows: JudgmentWindows): JudgmentType {
  const abs = Math.abs(offsetMs);
  if (abs <= windows.perfect) return 'perfect';
  if (abs <= windows.great) return 'great';
  if (abs <= windows.good) return 'good';
  return 'miss';
}

/**
 * 판정 범위(good)를 초과해 지나간 노트인지 여부.
 * targetTimeMs 는 노트의 목표(정타) 시각, currentTimeMs 는 현재 오디오 시각.
 */
export function isNotePassedWindow(targetTimeMs: number, currentTimeMs: number, windows: JudgmentWindows): boolean {
  return currentTimeMs - targetTimeMs > windows.good;
}

export interface ActiveNoteRef {
  id: string;
  lane: number;
  targetTimeMs: number;
  judged: boolean;
}

/**
 * 같은 레인에 여러 노트가 대기 중일 때, 입력 시각과 가장 시간 차이가 적은
 * (아직 판정되지 않은) 노트를 찾는다. 판정 범위(good) 밖의 노트는 대상에서 제외한다.
 */
export function findClosestUnjudgedNote(
  notes: ActiveNoteRef[],
  lane: number,
  inputTimeMs: number,
  windows: JudgmentWindows,
): ActiveNoteRef | undefined {
  let closest: ActiveNoteRef | undefined;
  let closestDiff = Infinity;
  for (const note of notes) {
    if (note.judged || note.lane !== lane) continue;
    const diff = Math.abs(inputTimeMs - note.targetTimeMs);
    if (diff <= windows.good && diff < closestDiff) {
      closest = note;
      closestDiff = diff;
    }
  }
  return closest;
}
