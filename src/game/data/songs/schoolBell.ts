import type { SongData, NoteData } from '../../types/song';

const BPM = 108;

/**
 * '학교종'은 한국의 오래된 전래동요(퍼블릭 도메인)입니다. 여기서는 해당 선율의
 * 음이름 진행만 참고하여 뮤엘피아노 프로젝트를 위해 새로 작성한 단선율
 * 리듬게임 데이터입니다. 외부 MIDI 파일, 악보 이미지, 반주 음원을 전혀
 * 사용하지 않았으며, 실제 소리는 Web Audio API로 직접 생성합니다.
 *
 * 선율 진행 (레인 번호, 0=도 1=레 2=미 3=파 4=솔 5=라 6=시):
 *   솔솔라라솔솔미 / 솔솔미미레 (반복)
 */
const LINE_A = [4, 4, 5, 5, 4, 4, 2];
const LINE_B = [4, 4, 2, 2, 1];
const MELODY_LANES: number[][] = [LINE_A, LINE_B, LINE_A, LINE_B];

function buildBeginnerNotes(): NoteData[] {
  const notes: NoteData[] = [];
  let beat = 0;
  for (const line of MELODY_LANES) {
    for (const lane of line) {
      notes.push({ beat, lane, type: 'tap' });
      beat += 1;
    }
    beat += 1; // 줄 사이 쉼표
  }
  return notes;
}

/** 도전 난이도: 마지막 음을 8분음표 두 번으로 나누어 노트 수를 늘리고 쉼표를 줄인다 */
function buildChallengeNotes(): NoteData[] {
  const notes: NoteData[] = [];
  let beat = 0;
  for (const line of MELODY_LANES) {
    for (let i = 0; i < line.length; i++) {
      const lane = line[i] as number;
      const isLast = i === line.length - 1;
      if (isLast) {
        notes.push({ beat, lane, type: 'tap' });
        beat += 0.5;
        notes.push({ beat, lane, type: 'tap' });
        beat += 0.5;
      } else {
        notes.push({ beat, lane, type: 'tap' });
        beat += 1;
      }
    }
    beat += 0.5;
  }
  return notes;
}

export const schoolBell: SongData = {
  id: 'school-bell',
  title: '학교종',
  description: '땡땡땡 익숙한 학교종 선율에 맞춰 활기차게 연주하는 곡이에요.',
  educationalGoal: '규칙적인 박자감과 리듬 반복 학습',
  bpm: BPM,
  timeSignature: [4, 4],
  durationSeconds: 40,
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
