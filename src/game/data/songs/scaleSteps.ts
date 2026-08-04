import type { SongData, NoteData } from '../../types/song';

const BPM = 80;

/**
 * '처음' 난이도: 4분음표 중심, 순차적인 건반 위치 학습.
 * 구성: 상행(도~높은 도) → 쉼 → 하행(시~도) → 쉼 → 같은 음 두 번씩 상행 → 쉼 → 같은 음 두 번씩 하행
 */
function buildBeginnerNotes(): NoteData[] {
  const notes: NoteData[] = [];
  let beat = 0;

  // 상행: 도 → 높은 도
  for (let lane = 0; lane <= 7; lane++) {
    notes.push({ beat, lane, type: 'tap' });
    beat += 1;
  }
  beat += 1; // 쉼표

  // 하행: 높은 도 → 도
  for (let lane = 7; lane >= 0; lane--) {
    notes.push({ beat, lane, type: 'tap' });
    beat += 1;
  }
  beat += 1; // 쉼표

  // 동일 음 두 번 반복하며 상행
  for (let lane = 0; lane <= 7; lane++) {
    notes.push({ beat, lane, type: 'tap' });
    beat += 1;
    notes.push({ beat, lane, type: 'tap' });
    beat += 1;
  }
  beat += 1; // 쉼표

  // 동일 음 두 번 반복하며 하행
  for (let lane = 7; lane >= 0; lane--) {
    notes.push({ beat, lane, type: 'tap' });
    beat += 1;
    notes.push({ beat, lane, type: 'tap' });
    beat += 1;
  }

  return notes;
}

/**
 * '도전' 난이도: 일부 8분음표와 반복 패턴을 추가해 노트 수를 늘린다.
 */
function buildChallengeNotes(): NoteData[] {
  const notes: NoteData[] = [];
  let beat = 0;

  // 상행 (4분음표)
  for (let lane = 0; lane <= 7; lane++) {
    notes.push({ beat, lane, type: 'tap' });
    beat += 1;
  }
  beat += 0.5;

  // 하행 8분음표 (더 빠른 손 이동 연습)
  for (let lane = 7; lane >= 0; lane--) {
    notes.push({ beat, lane, type: 'tap' });
    beat += 0.5;
  }
  beat += 1;

  // 같은 음 두 번(8분음표)씩 상행
  for (let lane = 0; lane <= 7; lane++) {
    notes.push({ beat, lane, type: 'tap' });
    beat += 0.5;
    notes.push({ beat, lane, type: 'tap' });
    beat += 0.5;
  }
  beat += 1;

  // 같은 음 두 번(8분음표)씩 하행
  for (let lane = 7; lane >= 0; lane--) {
    notes.push({ beat, lane, type: 'tap' });
    beat += 0.5;
    notes.push({ beat, lane, type: 'tap' });
    beat += 0.5;
  }
  beat += 1;

  // 반복 패턴: 도-미-솔 되풀이 (화음 학습 대비)
  const pattern = [0, 2, 4, 2];
  for (let i = 0; i < 8; i++) {
    const lane = pattern[i % pattern.length] as number;
    notes.push({ beat, lane, type: 'tap' });
    beat += 0.5;
  }

  return notes;
}

export const scaleSteps: SongData = {
  id: 'scale-steps',
  title: '도레미 계단',
  description: '도부터 높은 도까지 계단을 오르내리듯 건반 위치를 익히는 곡이에요.',
  educationalGoal: '순차적인 건반 위치와 음이름 학습',
  bpm: BPM,
  timeSignature: [4, 4],
  durationSeconds: 40,
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
