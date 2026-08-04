import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * GitHub Pages 배포 시 저장소 이름에 맞게 base 경로를 지정해야 합니다.
 * 예: 저장소 이름이 "muel-piano-rhythm" 이라면
 *   base: '/muel-piano-rhythm/'
 * 사용자 페이지(예: username.github.io)로 배포한다면
 *   base: '/'
 *
 * 환경변수 VITE_BASE_PATH 로 덮어쓸 수 있습니다 (GitHub Actions 워크플로 참고).
 */
const base = process.env.VITE_BASE_PATH ?? '/muel-piano-rhythm/';

function collectFiles(dir: string, root: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, root, out);
    } else {
      out.push(relative(root, full).split(sep).join('/'));
    }
  }
}

/**
 * 수동 Service Worker를 유지하기로 한 이유:
 * 이 프로젝트는 "의존성 최소화"와 "무료/오픈소스만 사용"을 핵심 원칙으로 삼고
 * 있습니다. vite-plugin-pwa / Workbox는 훌륭한 도구지만, 이 정도 규모의
 * 정적 게임 한 개를 위해 새 런타임 의존성과 설정 복잡도를 추가할 만큼의
 * 이점은 크지 않다고 판단했습니다. 대신 아래 커스텀 Vite 플러그인이
 * 빌드가 끝난 뒤 dist 폴더를 실제로 스캔해 해시가 포함된 파일명까지
 * 정확하게 precache 목록에 담아 public/service-worker.js에 주입합니다.
 * 이렇게 하면 Workbox 없이도 "빌드 결과의 해시 파일을 자동으로 precache"하는
 * 목표를 동일하게 달성할 수 있습니다.
 */
function swPrecachePlugin(): Plugin {
  let resolvedConfig: ResolvedConfig;
  return {
    name: 'muel-sw-precache',
    apply: 'build',
    configResolved(config) {
      resolvedConfig = config;
    },
    closeBundle() {
      const outDir = resolvedConfig.build.outDir;
      const swPath = join(outDir, 'service-worker.js');

      let swSource: string;
      try {
        swSource = readFileSync(swPath, 'utf-8');
      } catch {
        // service-worker.js가 public/에 없으면 조용히 건너뜀
        return;
      }

      const files: string[] = [];
      collectFiles(outDir, outDir, files);

      const precacheUrls = files
        .filter((f) => f !== 'service-worker.js' && !f.endsWith('.map'))
        .map((f) => resolvedConfig.base + f)
        .sort();

      const cacheVersion = `muel-piano-rhythm-${Date.now()}`;

      swSource = swSource
        .replace('__CACHE_VERSION__', cacheVersion)
        .replace('__PRECACHE_URLS__', JSON.stringify(precacheUrls));

      writeFileSync(swPath, swSource, 'utf-8');
    },
  };
}

export default defineConfig({
  base,
  plugins: [swPrecachePlugin()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
  },
});
