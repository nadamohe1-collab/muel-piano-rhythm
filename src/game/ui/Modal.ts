import * as Phaser from 'phaser';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { Button } from './Button';
import { layout } from '../utils/responsive';

export interface ModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  /** 위험한 동작(삭제 등)일 때 확인 버튼을 danger 색상으로 표시 */
  danger?: boolean;
}

/** 화면 전체를 덮는 반투명 배경 위에 카드형 확인 모달을 띄운다 */
export class Modal extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, options: ModalOptions) {
    super(scene, 0, 0);
    this.setDepth(10_000);

    const overlay = scene.add.rectangle(0, 0, layout.width * 2, layout.height * 2, 0x2b2b2b, 0.55).setOrigin(0.5);
    overlay.setInteractive(); // 뒤쪽 요소로 입력이 전달되지 않도록 차단
    this.add(overlay);

    const cardWidth = 560;
    const cardHeight = 300;
    const card = scene.add.graphics();
    card.fillStyle(THEME.surface, 1);
    card.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 28);
    this.add(card);

    const title = scene.add
      .text(0, -cardHeight / 2 + 56, options.title, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '31px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);
    this.add(title);

    const message = scene.add
      .text(0, -10, options.message, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '22px',
        color: '#7a6f63',
        align: 'center',
        wordWrap: { width: cardWidth - 80 },
      })
      .setOrigin(0.5);
    this.add(message);

    const cancelBtn = new Button(scene, -110, cardHeight / 2 - 60, {
      label: options.cancelLabel ?? '취소',
      variant: 'secondary',
      width: 180,
      height: 56,
      onClick: () => {
        this.destroy();
        options.onCancel?.();
      },
    });
    this.add(cancelBtn);

    const confirmBtn = new Button(scene, 110, cardHeight / 2 - 60, {
      label: options.confirmLabel ?? '확인',
      variant: options.danger ? 'primary' : 'primary',
      width: 180,
      height: 56,
      onClick: () => {
        this.destroy();
        options.onConfirm();
      },
    });
    this.add(confirmBtn);

    this.setPosition(layout.centerX, layout.centerY);
    scene.add.existing(this);
  }
}
