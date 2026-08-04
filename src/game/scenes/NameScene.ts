import * as Phaser from 'phaser';
import { fitCameraToDesign, designPointToScreen } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { validateStudentName } from '../utils/validation';
import { NAME_RULES } from '../config/constants';
import { getRecentNames, addRecentName } from '../storage/repositories';
import { sessionState } from '../state/sessionState';

const INPUT_WIDTH = 320;
const INPUT_HEIGHT = 56;
const INPUT_DESIGN_Y_RATIO = 0.25;

export class NameScene extends Phaser.Scene {
  private inputEl!: HTMLInputElement;
  private errorText!: Phaser.GameObjects.Text;
  private continueBtn!: Button;
  private recentContainer!: Phaser.GameObjects.Container;
  private repositionInputHandler = (): void => this.repositionInput();

  constructor() {
    super('Name');
  }

  create(): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);

    this.add
      .text(layout.centerX, layout.y(0.1), '이름을 알려주세요', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    // HTML input을 Phaser의 DOM 오브젝트 기능이 아니라, document.body에 직접
    // 붙이는 독립적인 오버레이로 만든다. Phaser의 DOM 위치 계산(카메라 확대/
    // 축소, 캔버스 스케일 등)에 기대지 않고, 우리가 직접 화면 좌표를 계산해
    // 배치하기 때문에 항상 정확히 중앙에 위치한다.
    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.maxLength = NAME_RULES.maxLength + 2;
    this.inputEl.placeholder = '이름 (2~8자)';
    this.inputEl.value = sessionState.studentName;
    this.inputEl.autocomplete = 'off';
    this.inputEl.style.cssText = `
      position: fixed;
      width: ${INPUT_WIDTH}px; height: ${INPUT_HEIGHT}px; font-size: 22px; text-align: center;
      border-radius: 14px; border: 2px solid ${cssColor(THEME.secondaryLight)};
      outline: none; background: #ffffff; color: ${cssColor(THEME.primary)};
      font-family: ${FONT_FAMILY};
      box-sizing: border-box;
      z-index: 1000;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(this.inputEl);
    this.repositionInput();

    window.addEventListener('resize', this.repositionInputHandler);
    window.addEventListener('orientationchange', this.repositionInputHandler);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.repositionInputHandler);

    this.inputEl.addEventListener('input', () => this.handleInputChange());

    this.errorText = this.add
      .text(layout.centerX, layout.y(0.34), '', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '18px',
        color: cssColor(THEME.danger),
      })
      .setOrigin(0.5);

    this.continueBtn = new Button(this, layout.centerX, layout.y(0.44), {
      label: '계속하기',
      width: 220,
      height: 60,
      onClick: () => this.handleContinue(),
    });

    new Button(this, 110, 50, {
      label: '← 뒤로',
      variant: 'ghost',
      width: 130,
      height: 52,
      fontSize: 21,
      onClick: () => {
        sessionState.audio.effectSynth.buttonTouch();
        this.scene.start('Home');
      },
    });

    this.add
      .text(layout.centerX, layout.y(0.58), '최근 이름', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '19px',
        color: '#7a6f63',
      })
      .setOrigin(0.5);

    this.recentContainer = this.add.container(layout.centerX, layout.y(0.7));
    void this.loadRecentNames();

    this.add
      .text(layout.centerX, layout.y(0.95), '같은 이름의 친구가 있다면 이름 뒤에 번호를 붙여 주세요. (예: 서윤1, 서윤2)', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '14px',
        color: '#b8ada2',
      })
      .setOrigin(0.5);

    this.handleInputChange();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputEl.remove();
      window.removeEventListener('resize', this.repositionInputHandler);
      window.removeEventListener('orientationchange', this.repositionInputHandler);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.repositionInputHandler);
    });
  }

  /** 카메라가 화면을 어떻게 맞추고 있는지 계산해, input을 정확히 같은 자리에 겹쳐 놓는다 */
  private repositionInput(): void {
    const { x, y } = designPointToScreen(this, layout.centerX, layout.y(INPUT_DESIGN_Y_RATIO));
    this.inputEl.style.left = `${x}px`;
    this.inputEl.style.top = `${y}px`;
  }

  private async loadRecentNames(): Promise<void> {
    const names = await getRecentNames();
    const spacing = 140;
    const startX = -((names.length - 1) * spacing) / 2;
    names.forEach((name, i) => {
      const btn = new Button(this, startX + i * spacing, 0, {
        label: name,
        variant: 'secondary',
        width: 128,
        height: 56,
        fontSize: 21,
        onClick: () => {
          this.inputEl.value = name;
          this.handleInputChange();
        },
      });
      this.recentContainer.add(btn);
    });
  }

  private handleInputChange(): void {
    const result = validateStudentName(this.inputEl.value);
    if (this.inputEl.value.trim().length === 0) {
      this.errorText.setText('');
      this.continueBtn.setButtonEnabled(false);
      return;
    }
    if (!result.valid) {
      this.errorText.setText(result.reason ?? '');
      this.continueBtn.setButtonEnabled(false);
    } else {
      this.errorText.setText('');
      this.continueBtn.setButtonEnabled(true);
    }
  }

  private async handleContinue(): Promise<void> {
    const result = validateStudentName(this.inputEl.value);
    if (!result.valid) {
      this.errorText.setText(result.reason ?? '');
      return;
    }
    sessionState.audio.effectSynth.buttonTouch();
    sessionState.studentName = result.normalized;
    try {
      await addRecentName(result.normalized);
    } catch {
      // 최근 이름 저장 실패는 게임 진행에 영향을 주지 않는다
    }
    this.scene.start('SongSelect');
  }
}

function cssColor(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
