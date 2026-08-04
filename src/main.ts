import * as Phaser from 'phaser';
import { createGameConfig } from './game/config/gameConfig';
import { updateState } from './game/state/updateState';

new Phaser.Game(createGameConfig());

// PWA: 최초 접속 이후 오프라인 실행을 위한 Service Worker 등록.
// 개발 서버(dev)에서는 service-worker.js의 __PRECACHE_URLS__ 플레이스홀더가
// 빌드 시에만 채워지므로, 프로덕션 빌드에서만 등록한다.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        // 이미 새 버전이 설치되어 대기 중인 경우 (예: 다른 탭에서 먼저 감지)
        if (registration.waiting && navigator.serviceWorker.controller) {
          updateState.setWaitingWorker(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // controller가 이미 존재한다는 것은 "최초 설치"가 아니라 "업데이트"라는 뜻이다.
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              updateState.setWaitingWorker(newWorker);
            }
          });
        });
      })
      .catch(() => {
        // Service Worker 등록 실패는 게임 실행 자체에는 영향을 주지 않는다
      });
  });
}
