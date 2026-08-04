import type { NoteData } from '../types/song';

export type NoteVisualValue = 'quarter' | 'eighth' | 'sixteenth';

/**
 * 각 노트를 실제 몇 분음표처럼 그릴지 판단한다. 별도의 음표 길이 데이터를
 * 추가로 입력하지 않아도 되도록, 다음 노트(어느 레인이든)까지의 박자 간격을
 * 기준으로 자동 추론한다.
 *
 * - 간격 0.75박 이상: 4분음표
 * - 간격 0.375~0.75박: 8분음표
 * - 간격 0.375박 미만: 16분음표
 * - 마지막 노트(다음 노트 없음): 4분음표로 간주
 *
 * 입력 배열과 같은 순서로 결과를 반환한다.
 */
export function classifyNoteVisualValues(notes: NoteData[]): NoteVisualValue[] {
  const sortedBeats = [...new Set(notes.map((n) => n.beat))].sort((a, b) => a - b);

  return notes.map((note) => {
    const nextBeat = sortedBeats.find((b) => b > note.beat);
    if (nextBeat === undefined) return 'quarter';

    const gap = nextBeat - note.beat;
    if (gap >= 0.75) return 'quarter';
    if (gap >= 0.375) return 'eighth';
    return 'sixteenth';
  });
}
