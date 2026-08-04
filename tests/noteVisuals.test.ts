import { describe, it, expect } from 'vitest';
import { classifyNoteVisualValues } from '../src/game/utils/noteVisuals';
import type { NoteData } from '../src/game/types/song';

function note(beat: number, lane = 0): NoteData {
  return { beat, lane, type: 'tap' };
}

describe('classifyNoteVisualValues', () => {
  it('간격이 1박이면 4분음표로 분류한다', () => {
    const notes = [note(0), note(1), note(2)];
    expect(classifyNoteVisualValues(notes)).toEqual(['quarter', 'quarter', 'quarter']);
  });

  it('간격이 0.5박이면 8분음표로 분류한다', () => {
    const notes = [note(0), note(0.5), note(1)];
    expect(classifyNoteVisualValues(notes)).toEqual(['eighth', 'eighth', 'quarter']);
  });

  it('간격이 0.25박이면 16분음표로 분류한다', () => {
    const notes = [note(0), note(0.25), note(0.5)];
    expect(classifyNoteVisualValues(notes)).toEqual(['sixteenth', 'sixteenth', 'quarter']);
  });

  it('마지막 노트는 다음 노트가 없으므로 4분음표로 간주한다', () => {
    const notes = [note(0), note(0.5)];
    expect(classifyNoteVisualValues(notes)[1]).toBe('quarter');
  });

  it('레인이 달라도 같은 박자를 기준으로 간격을 계산한다', () => {
    const notes = [note(0, 0), note(0.25, 3), note(0.5, 5)];
    expect(classifyNoteVisualValues(notes)).toEqual(['sixteenth', 'sixteenth', 'quarter']);
  });

  it('같은 beat에 여러 레인 노트가 있어도(동시 입력) 정상 처리한다', () => {
    const notes = [note(0, 0), note(0, 4), note(1, 0)];
    const result = classifyNoteVisualValues(notes);
    expect(result[0]).toBe('quarter');
    expect(result[1]).toBe('quarter');
  });
});
