import * as Phaser from 'phaser';
import { fitCameraToDesign } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { createRankingTable } from '../ui/RankingTable';
import { SONG_REGISTRY } from '../data/songRegistry';
import { getRankingBoard } from '../storage/repositories';
import { topDisplayEntries } from '../systems/RankingSystem';
import { sessionState } from '../state/sessionState';

interface RankingSceneData {
  from?: string;
}

export class RankingScene extends Phaser.Scene {
  private selectedSongId = SONG_REGISTRY[0]?.id ?? '';
  private selectedDifficultyId: 'beginner' | 'challenge' = 'beginner';
  private tableContainer: Phaser.GameObjects.Container | null = null;
  private songButtons: Button[] = [];
  private difficultyButtons: Button[] = [];
  private returnScene = 'Home';

  constructor() {
    super('Ranking');
  }

  create(data: RankingSceneData): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);
    this.returnScene = data?.from ?? 'Home';
    this.songButtons = [];
    this.difficultyButtons = [];

    this.selectedSongId = sessionState.songId ?? SONG_REGISTRY[0]?.id ?? '';
    this.selectedDifficultyId = (sessionState.difficultyId as 'beginner' | 'challenge') ?? 'beginner';

    this.add
      .text(layout.centerX, layout.y(0.08), '랭킹', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '36px',
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
        this.scene.start(this.returnScene);
      },
    });

    this.buildSongSelector();
    this.buildDifficultySelector();
    void this.refreshTable();
  }

  private buildSongSelector(): void {
    this.songButtons.forEach((b) => b.destroy());
    this.songButtons = [];
    const spacing = 230;
    const startX = layout.centerX - spacing;
    SONG_REGISTRY.forEach((song, i) => {
      const btn = new Button(this, startX + i * spacing, layout.y(0.24), {
        label: song.title,
        variant: song.id === this.selectedSongId ? 'primary' : 'secondary',
        width: 210,
        height: 54,
        fontSize: 18,
        onClick: () => {
          sessionState.audio.effectSynth.buttonTouch();
          this.selectedSongId = song.id;
          this.buildSongSelector();
          void this.refreshTable();
        },
      });
      this.songButtons.push(btn);
    });
  }

  private buildDifficultySelector(): void {
    this.difficultyButtons.forEach((b) => b.destroy());
    this.difficultyButtons = [];
    const options: Array<{ id: 'beginner' | 'challenge'; label: string }> = [
      { id: 'beginner', label: '처음' },
      { id: 'challenge', label: '도전' },
    ];
    const spacing = 160;
    const startX = layout.centerX - spacing / 2;
    options.forEach((opt, i) => {
      const btn = new Button(this, startX + i * spacing, layout.y(0.34), {
        label: opt.label,
        variant: opt.id === this.selectedDifficultyId ? 'primary' : 'secondary',
        width: 140,
        height: 48,
        fontSize: 17,
        onClick: () => {
          sessionState.audio.effectSynth.buttonTouch();
          this.selectedDifficultyId = opt.id;
          this.buildDifficultySelector();
          void this.refreshTable();
        },
      });
      this.difficultyButtons.push(btn);
    });
  }

  private async refreshTable(): Promise<void> {
    this.tableContainer?.destroy();
    const entries = await getRankingBoard(this.selectedSongId, this.selectedDifficultyId).catch(() => []);
    this.tableContainer = createRankingTable(this, layout.centerX, layout.y(0.68), topDisplayEntries(entries));
  }
}
