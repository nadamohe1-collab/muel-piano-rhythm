import * as Phaser from 'phaser';
import { fitCameraToDesign } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { SONG_REGISTRY } from '../data/songRegistry';
import { formatDuration, formatScore } from '../utils/formatting';
import { getRankingBoard } from '../storage/repositories';
import { normalizeNameForComparison } from '../utils/validation';
import { compareRankingEntries } from '../systems/RankingSystem';
import { sessionState } from '../state/sessionState';
import type { RankingEntry } from '../types/ranking';

const CARD_WIDTH = 360;
const CARD_HEIGHT = 280;
const CARD_GAP_X = 32;
const ROW_GAP_Y = 28;

export class SongSelectScene extends Phaser.Scene {
  constructor() {
    super('SongSelect');
  }

  create(): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);

    this.add
      .text(layout.centerX, layout.y(0.06), `${sessionState.studentName} 학생, 곡을 선택해 주세요`, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '27px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    new Button(this, 110, 50, {
      label: '← 뒤로',
      variant: 'ghost',
      width: 130,
      height: 52,
      fontSize: 21,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        this.scene.start('Name');
      },
    });

    // 5곡을 3+2 형태의 두 줄 그리드로 배치한다 (곡이 늘어나도 이 로직만 유지하면 됨)
    const cols = 3;
    const row1Y = layout.y(0.335);
    const row2Y = row1Y + CARD_HEIGHT + ROW_GAP_Y;

    SONG_REGISTRY.forEach((song, index) => {
      const row = Math.floor(index / cols);
      const indicesInRow = SONG_REGISTRY.slice(row * cols, row * cols + cols).length;
      const col = index % cols;
      const rowTotalWidth = CARD_WIDTH * indicesInRow + CARD_GAP_X * (indicesInRow - 1);
      const rowStartX = layout.centerX - rowTotalWidth / 2 + CARD_WIDTH / 2;
      const x = rowStartX + col * (CARD_WIDTH + CARD_GAP_X);
      const y = row === 0 ? row1Y : row2Y;
      void this.createSongCard(song, x, y);
    });
  }

  private async createSongCard(song: (typeof SONG_REGISTRY)[number], x: number, y: number): Promise<void> {
    const width = CARD_WIDTH;
    const height = CARD_HEIGHT;
    const container = this.add.container(x, y);

    const card = this.add.graphics();
    card.fillStyle(THEME.surface, 1);
    card.fillRoundedRect(-width / 2, -height / 2, width, height, 22);
    container.add(card);

    const title = this.add
      .text(0, -height / 2 + 30, song.title, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);
    container.add(title);

    const desc = this.add
      .text(0, -height / 2 + 64, song.description, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '14px',
        color: '#7a6f63',
        align: 'center',
        wordWrap: { width: width - 40 },
        lineSpacing: 2,
      })
      .setOrigin(0.5, 0);
    container.add(desc);

    const goal = this.add
      .text(0, -height / 2 + 122, `🎯 ${song.educationalGoal}`, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '12px',
        color: '#8a6f57',
        align: 'center',
        wordWrap: { width: width - 40 },
      })
      .setOrigin(0.5, 0);
    container.add(goal);

    const meta = this.add
      .text(0, -height / 2 + 154, `BPM ${song.bpm}   ·   약 ${formatDuration(song.durationSeconds)}`, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '13px',
        color: '#b8ada2',
      })
      .setOrigin(0.5);
    container.add(meta);

    const bestText = this.add
      .text(0, -height / 2 + 178, '기록을 불러오는 중...', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '14px',
        color: '#7a6f63',
        align: 'center',
      })
      .setOrigin(0.5);
    container.add(bestText);

    const playButton = new Button(this, 0, height / 2 - 34, {
      label: '플레이',
      width: 160,
      height: 48,
      fontSize: 18,
      onClick: () => {
        sessionState.audio.init();
        sessionState.audio.effectSynth.buttonTouch();
        sessionState.songId = song.id;
        this.scene.start('Difficulty');
      },
    });
    container.add(playButton);

    try {
      const best = await this.getStudentBest(song.id);
      if (best) {
        bestText.setText(`최고점수 ${formatScore(best.score)} · ${best.grade}등급`);
      } else {
        bestText.setText('아직 플레이 기록이 없어요');
      }
    } catch {
      bestText.setText('');
    }
  }

  private async getStudentBest(songId: string): Promise<RankingEntry | undefined> {
    const normalized = normalizeNameForComparison(sessionState.studentName);
    const difficultyIds = ['beginner', 'challenge'];
    const boards = await Promise.all(difficultyIds.map((d) => getRankingBoard(songId, d)));
    const candidates = boards.flat().filter((e) => e.normalizedName === normalized);
    if (candidates.length === 0) return undefined;
    return candidates.sort(compareRankingEntries)[0];
  }
}
