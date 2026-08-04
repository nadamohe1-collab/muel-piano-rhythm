type Listener = () => void;

/**
 * 새 Service Worker가 설치되어 "대기 중" 상태가 되면 그 사실을 기록한다.
 * 실제로 적용(skipWaiting)하는 시점은 사용자가 시작 화면에서
 * "업데이트하기" 버튼을 눌렀을 때뿐이다. 이렇게 분리해 두면
 * 게임 플레이 중에는 절대 강제로 새로고침되지 않는다.
 */
class UpdateState {
  updateAvailable = false;
  private waitingWorker: ServiceWorker | null = null;
  private listeners: Listener[] = [];

  setWaitingWorker(worker: ServiceWorker): void {
    this.waitingWorker = worker;
    this.updateAvailable = true;
    this.listeners.forEach((fn) => fn());
  }

  onUpdateAvailable(fn: Listener): void {
    this.listeners.push(fn);
  }

  /** 사용자가 "업데이트하기" 버튼을 눌렀을 때만 호출한다 */
  applyUpdate(): void {
    const worker = this.waitingWorker;
    if (!worker) return;

    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        window.location.reload();
      }
    });
    worker.postMessage('SKIP_WAITING');
  }
}

export const updateState = new UpdateState();
