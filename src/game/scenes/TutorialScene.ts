import * as Phaser from 'phaser';
import { fitCameraToDesign } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { sessionState } from '../state/sessionState';
import { saveSettings } from '../storage/repositories';

const STEPS = [
  '노트가 위에서 아래로 내려와요.',
  '노트가 판정선에 닿을 때 같은 위치의 건반을 눌러요.',
  '정확하게 누르면 Perfect가 표시돼요.',
  '놓치면 Miss가 표시돼요. 괜찮아요, 다시 하면 돼요!',
  '연속으로 맞히면 콤보가 올라가요.',
];

export class TutorialScene extends Phaser.Scene {
  private stepIndex = 0;
  private stepText!: Phaser.GameObjects.Text;
  private nextBtn!: Button;
  private practiceContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('Tutorial');
  }

  create(): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);
    this.stepIndex = 0;

    this.add
      .text(layout.centerX, layout.y(0.1), '게임 방법을 알아볼까요?', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '31px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    this.stepText = this.add
      .text(layout.centerX, layout.y(0.35), '', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '26px',
        color: '#2b2b2b',
        align: 'center',
        wordWrap: { width: 700 },
      })
      .setOrigin(0.5);

    this.nextBtn = new Button(this, layout.centerX, layout.y(0.5), {
      label: '다음',
      width: 200,
      height: 58,
      onClick: () => this.advanceStep(),
    });

    this.practiceContainer = this.add.container(layout.centerX, layout.y(0.5));
    this.practiceContainer.setVisible(false);

    new Button(this, layout.centerX - 160, layout.y(0.88), {
      label: '튜토리얼 건너뛰기',
      variant: 'secondary',
      width: 220,
      height: 56,
      fontSize: 18,
      onClick: () => this.goToGame(),
    });

    new Button(this, layout.centerX + 160, layout.y(0.88), {
      label: '다음부터 보지 않기',
      variant: 'ghost',
      width: 220,
      height: 56,
      fontSize: 18,
      onClick: () => this.dontShowAgainAndContinue(),
    });

    this.showStep();
  }

  private showStep(): void {
    this.stepText.setText(STEPS[this.stepIndex] ?? '');
    this.nextBtn.setVisible(true);
    this.practiceContainer.setVisible(false);
  }

  private advanceStep(): void {
    sessionState.audio.effectSynth.buttonTouch();
    this.stepIndex += 1;
    if (this.stepIndex >= STEPS.length) {
      this.showPracticeStep();
    } else {
      this.showStep();
    }
  }

  private showPracticeStep(): void {
    this.stepText.setText('아래 "도" 건반을 직접 눌러보세요!');
    this.nextBtn.setVisible(false);
    this.practiceContainer.setVisible(true);
    this.practiceContainer.removeAll(true);

    const keyBtn = new Button(this, 0, 40, {
      label: '도',
      width: 120,
      height: 120,
      fontSize: 37,
      onClick: () => {
        sessionState.audio.init();
        sessionState.audio.pianoSynth.playLane(0);
        sessionState.audio.effectSynth.perfect();
        this.stepText.setText('완벽해요! 이제 게임을 시작해 볼까요?');
        this.practiceContainer.setVisible(false);
        this.time.delayedCall(600, () => this.goToGame());
      },
    });
    this.practiceContainer.add(keyBtn);
  }

  private async dontShowAgainAndContinue(): Promise<void> {
    sessionState.audio.effectSynth.buttonTouch();
    sessionState.settings.tutorialDontShowAgain = true;
    try {
      await saveSettings({ tutorialDontShowAgain: true });
    } catch {
      // 저장 실패해도 이번 세션에서는 정상 진행
    }
    this.goToGame();
  }

  private goToGame(): void {
    this.scene.start('Game');
  }
}
