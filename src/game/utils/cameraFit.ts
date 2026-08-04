import * as Phaser from 'phaser';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../config/constants';

/**
 * 실제 화면 크기(데스크탑/태블릿/폰, 모든 기기)와 무관하게 1280x720 디자인
 * 좌표계를 항상 정확히 화면에 맞춰 보여주는 함수.
 *
 * 배경: Scale.FIT 모드는 캔버스를 CSS로 확대/축소하는 방식이라, 브라우저나
 * 기기에 따라 "화면에 보이는 위치"와 "클릭으로 인식되는 위치"가 미세하게
 * 어긋나는 사례가 보고되었다. 이 프로젝트는 대신 Scale.RESIZE(캔버스 자체를
 * 항상 실제 화면 픽셀 크기와 1:1로 유지)와, Phaser의 카메라 확대/축소(zoom)
 * 기능을 사용한다. 카메라 변환은 렌더링과 입력 좌표 계산에 항상 동일하게
 * 적용되는 Phaser의 핵심 기능이라, 화면 크기가 달라져도 "보이는 위치 = 클릭
 * 인식 위치"가 항상 일치한다.
 *
 * 모든 씬은 create()의 가장 먼저 이 함수를 호출해야 한다.
 */
export function fitCameraToDesign(scene: Phaser.Scene): void {
  const applyFit = (): void => {
    const width = scene.scale.width;
    const height = scene.scale.height;
    if (width <= 0 || height <= 0) return;

    const zoom = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    const camera = scene.cameras.main;
    camera.setZoom(zoom);
    camera.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
  };

  applyFit();

  scene.scale.on(Phaser.Scale.Events.RESIZE, applyFit);

  // 일부 모바일 브라우저는 화면 회전 직후 잠깐 동안 실제 뷰포트 크기를
  // 잘못 보고하는 경우가 있어(회전 애니메이션이 끝나기 전), resize 이벤트
  // 한 번만으로는 부족할 때가 있다. 회전 이벤트 발생 시 몇 차례 다시
  // 계산해 최종적으로 안정된 크기에 맞춰지도록 한다.
  const handleOrientationChange = (): void => {
    applyFit();
    window.setTimeout(applyFit, 150);
    window.setTimeout(applyFit, 400);
    window.setTimeout(applyFit, 800);
  };
  window.addEventListener('orientationchange', handleOrientationChange);
  const orientationMedia = window.matchMedia?.('(orientation: landscape)');
  orientationMedia?.addEventListener?.('change', handleOrientationChange);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, applyFit);
    window.removeEventListener('orientationchange', handleOrientationChange);
    orientationMedia?.removeEventListener?.('change', handleOrientationChange);
  });
}

/**
 * 디자인 좌표(1280x720 기준)를 실제 화면(브라우저 뷰포트) 픽셀 좌표로 변환한다.
 * 이름 입력 화면의 HTML <input>처럼, Phaser가 아닌 순수 DOM 요소를 게임
 * 화면 위에 정확히 겹쳐 그려야 할 때 사용한다. fitCameraToDesign과 정확히
 * 동일한 계산식을 사용해, 카메라가 보여주는 위치와 항상 일치하도록 한다.
 */
export function designPointToScreen(scene: Phaser.Scene, designX: number, designY: number): { x: number; y: number; zoom: number } {
  const canvas = scene.game.canvas;
  const rect = canvas.getBoundingClientRect();
  const zoom = Math.min(rect.width / DESIGN_WIDTH, rect.height / DESIGN_HEIGHT);
  const offsetX = (rect.width - DESIGN_WIDTH * zoom) / 2;
  const offsetY = (rect.height - DESIGN_HEIGHT * zoom) / 2;
  return {
    x: rect.left + offsetX + designX * zoom,
    y: rect.top + offsetY + designY * zoom,
    zoom,
  };
}
