import type { SongData, NoteData } from '../../types/song';

const BPM = 88;

/**
 * '작은 별' 은 프랑스 전래 선율(퍼블릭 도메인)을 바탕으로 한 잘 알려진 학습 곡입니다.
 * 여기서는 해당 선율의 음이름 진행만 참고하여 뮤엘피아노 프로젝트를 위해
 * 새로 작성한 단선율 리듬게임 데이터입니다. 외부 MIDI 파일, 악보 이미지,
 * 반주 음원을 전혀 사용하지 않았으며, 실제 소리는 Web Audio API로 직접 생성합니다.
 *
 * 선율 진행 (레인 번호, 0=도 1=레 2=미 3=파 4=솔 5=라 6=시):
 *   도도 솔솔 라라 솔 / 파파 미미 레레 도 / 솔솔 파파 미미 레 (×2) / 도도 솔솔 라라 솔 / 파파 미미 레레 도
 */
const MELODY_LANES: number[][] = [
  [0, 0, 4, 4, 5, 5, 4],
  [3, 3, 2, 2, 1, 1, 0],
  [4, 4, 3, 3, 2, 2, 1],
  [4, 4, 3, 3, 2, 2, 1],
  [0, 0, 4, 4, 5, 5, 4],
  [3, 3, 2, 2, 1, 1, 0],
];

const REST_BETWEEN_LINES = 1;

function buildBeginnerNotes(): NoteData[] {
  const notes: NoteData[] = [];
  let beat = 0;
  for (const line of MELODY_LANES) {
    for (const lane of line) {
      notes.push({ beat, lane, type: 'tap' });
      beat += 1;
    }
    beat += REST_BETWEEN_LINES;
  }
  return notes;
}

/**
 * 도전 난이도: 각 줄 사이에 8분음표로 된 짧은 꾸밈음(같은 음 반복)을 추가해
 * 노트 수를 늘리고 리듬 변화를 준다.
 */
function buildChallengeNotes(): NoteData[] {
  const notes: NoteData[] = [];
  let beat = 0;
  for (const line of MELODY_LANES) {
    for (let i = 0; i < line.length; i++) {
      const lane = line[i] as number;
      notes.push({ beat, lane, type: 'tap' });
      beat += 1;
      // 각 줄의 짝수 인덱스 음 뒤에 8분음표 꾸밈음(같은 레인) 추가
      if (i % 2 === 1) {
        notes.push({ beat, lane, type: 'tap' });
        beat += 0.5;
      }
    }
    beat += REST_BETWEEN_LINES * 0.5;
  }
  return notes;
}

export const littleStarPractice: SongData = {
  id: 'little-star-practice',
  title: '작은 별 연습곡',
  description: '누구나 아는 익숙한 선율로 손가락과 음이름을 함께 익히는 연습곡이에요.',
  educationalGoal: '익숙한 선율을 통한 음이름·박자 학습',
  bpm: BPM,
  timeSignature: [4, 4],
  durationSeconds: 50,
  composerType: 'traditional',
  copyrightNote:
    '선율은 프랑스 전래동요(퍼블릭 도메인)의 음이름 진행을 참고했습니다. 리듬게임용 노트 데이터, 편곡, 실제 발음되는 음원은 모두 뮤엘피아노 프로젝트에서 직접 제작했으며, 외부 악보 이미지·MIDI 파일·상용 편곡을 사용하지 않았습니다. (선율 자체와 별도로 특정 음원·편곡·악보 이미지에는 저작권이 있을 수 있다는 점에 유의해 자체 제작 데이터만 사용했습니다.)',
  difficulties: [
    {
      id: 'beginner',
      label: '처음',
      judgmentWindowMultiplier: 1.2,
      highlightUpcomingKey: true,
      showNoteNames: true,
      notes: buildBeginnerNotes(),
    },
    {
      id: 'challenge',
      label: '도전',
      judgmentWindowMultiplier: 1.0,
      highlightUpcomingKey: false,
      showNoteNames: false,
      notes: buildChallengeNotes(),
    },
  ],
};
