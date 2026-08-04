import * as Phaser from 'phaser';
import { fitCameraToDesign } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { createResultCard } from '../ui/ResultCard';
import { getSongById, getDifficultyChart } from '../data/songRegistry';
import { sessionState } from '../state/sessionState';
import { SAVE_FAILURE_MESSAGE } from '../storage/storageErrors';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);

    const result = sessionState.lastResult;
    if (!result) {
      this.scene.start('Home');
      return;
    }

    const song = getSongById(result.songId);
    const chart = getDifficultyChart(result.songId, result.difficultyId);

    createResultCard(this, layout.centerX, layout.y(0.46), result, song?.title ?? '', chart?.label ?? '');

    const outcome = sessionState.lastResultOutcome;
    const isCelebration = Boolean(outcome?.isNewRecord && outcome.enteredTopDisplay);
    if (isCelebration) {
      this.showCelebration();
    }

    const badgeY = layout.y(0.46) - 230;

    if (sessionState.progressiveLevel > 1) {
      this.add
        .text(layout.centerX, badgeY - 48, `🚀 레벨 ${sessionState.progressiveLevel}까지 도달! (점수는 전 단계 누적)`, {
          fontFamily: FONT_FAMILY,
          resolution: TEXT_RESOLUTION,
          fontSize: '16px',
          color: '#8a6f57',
        })
        .setOrigin(0.5);
    }

    if (outcome?.isNewRecord) {
      this.add
        .text(layout.centerX, badgeY - 20, outcome.enteredTopDisplay ? '🏆 랭킹 진입!' : '🌟 개인 최고 기록 갱신!', {
          fontFamily: FONT_FAMILY,
          resolution: TEXT_RESOLUTION,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#c9821f',
        })
        .setOrigin(0.5);
    }

    if (sessionState.lastSaveFailed) {
      this.buildSaveFailureCard(badgeY - 24);
    }

    const buttonY = layout.y(0.86);
    const spacing = 220;

    new Button(this, layout.centerX - spacing * 1.5, buttonY, {
      label: '다시 도전',
      variant: 'secondary',
      width: 190,
      height: 58,
      fontSize: 20,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        sessionState.resetProgressiveMode(); // 처음부터 다시: 레벨 1, 속도 1배로 새로 시작
        this.scene.start('Game');
      },
    });

    new Button(this, layout.centerX - spacing * 0.5, buttonY, {
      label: '다른 곡 선택',
      variant: 'secondary',
      width: 190,
      height: 58,
      fontSize: 20,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        sessionState.resetProgressiveMode();
        this.scene.start('SongSelect');
      },
    });

    new Button(this, layout.centerX + spacing * 0.5, buttonY, {
      label: '랭킹 보기',
      width: 190,
      height: 58,
      fontSize: 20,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        this.scene.start('Ranking', { from: 'Result' });
      },
    });

    new Button(this, layout.centerX + spacing * 1.5, buttonY, {
      label: '시작 화면',
      variant: 'ghost',
      width: 190,
      height: 58,
      fontSize: 20,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        sessionState.resetProgressiveMode();
        this.scene.start('Home');
      },
    });
  }

  /**
   * 결과 카드와는 시각적으로 구분되는 작은 경고 카드.
   * 게임 결과 자체(점수/등급/별)는 정상적으로 이미 표시되어 있으므로,
   * 이 카드는 "저장"에 한정된 문제만 조용히, 친절하게 안내한다.
   */
  private buildSaveFailureCard(y: number): void {
    const width = 460;
    const height = 64;
    const card = this.add.graphics();
    card.fillStyle(THEME.warning, 0.16);
    card.lineStyle(1.5, THEME.warning, 0.6);
    card.fillRoundedRect(layout.centerX - width / 2, y - height / 2, width, height, 16);
    card.strokeRoundedRect(layout.centerX - width / 2, y - height / 2, width, height, 16);

    this.add
      .text(layout.centerX, y, `⚠️ ${SAVE_FAILURE_MESSAGE}`, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '16px',
        color: '#8a6f57',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5);
  }

  private showCelebration(): void {
    sessionState.audio.effectSynth.newRecord();
    const centerX = layout.centerX;
    const centerY = layout.y(0.2);

    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 220;
      const isStar = Math.random() > 0.4;
      const particle = this.add
        .text(centerX, centerY, isStar ? '⭐' : '🎵', { fontSize: `${16 + Math.random() * 16}px` })
        .setOrigin(0.5)
        .setAlpha(0.9);

      this.tweens.add({
        targets: particle,
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        alpha: 0,
        angle: Phaser.Math.Between(-90, 90),
        duration: 1100 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
