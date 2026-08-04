import * as Phaser from 'phaser';
import { fitCameraToDesign } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { getSongById } from '../data/songRegistry';
import { sessionState } from '../state/sessionState';

interface DifficultyCardInfo {
  id: 'beginner' | 'challenge';
  label: string;
  emoji: string;
  bullets: string[];
}

const DIFFICULTY_INFO: DifficultyCardInfo[] = [
  {
    id: 'beginner',
    label: '처음',
    emoji: '🌱',
    bullets: ['느린 노트 속도', '넓은 판정 범위', '건반 음이름 표시', '입력할 건반 강조'],
  },
  {
    id: 'challenge',
    label: '도전',
    emoji: '🔥',
    bullets: ['기본 속도', '기본 판정 범위', '건반 강조 최소화', '더 많은 노트'],
  },
];

export class DifficultyScene extends Phaser.Scene {
  constructor() {
    super('Difficulty');
  }

  create(): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);

    const song = sessionState.songId ? getSongById(sessionState.songId) : undefined;

    this.add
      .text(layout.centerX, layout.y(0.1), `${song?.title ?? ''} — 난이도를 선택해 주세요`, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '29px',
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
        this.scene.start('SongSelect');
      },
    });

    const cardWidth = 420;
    const spacing = 60;
    const totalWidth = cardWidth * 2 + spacing;
    const startX = layout.centerX - totalWidth / 2 + cardWidth / 2;

    DIFFICULTY_INFO.forEach((info, index) => {
      this.createDifficultyCard(info, startX + index * (cardWidth + spacing), layout.y(0.58), cardWidth);
    });
  }

  private createDifficultyCard(info: DifficultyCardInfo, x: number, y: number, width: number): void {
    const height = 420;
    const container = this.add.container(x, y);

    const card = this.add.graphics();
    card.fillStyle(THEME.surface, 1);
    card.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
    container.add(card);

    const emoji = this.add.text(0, -height / 2 + 60, info.emoji, { fontSize: '58px' }).setOrigin(0.5);
    container.add(emoji);

    const label = this.add
      .text(0, -height / 2 + 130, info.label, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);
    container.add(label);

    const bulletText = info.bullets.map((b) => `• ${b}`).join('\n');
    const bullets = this.add
      .text(0, -height / 2 + 190, bulletText, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '20px',
        color: '#7a6f63',
        align: 'left',
        lineSpacing: 12,
      })
      .setOrigin(0.5, 0);
    container.add(bullets);

    const startButton = new Button(this, 0, height / 2 - 50, {
      label: `${info.label}으로 시작`,
      width: 260,
      height: 58,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        sessionState.difficultyId = info.id;
        const skipTutorial = sessionState.settings.tutorialDontShowAgain;
        this.scene.start(skipTutorial ? 'Game' : 'Tutorial');
      },
    });
    container.add(startButton);
  }
}
