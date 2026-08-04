import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

/**
 * 실제 Service Worker 활성화/캐시 갱신 흐름은 브라우저 환경이 필요해 이
 * 테스트 스위트(vitest, node 환경)에서 직접 실행할 수 없다. 대신 정적으로
 * public/service-worker.js 소스를 검사해, 캐시 버전 교체 로직이 IndexedDB에
 * 전혀 접근하지 않는다는 것(=학생 이름/랭킹 데이터를 건드릴 수 없다는 것)을
 * 코드 수준에서 검증한다. 실제 기기에서의 "업데이트 전후 데이터 유지"는
 * README의 PWA 수동 검증 절차로 별도 확인이 필요하다.
 */
describe('service-worker.js 정적 검증', () => {
  const swSource = readFileSync(join(currentDir, '..', 'public', 'service-worker.js'), 'utf-8');
  // 주석 안에서 "설명을 위해" skipWaiting/clients.claim을 언급하는 부분은
  // 실제 호출이 아니므로, 실제 코드 동작만 검사하기 위해 주석을 제거한 버전도 준비한다.
  const codeOnly = swSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('indexedDB를 전혀 참조하지 않는다 (캐시 갱신이 학생 데이터에 영향을 줄 수 없음)', () => {
    expect(codeOnly).not.toMatch(/indexedDB/i);
  });

  it('설치 시 self.skipWaiting()을 자동 호출하지 않는다 (게임 중 강제 적용 방지)', () => {
    const installBlockMatch = codeOnly.match(/addEventListener\('install'[\s\S]*?\n\}\);/);
    expect(installBlockMatch).not.toBeNull();
    expect(installBlockMatch?.[0]).not.toMatch(/skipWaiting/);

    // skipWaiting은 오직 "SKIP_WAITING" 메시지를 받았을 때만 호출되어야 한다
    expect(codeOnly).toMatch(/event\.data === 'SKIP_WAITING'[\s\S]*?self\.skipWaiting\(\)/);
  });

  it('activate 시 self.clients.claim()을 자동 호출하지 않는다 (열린 탭이 즉시 새 버전에 넘어가지 않음)', () => {
    expect(codeOnly).not.toMatch(/self\.clients\.claim\(\)/);
  });

  it('빌드 시 치환되어야 할 플레이스홀더를 포함한다', () => {
    expect(swSource).toContain('__CACHE_VERSION__');
    expect(swSource).toContain('__PRECACHE_URLS__');
  });
});
