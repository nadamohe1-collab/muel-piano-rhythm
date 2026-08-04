import * as Phaser from 'phaser';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { COUNTDOWN_STEPS, COUNTDOWN_STEP_DURATION_MS } from '../config/constants';
import { sessionState } from '../state/sessionState';
import { toggleMutedAndPersist } from '../systems/AudioSettings';
import { fitCameraToDesign } from '../utils/cameraFit';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(): void {
    fitCameraToDesign(this);
    const overlay = this.add.rectangle(layout.centerX, layout.centerY, layout.width, layout.height, 0x2b2b2b, 0.6);
    overlay.setInteractive();

    const cardWidth = 460;
    const cardHeight = 440;
    const card = this.add.graphics();
    card.fillStyle(THEME.surface, 1);
    card.fillRoundedRect(layout.centerX - cardWidth / 2, layout.centerY - cardHeight / 2, cardWidth, cardHeight, 28);

    this.add
      .text(layout.centerX, layout.centerY - cardHeight / 2 + 56, '일시정지', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    new Button(this, layout.centerX, layout.centerY - 90, {
      label: '계속하기',
      width: 260,
      height: 60,
      onClick: () => this.resumeGame(),
    });

    new Button(this, layout.centerX, layout.centerY - 10, {
      label: '처음부터 다시',
      variant: 'secondary',
      width: 260,
      height: 60,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        sessionState.audio.stopSong();
        sessionState.resetProgressiveMode();
        this.scene.stop('Game');
        this.scene.stop();
        this.scene.start('Game');
      },
    });

    new Button(this, layout.centerX, layout.centerY + 70, {
      label: '곡 선택으로',
      variant: 'ghost',
      width: 260,
      height: 56,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        sessionState.audio.stopSong();
        sessionState.resetProgressiveMode();
        this.scene.stop('Game');
        this.scene.stop();
        this.scene.start('SongSelect');
      },
    });

    const soundLabel = () => (sessionState.settings.muted ? '🔇 음향 켜기' : '🔊 음향 끄기');
    const soundBtn = new Button(this, layout.centerX, layout.centerY + 150, {
      label: soundLabel(),
      variant: 'ghost',
      width: 220,
      height: 48,
      fontSize: 17,
      onClick: () => {
        void toggleMutedAndPersist().then(() => soundBtn.setLabel(soundLabel()));
      },
    });
  }

  private resumeGame(): void {
    sessionState.audio.effectSynth.buttonTouch();
    this.children.removeAll(true);
    this.runResumeCountdown();
  }

  private runResumeCountdown(): void {
    const countdownText = this.add
      .text(layout.centerX, layout.centerY, '', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '77px',
        fontStyle: 'bold',
        color: '#fff8ef',
      })
      .setOrigin(0.5)
      .setDepth(500);

    const steps = COUNTDOWN_STEPS.slice(1); // 재개는 '준비' 없이 3,2,1,시작!
    let step = 0;
    const showNext = () => {
      if (step >= steps.length) {
        sessionState.audio.resumeSong();
        this.scene.wake('Game');
        this.scene.stop();
        return;
      }
      countdownText.setText(steps[step] ?? '');
      if (step === steps.length - 1) {
        sessionState.audio.effectSynth.countdownGo();
      } else {
        sessionState.audio.effectSynth.countdownTick();
      }
      step += 1;
      this.time.delayedCall(COUNTDOWN_STEP_DURATION_MS, showNext);
    };
    showNext();
  }
}
