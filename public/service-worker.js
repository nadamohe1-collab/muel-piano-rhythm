/**
 * 뮤엘피아노 리듬게임 Service Worker
 *
 * 전략 (2차 개선):
 *  - 빌드 시 vite.config.ts의 커스텀 플러그인이 dist 폴더의 실제 파일 목록을
 *    읽어 아래 CACHE_VERSION / PRECACHE_URLS 상수 자리에 값을 채워 넣는다.
 *    그래서 해시가 붙는 정적 자산(JS/CSS)도 빌드마다 자동으로 정확히
 *    precache 목록에 포함된다 (하드코딩 불필요).
 *  - 최초 정상 접속 시 install 단계에서 이 파일들을 전부 캐시해 두므로,
 *    이후에는 완전히 오프라인에서도 게임 전체가 실행된다.
 *  - self.skipWaiting()과 self.clients.claim()을 자동으로 호출하지 않는다.
 *    즉, 새 버전이 설치되어도 사용자가 명시적으로 "업데이트하기"를 누르기
 *    전까지는 기존 탭이 계속 이전 버전으로 동작한다. 이렇게 해야 게임 플레이
 *    도중 구버전 HTML과 신버전 JS가 섞이는 문제를 막을 수 있다.
 *  - 학생 이름/랭킹 데이터는 IndexedDB에 저장되며 Cache Storage와는 완전히
 *    별개이므로, 이 Service Worker의 캐시 갱신/삭제는 그 데이터에 영향을
 *    주지 않는다.
 */
const CACHE_VERSION = '__CACHE_VERSION__';
const PRECACHE_URLS = __PRECACHE_URLS__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // addAll은 하나라도 실패하면 전체가 실패하므로, 각 파일을 개별적으로
      // 캐시해 일부 자산 캐싱 실패가 설치 전체를 막지 않게 한다.
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {
            /* 개별 자산 캐싱 실패는 무시하고 계속 진행 */
          }),
        ),
      );
    }),
  );
  // 의도적으로 self.skipWaiting()을 호출하지 않는다.
  // (사용자가 "업데이트하기" 버튼을 눌렀을 때만 메시지로 skipWaiting을 트리거한다)
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))),
  );
  // 의도적으로 self.clients.claim()을 호출하지 않는다.
  // 이미 열려 있는 탭은 사용자가 업데이트를 수락하고 새로고침한 뒤에만
  // 새 Service Worker의 제어를 받는다.
});

// 페이지(main.ts)에서 "업데이트하기" 버튼을 눌렀을 때만 이 메시지를 보낸다.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // GET 요청, 같은 오리진만 캐시 대상으로 한다
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) {
        // precache된 자산은 즉시 반환 (오프라인에서도 항상 동작)
        return cached;
      }
      // precache에 없는 요청(런타임에 새로 추가된 자산 등)은 네트워크 우선 시도 후 캐싱
      try {
        const response = await fetch(request);
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const fallback = await cache.match(request);
        if (fallback) return fallback;
        throw error;
      }
    }),
  );
});

