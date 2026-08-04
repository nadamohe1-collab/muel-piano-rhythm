import { beatToMs } from '../utils/timing';
import { computeJudgmentWindows, isNotePassedWindow, findClosestUnjudgedNote } from './JudgmentSystem';
import type { JudgmentWindows, ActiveNoteRef } from './JudgmentSystem';
import type { NoteData } from '../types/song';
import type { JudgmentType } from '../types/score';
import { NOTE_LEAD_IN_MS } from '../config/constants';
import { classifyNoteVisualValues } from '../utils/noteVisuals';
import type { NoteVisualValue } from '../utils/noteVisuals';

export interface ScheduledNote extends ActiveNoteRef {
  data: NoteData;
  visualValue: NoteVisualValue;
}

export interface RhythmEngineOptions {
  bpm: number;
  notes: NoteData[];
  judgmentWindowMultiplier: number;
}

/**
 * 노트 스케줄링과 자동 Miss 판정을 담당한다.
 * 이 클래스 자체는 오디오를 재생하지 않으며, 곡 위치(ms)는 항상 외부(AudioManager)에서
 * AudioContext.currentTime 기반으로 전달받는다. 그래야 프레임 지연과 무관하게
 * 정확한 판정이 가능하다.
 */
export class RhythmEngine {
  readonly windows: JudgmentWindows;
  readonly scheduledNotes: ScheduledNote[];

  constructor(options: RhythmEngineOptions) {
    this.windows = computeJudgmentWindows(options.judgmentWindowMultiplier);
    const visualValues = classifyNoteVisualValues(options.notes);
    this.scheduledNotes = options.notes.map((note, index) => ({
      id: `note-${index}`,
      lane: note.lane,
      targetTimeMs: beatToMs(note.beat, options.bpm) + NOTE_LEAD_IN_MS,
      judged: false,
      data: note,
      visualValue: visualValues[index] ?? 'quarter',
    }));
  }

  /** 아직 판정되지 않았고 목표 시각이 다가오는 노트 목록 (렌더링용) */
  getUpcomingNotes(currentTimeMs: number, lookaheadMs: number): ScheduledNote[] {
    return this.scheduledNotes.filter(
      (n) => !n.judged && n.targetTimeMs >= currentTimeMs - 500 && n.targetTimeMs <= currentTimeMs + lookaheadMs,
    );
  }

  /** 현재 시각 기준으로 판정 범위를 넘겨 자동 Miss 처리해야 할 노트 id 목록을 반환하고, 상태를 갱신한다 */
  collectAutoMisses(currentTimeMs: number): ScheduledNote[] {
    const missed: ScheduledNote[] = [];
    for (const note of this.scheduledNotes) {
      if (note.judged) continue;
      if (isNotePassedWindow(note.targetTimeMs, currentTimeMs, this.windows)) {
        note.judged = true;
        missed.push(note);
      }
    }
    return missed;
  }

  /** 특정 레인에 입력이 들어왔을 때 판정할 노트를 찾아 판정 처리한다 (판정된 노트가 없으면 undefined) */
  handleLaneInput(lane: number, inputTimeMs: number): { note: ScheduledNote; judgment: JudgmentType } | undefined {
    const target = findClosestUnjudgedNote(this.scheduledNotes, lane, inputTimeMs, this.windows);
    if (!target) return undefined;
    const scheduled = this.scheduledNotes.find((n) => n.id === target.id);
    if (!scheduled) return undefined;

    scheduled.judged = true;
    const offset = inputTimeMs - scheduled.targetTimeMs;
    const abs = Math.abs(offset);
    let judgment: JudgmentType;
    if (abs <= this.windows.perfect) judgment = 'perfect';
    else if (abs <= this.windows.great) judgment = 'great';
    else judgment = 'good';

    return { note: scheduled, judgment };
  }

  isComplete(currentTimeMs: number, tailMs = 1000): boolean {
    const lastNote = this.scheduledNotes[this.scheduledNotes.length - 1];
    if (!lastNote) return true;
    return currentTimeMs > lastNote.targetTimeMs + this.windows.good + tailMs;
  }

  get totalNotes(): number {
    return this.scheduledNotes.length;
  }
}
