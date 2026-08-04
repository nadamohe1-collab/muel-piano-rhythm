import type { SongData, NoteData } from '../../types/song';

const BPM = 96;

/**
 * 좌우 레인을 오가며 박자 반응 속도를 훈련하는 자체 제작 패턴.
 * 같은 음 반복, 4분음표, 8분음표, 짧은 쉼표, 좌우 이동을 조합한다.
 */

interface JumpGroup {
  lanes: number[];
  /** true면 8분음표 간격, false면 4분음표 간격 */
  eighth?: boolean;
}

const BEGINNER_GROUPS: JumpGroup[] = [
  { lanes: [0, 0, 0, 0] }, // 같은 음 반복
  { lanes: [0, 6, 0, 6] }, // 좌우 점프
  { lanes: [3, 3, 3, 3] },
  { lanes: [3, 6, 3, 6] },
  { lanes: [2, 2, 4, 4] },
  { lanes: [0, 6, 0, 6] },
  { lanes: [1, 1, 5, 5] },
  { lanes: [0, 3, 6, 3] },
];

const CHALLENGE_GROUPS: JumpGroup[] = [
  { lanes: [0, 0, 0, 0], eighth: true },
  { lanes: [0, 6, 0, 6], eighth: true },
  { lanes: [3, 3, 3, 3], eighth: true },
  { lanes: [3, 6, 3, 6], eighth: true },
  { lanes: [2, 2, 4, 4], eighth: true },
  { lanes: [0, 6, 3, 6] },
  { lanes: [1, 1, 5, 5], eighth: true },
  { lanes: [0, 3, 6, 3], eighth: true },
  { lanes: [6, 0, 6, 0], eighth: true },
  { lanes: [4, 2, 4, 2] },
];

function buildNotesFromGroups(groups: JumpGroup[], restBeats: number): NoteData[] {
  const notes: NoteData[] = [];
  let beat = 0;
  for (const group of groups) {
    const step = group.eighth ? 0.5 : 1;
    for (const lane of group.lanes) {
      notes.push({ beat, lane, type: 'tap' });
      beat += step;
    }
    beat += restBeats;
  }
  return notes;
}

export const rhythmJump: SongData = {
  id: 'rhythm-jump',
  title: '리듬 점프',
  description: '건반 위를 폴짝폴짝 옮겨 다니며 박자 반응 속도를 키우는 곡이에요.',
  educationalGoal: '박자 반응 속도와 좌우 이동 협응력 훈련',
  bpm: BPM,
  timeSignature: [4, 4],
  durationSeconds: 45,
  composerType: 'original',
  copyrightNote:
    '뮤엘피아노 프로젝트를 위해 직접 제작한 교육용 연습 패턴입니다. 외부 악보, 음원, MIDI 파일을 사용하지 않았습니다.',
  difficulties: [
    {
      id: 'beginner',
      label: '처음',
      judgmentWindowMultiplier: 1.2,
      highlightUpcomingKey: true,
      showNoteNames: true,
      notes: buildNotesFromGroups(BEGINNER_GROUPS, 1),
    },
    {
      id: 'challenge',
      label: '도전',
      judgmentWindowMultiplier: 1.0,
      highlightUpcomingKey: false,
      showNoteNames: false,
      notes: buildNotesFromGroups(CHALLENGE_GROUPS, 0.5),
    },
  ],
};
