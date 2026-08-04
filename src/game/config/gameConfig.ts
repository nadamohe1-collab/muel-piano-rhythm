import * as Phaser from 'phaser';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from './constants';
import { BootScene } from '../scenes/BootScene';
import { HomeScene } from '../scenes/HomeScene';
import { NameScene } from '../scenes/NameScene';
import { SongSelectScene } from '../scenes/SongSelectScene';
import { DifficultyScene } from '../scenes/DifficultyScene';
import { TutorialScene } from '../scenes/TutorialScene';
import { GameScene } from '../scenes/GameScene';
import { PauseScene } from '../scenes/PauseScene';
import { ResultScene } from '../scenes/ResultScene';
import { RankingScene } from '../scenes/RankingScene';
import { AdminScene } from '../scenes/AdminScene';

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#fff8ef',
    /**
     * Scale.RESIZE: 캔버스 자체를 항상 실제 화면 픽셀 크기와 1:1로 맞춘다
     * (CSS로 확대/축소하지 않음). 디자인 해상도(1280x720) 맞춤은
     * utils/cameraFit.ts 의 카메라 zoom으로 각 씬에서 직접 처리한다.
     * 이 방식은 "보이는 위치"와 "클릭 인식 위치"가 항상 정확히 일치하도록
     * 보장한다 (Scale.FIT + CSS 확대 조합에서 기기별로 어긋나는 문제를 방지).
     */
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: DESIGN_WIDTH,
      height: DESIGN_HEIGHT,
    },
    input: {
      activePointers: 10, // 멀티터치 대응
    },
    dom: {
      createContainer: true,
    },
    audio: {
      disableWebAudio: false,
    },
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    scene: [
      BootScene,
      HomeScene,
      NameScene,
      SongSelectScene,
      DifficultyScene,
      TutorialScene,
      GameScene,
      PauseScene,
      ResultScene,
      RankingScene,
      AdminScene,
    ],
  };
}
