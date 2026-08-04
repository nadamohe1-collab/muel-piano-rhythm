import type { SongData, NoteData } from '../../types/song';

const BPM = 100;

/**
 * '나비야'는 한국의 오래된 전래동요(퍼블릭 도메인)입니다. 여기서는 해당 선율의
 * 음이름 진행만 참고하여 뮤엘피아노 프로젝트를 위해 새로 작성한 단선율
 * 리듬게임 데이터입니다. 외부 MIDI 파일, 악보 이미지, 반주 음원을 전혀
 * 사용하지 않았으며, 실제 소리는 Web Audio API로 직접 생성합니다.
 *
 * 선율 진행 (레인 번호, 0=도 1=레 2=미 3=파 4=솔 5=라 6=시), 4마디씩 4줄:
 *   1줄) 나비야 나비야 이리날아 오너라: 솔미미 파레레 도레미파솔솔솔
 *   2줄) 노랑나비 흰나비 춤을추며 오너라: 솔미미미 파레레 도미솔솔미미미
 *   3줄) 봄바람에 꽃잎도 방긋방긋 웃으며: 레레레레 미파 미미미 도도 파솔
 *   4줄) 참새도 짹짹짹 노래하며 춤춘다: 솔미미 파레레 도레미파 솔솔도
 */
const MELODY_LINES: number[][] = [
  [4, 2, 2, 3, 1, 1, 0, 1, 2, 3, 4, 4, 4],
  [4, 2, 2, 2, 3, 1, 1, 0, 2, 4, 4, 2, 2, 2],
  [1, 1, 1, 1, 2, 3, 2, 2, 2, 0, 0, 3, 4],
  [4, 2, 2, 3, 1, 1, 0, 1, 2, 3, 4, 4, 0],
];

function buildBeginnerNotes(): NoteData[] {
  const notes: NoteData[] = [];
  let beat = 0;
  for (const line of MELODY_LINES) {
    for (const lane of line) {
      notes.push({ beat, lane, type: 'tap' });
      beat += 1;
    }
    beat += 1; // 줄 사이 쉼표
  }
  return notes;
}

/** 도전 난이도: 짝수 인덱스 음 뒤에 8분음표 꾸밈음을 추가해 노트 수를 늘린다 */
function buildChallengeNotes(): NoteData[] {
  const notes: NoteData[] = [];
  let beat = 0;
  for (const line of MELODY_LINES) {
    for (let i = 0; i < line.length; i++) {
      const lane = line[i] as number;
      notes.push({ beat, lane, type: 'tap' });
      beat += 1;
      if (i % 2 === 0) {
        notes.push({ beat, lane, type: 'tap' });
        beat += 0.5;
      }
    }
    beat += 0.5;
  }
  return notes;
}

export const butterfly: SongData = {
  id: 'butterfly',
  title: '나비야',
  description: '노랑나비 흰나비가 춤을 추듯, 익숙한 전래동요로 리듬을 익히는 곡이에요.',
  educationalGoal: '전래동요 선율을 통한 박자·음이름 학습',
  bpm: BPM,
  timeSignature: [4, 4],
  durationSeconds: 55,
  composerType: 'traditional',
  copyrightNote:
    '선율은 한국 전래동요(퍼블릭 도메인)의 음이름 진행을 참고했습니다. 리듬게임용 노트 데이터, 편곡, 실제 발음되는 음원은 모두 뮤엘피아노 프로젝트에서 직접 제작했으며, 외부 악보 이미지·MIDI 파일·상용 편곡을 사용하지 않았습니다.',
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
