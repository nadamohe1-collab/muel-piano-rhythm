import * as Phaser from 'phaser';
import { fitCameraToDesign } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { ProgressBar } from '../ui/ProgressBar';
import { getSettings } from '../storage/repositories';
import { sessionState } from '../state/sessionState';

export class BootScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('Boot');
  }

  preload(): void {
    // GitHub Pages 하위 경로 배포를 지원하기 위해 항상 BASE_URL을 기준으로 경로를 만든다
    this.load.image('muel-logo', `${import.meta.env.BASE_URL}brand/muel-logo.png`);
  }

  create(): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);

    this.add
      .text(layout.centerX, layout.y(0.16), '뮤엘피아노 리듬게임', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '24px',
        color: '#7a6f63',
      })
      .setOrigin(0.5);

    const logo = this.add.image(layout.centerX, layout.y(0.42), 'muel-logo');
    const maxLogoHeight = layout.height * 0.46;
    if (logo.height > maxLogoHeight) {
      logo.setScale(maxLogoHeight / logo.height);
    }

    const progressBar = new ProgressBar(this, layout.centerX, layout.y(0.78), 420, 12);

    this.statusText = this.add
      .text(layout.centerX, layout.y(0.85), '오디오 준비 중...', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '19px',
        color: '#b8ada2',
      })
      .setOrigin(0.5);

    void this.runBootSequence(progressBar);
  }

  private async runBootSequence(progressBar: ProgressBar): Promise<void> {
    progressBar.setProgress(0.2);
    this.statusText.setText('오디오 초기화 준비 중...');
    await delay(150);

    progressBar.setProgress(0.5);
    this.statusText.setText('저장 데이터 확인 중...');
    try {
      sessionState.settings = await getSettings();
      sessionState.audio.latencyOffsetMs = sessionState.settings.audioLatencyOffsetMs;
    } catch {
      this.statusText.setText('저장 데이터를 불러오지 못했어요. 기본값으로 시작합니다.');
    }
    await delay(150);

    progressBar.setProgress(0.85);
    this.statusText.setText('화면 준비 중...');
    await delay(150);

    progressBar.setProgress(1);
    this.statusText.setText('완료!');
    await delay(200);

    this.scene.start('Home');
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
