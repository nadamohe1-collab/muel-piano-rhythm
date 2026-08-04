import * as Phaser from 'phaser';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { ensureMinTouchSize } from '../utils/responsive';

export interface ButtonOptions {
  width?: number;
  height?: number;
  label: string;
  fontSize?: number;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
}

/**
 * 카드형 디자인에 어울리는 둥근 모서리 버튼.
 * - 최소 56x56px 터치 영역 보장
 * - 눌림 애니메이션(스케일 축소) 제공
 * - 터치/마우스 모두 지원
 */
export class Button extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly hitZone: Phaser.GameObjects.Zone;
  private readonly btnWidth: number;
  private readonly btnHeight: number;
  private readonly variant: 'primary' | 'secondary' | 'ghost';

  constructor(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions) {
    super(scene, x, y);

    this.btnWidth = ensureMinTouchSize(options.width ?? 220);
    this.btnHeight = ensureMinTouchSize(options.height ?? 64);
    this.variant = options.variant ?? 'primary';

    this.bg = scene.add.graphics();
    this.drawBackground(1);
    this.add(this.bg);

    const colors = this.getColors();
    this.label = scene.add
      .text(0, 0, options.label, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: `${options.fontSize ?? 26}px`,
        color: colors.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add(this.label);

    this.setSize(this.btnWidth, this.btnHeight);

    // 클릭/터치 판정은 컨테이너 자체가 아니라, 정확히 버튼 크기와 위치에
    // 맞춘 투명한 Zone 오브젝트로 처리한다. Container에 커스텀 hitArea를
    // 직접 지정하는 방식은 씬 스케일링(Scale.FIT 등) 상황에서 클릭 판정
    // 영역이 어긋나는 경우가 있어, 이 프로젝트에서는 항상 Zone을 사용한다.
    this.hitZone = scene.add.zone(0, 0, this.btnWidth, this.btnHeight);
    this.hitZone.setOrigin(0.5, 0.5);
    this.hitZone.setInteractive({ useHandCursor: true });
    this.add(this.hitZone);

    this.hitZone.on('pointerdown', () => this.setScale(0.94));
    this.hitZone.on('pointerup', () => {
      this.setScale(1);
      options.onClick();
    });
    this.hitZone.on('pointerout', () => this.setScale(1));

    scene.add.existing(this);
  }

  private getColors(): { fill: number; text: string; stroke: number } {
    switch (this.variant) {
      case 'primary':
        return { fill: THEME.accent, text: '#2b2b2b', stroke: THEME.accentDark };
      case 'secondary':
        return { fill: THEME.surface, text: '#2b2b2b', stroke: THEME.secondaryLight };
      case 'ghost':
      default:
        return { fill: THEME.background, text: '#7a6f63', stroke: THEME.secondaryLight };
    }
  }

  private drawBackground(alpha: number): void {
    const colors = this.getColors();
    this.bg.clear();
    this.bg.fillStyle(colors.fill, alpha);
    this.bg.lineStyle(2, colors.stroke, 1);
    this.bg.fillRoundedRect(-this.btnWidth / 2, -this.btnHeight / 2, this.btnWidth, this.btnHeight, 18);
    this.bg.strokeRoundedRect(-this.btnWidth / 2, -this.btnHeight / 2, this.btnWidth, this.btnHeight, 18);
  }

  setLabel(text: string): void {
    this.label.setText(text);
  }

  setButtonEnabled(enabled: boolean): void {
    this.setAlpha(enabled ? 1 : 0.45);
    if (enabled) {
      this.hitZone.setInteractive({ useHandCursor: true });
    } else {
      this.hitZone.disableInteractive();
    }
  }
}
