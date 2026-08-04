import * as Phaser from 'phaser';
import { fitCameraToDesign } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { createRankingTable } from '../ui/RankingTable';
import { SONG_REGISTRY } from '../data/songRegistry';
import { APP_VERSION, DATA_SCHEMA_VERSION } from '../config/constants';
import {
  getRankingBoard,
  resetRankingBoard,
  resetAllRankings,
  clearRecentNames,
  resetAllData,
  saveSettings,
} from '../storage/repositories';
import { topDisplayEntries } from '../systems/RankingSystem';
import { setMutedAndPersist } from '../systems/AudioSettings';
import { sessionState } from '../state/sessionState';

export class AdminScene extends Phaser.Scene {
  private tableContainer: Phaser.GameObjects.Container | null = null;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('Admin');
  }

  create(): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);

    this.add
      .text(layout.centerX, layout.y(0.06), '교사용 관리 화면', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '31px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    this.add
      .text(layout.centerX, layout.y(0.11), `앱 버전 ${APP_VERSION} · 데이터 버전 ${DATA_SCHEMA_VERSION}`, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '17px',
        color: '#b8ada2',
      })
      .setOrigin(0.5);

    new Button(this, 110, 50, {
      label: '나가기',
      variant: 'ghost',
      width: 140,
      height: 52,
      fontSize: 21,
      onClick: () => this.scene.start('Home'),
    });

    this.statusText = this.add
      .text(layout.centerX, layout.y(0.16), '', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '18px',
        color: '#4fa97c',
      })
      .setOrigin(0.5);

    this.buildActionButtons();

    const song = SONG_REGISTRY[0];
    if (song) {
      void this.refreshRankingPreview(song.id, 'beginner');
    }
  }

  private buildActionButtons(): void {
    const song = SONG_REGISTRY[0];

    const actions: Array<{ label: string; onClick: () => void; danger?: boolean }> = [
      {
        label: `'${song?.title ?? ''}' 랭킹 초기화`,
        onClick: () =>
          this.confirmAndRun(
            '정말 초기화할까요?',
            '삭제한 기록은 복구할 수 없습니다.',
            async () => {
              if (!song) return;
              await resetRankingBoard(song.id, 'beginner');
              await resetRankingBoard(song.id, 'challenge');
              await this.refreshRankingPreview(song.id, 'beginner');
            },
            true,
          ),
      },
      {
        label: '전체 랭킹 초기화',
        onClick: () =>
          this.confirmAndRun(
            '정말 초기화할까요?',
            '모든 곡의 랭킹 기록이 삭제됩니다. 삭제한 기록은 복구할 수 없습니다.',
            async () => {
              await resetAllRankings();
              const s = SONG_REGISTRY[0];
              if (s) await this.refreshRankingPreview(s.id, 'beginner');
            },
            true,
          ),
      },
      {
        label: '최근 이름 초기화',
        onClick: () =>
          this.confirmAndRun('정말 초기화할까요?', '최근 이름 목록이 삭제됩니다.', async () => {
            await clearRecentNames();
          }),
      },
      {
        label: '튜토리얼 다시 보기 설정',
        onClick: () =>
          this.confirmAndRun('튜토리얼을 다시 보이게 할까요?', "'다음부터 보지 않기' 설정이 초기화됩니다.", async () => {
            sessionState.settings.tutorialDontShowAgain = false;
            await saveSettings({ tutorialDontShowAgain: false });
          }),
      },
      {
        label: '음량 기본값 복원',
        onClick: () =>
          this.confirmAndRun('음량을 기본값으로 되돌릴까요?', '음소거가 해제되고 기본 음량으로 복원됩니다.', async () => {
            await setMutedAndPersist(false);
          }),
      },
      {
        label: '전체 데이터 초기화',
        onClick: () =>
          this.confirmAndRun(
            '정말 초기화할까요?',
            '학생 이름, 랭킹, 설정 등 모든 데이터가 삭제됩니다. 삭제한 기록은 복구할 수 없습니다.',
            async () => {
              await resetAllData();
              const s = SONG_REGISTRY[0];
              if (s) await this.refreshRankingPreview(s.id, 'beginner');
            },
            true,
          ),
      },
    ];

    const cols = 2;
    const btnWidth = 320;
    const btnHeight = 56;
    const gapX = 40;
    const gapY = 20;
    const startX = layout.centerX - (btnWidth + gapX) / 2;
    const startY = layout.y(0.28);

    actions.forEach((action, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      new Button(this, startX + col * (btnWidth + gapX), startY + row * (btnHeight + gapY), {
        label: action.label,
        variant: action.danger ? 'primary' : 'secondary',
        width: btnWidth,
        height: btnHeight,
        fontSize: 17,
        onClick: action.onClick,
      });
    });
  }

  private confirmAndRun(title: string, message: string, run: () => Promise<void>, danger = false): void {
    sessionState.audio.effectSynth.buttonTouch();
    new Modal(this, {
      title,
      message,
      danger,
      confirmLabel: '확인',
      cancelLabel: '취소',
      onConfirm: () => {
        run()
          .then(() => this.statusText.setText('처리되었습니다.'))
          .catch(() => this.statusText.setText('기록을 저장하지 못했어요. 기기의 저장 공간과 브라우저 설정을 확인해 주세요.'));
      },
    });
  }

  private async refreshRankingPreview(songId: string, difficultyId: string): Promise<void> {
    this.tableContainer?.destroy();
    const entries = await getRankingBoard(songId, difficultyId).catch(() => []);
    this.tableContainer = createRankingTable(this, layout.centerX, layout.y(0.76), topDisplayEntries(entries), 640);
  }
}
