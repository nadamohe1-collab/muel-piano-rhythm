import * as Phaser from 'phaser';
import { fitCameraToDesign } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { ADMIN_LONG_PRESS_MS } from '../config/constants';
import { sessionState } from '../state/sessionState';
import { toggleMutedAndPersist } from '../systems/AudioSettings';
import { updateState } from '../state/updateState';

export class HomeScene extends Phaser.Scene {
  private longPressTimer: Phaser.Time.TimerEvent | null = null;
  private longPressProgress!: Phaser.GameObjects.Graphics;
  private soundButton!: Button;
  private offlineText!: Phaser.GameObjects.Text;
  private updateBanner: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('Home');
    // create()는 Home 화면에 돌아올 때마다 반복 호출되므로, 리스너 누적을 막기 위해
    // 구독은 씬 생성 시 단 한 번만 등록한다.
    updateState.onUpdateAvailable(() => {
      if (this.scene.isActive()) {
        this.showUpdateBanner();
      }
    });
  }

  create(): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);
    this.updateBanner = null;
    sessionState.reset();

    const logo = this.add.image(layout.centerX, layout.y(0.32), 'muel-logo').setInteractive({ useHandCursor: false });
    const maxLogoHeight = layout.height * 0.4;
    if (logo.height > maxLogoHeight) {
      logo.setScale(maxLogoHeight / logo.height);
    }

    this.add
      .text(layout.centerX, layout.y(0.58), '뮤엘피아노 리듬게임', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '50px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    this.add
      .text(layout.centerX, layout.y(0.65), '건반을 누르고, 별을 모으는 음악 여행', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '25px',
        color: '#7a6f63',
      })
      .setOrigin(0.5);

    new Button(this, layout.centerX, layout.y(0.79), {
      label: '게임 시작',
      width: 260,
      height: 68,
      fontSize: 30,
      onClick: () => {
        sessionState.audio.init();
        sessionState.audio.effectSynth.buttonTouch();
        this.scene.start('Name');
      },
    });

    new Button(this, layout.centerX - 170, layout.y(0.92), {
      label: '랭킹',
      variant: 'secondary',
      width: 150,
      height: 56,
      onClick: () => {
        sessionState.audio.init();
        this.scene.start('Ranking', { from: 'Home' });
      },
    });

    this.soundButton = new Button(this, layout.centerX + 170, layout.y(0.92), {
      label: sessionState.settings.muted ? '🔇 음소거' : '🔊 소리켬',
      variant: 'secondary',
      width: 150,
      height: 56,
      onClick: () => this.toggleSound(),
    });

    new Button(this, layout.width - 90, 50, {
      label: '⛶',
      variant: 'ghost',
      width: 56,
      height: 56,
      fontSize: 25,
      onClick: () => this.toggleFullscreen(),
    });

    this.offlineText = this.add
      .text(80, 50, navigator.onLine ? '' : '📴 오프라인', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '17px',
        color: '#b8ada2',
      })
      .setOrigin(0, 0.5);

    window.addEventListener('online', this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('online', this.updateOnlineStatus);
      window.removeEventListener('offline', this.updateOnlineStatus);
    });

    this.setupAdminLongPress(logo);
    this.setupUpdateBanner();
  }

  private setupUpdateBanner(): void {
    if (updateState.updateAvailable) {
      this.showUpdateBanner();
    }
  }

  private showUpdateBanner(): void {
    if (this.updateBanner) return; // 이미 표시 중이면 중복 생성하지 않음

    const width = 420;
    const height = 64;
    const x = layout.centerX;
    const y = layout.y(0.03) + height / 2;

    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(THEME.accent, 0.16);
    bg.lineStyle(1.5, THEME.accent, 0.7);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    container.add(bg);

    const text = this.add
      .text(-width / 2 + 20, 0, '새로운 버전이 준비되었어요.', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '17px',
        color: '#8a6f57',
      })
      .setOrigin(0, 0.5);
    container.add(text);

    const applyBtn = new Button(this, width / 2 - 78, 0, {
      label: '업데이트하기',
      width: 140,
      height: 44,
      fontSize: 15,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        updateState.applyUpdate();
      },
    });
    container.add(applyBtn);

    this.updateBanner = container;
  }

  private updateOnlineStatus = (): void => {
    this.offlineText.setText(navigator.onLine ? '' : '📴 오프라인');
  };

  private async toggleSound(): Promise<void> {
    sessionState.audio.init();
    const nextMuted = await toggleMutedAndPersist();
    this.soundButton.setLabel(nextMuted ? '🔇 음소거' : '🔊 소리켬');
  }

  private toggleFullscreen(): void {
    sessionState.audio.init();
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
    } else {
      this.scale.startFullscreen();
    }
  }

  private setupAdminLongPress(target: Phaser.GameObjects.Image): void {
    this.longPressProgress = this.add.graphics();

    const startPress = () => {
      let elapsed = 0;
      this.longPressProgress.setVisible(true);
      this.longPressTimer = this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          elapsed += 50;
          this.drawLongPressRing(elapsed / ADMIN_LONG_PRESS_MS);
          if (elapsed >= ADMIN_LONG_PRESS_MS) {
            this.cancelPress();
            sessionState.audio.init();
            this.scene.start('Admin');
          }
        },
      });
    };

    const cancel = () => this.cancelPress();

    target.on('pointerdown', startPress);
    target.on('pointerup', cancel);
    target.on('pointerout', cancel);
  }

  private cancelPress(): void {
    this.longPressTimer?.remove();
    this.longPressTimer = null;
    this.longPressProgress.clear();
    this.longPressProgress.setVisible(false);
  }

  private drawLongPressRing(progress: number): void {
    this.longPressProgress.clear();
    this.longPressProgress.lineStyle(6, THEME.accent, 1);
    this.longPressProgress.beginPath();
    this.longPressProgress.arc(
      layout.centerX,
      layout.y(0.32),
      70,
      Phaser.Math.DegToRad(-90),
      Phaser.Math.DegToRad(-90 + 360 * progress),
    );
    this.longPressProgress.strokePath();
  }
}
