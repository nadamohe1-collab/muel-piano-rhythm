/**
 * Phaser는 CSS 변수를 직접 사용할 수 없으므로, src/styles/brand.css 의
 * 디자인 토큰과 동일한 값을 숫자 hex 형태로 여기에 미러링합니다.
 * 색상을 바꿀 때는 이 파일과 brand.css 를 함께 수정하세요.
 */
export const THEME = {
  primary: 0x2b2b2b,
  primaryLight: 0x4a4a4a,
  secondary: 0x8a6f57,
  secondaryLight: 0xc9b299,
  accent: 0xe8a23d,
  accentLight: 0xf6c877,
  accentDark: 0xc9821f,

  background: 0xfff8ef,
  backgroundAlt: 0xfbeedd,
  surface: 0xffffff,
  surfaceAlt: 0xfff3e2,

  success: 0x4fa97c,
  warning: 0xf2a65a,
  danger: 0xe8846b,

  textPrimary: 0x2b2b2b,
  textSecondary: 0x7a6f63,
  textInverse: 0xfff8ef,

  judgmentPerfect: 0xe8a23d,
  judgmentGreat: 0x4fa97c,
  judgmentGood: 0x6f9bd1,
  judgmentMiss: 0xe8846b,
} as const;

export const FONT_FAMILY = "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif";

/**
 * Phaser Text는 선언한 fontSize 그대로의 해상도로 비트맵을 만든 뒤, 카메라 zoom이
 * 걸리면 그 비트맵을 확대해서 그린다. 이 프로젝트는 화면 크기에 맞춰 카메라를
 * 확대/축소하는 방식(cameraFit.ts)을 쓰기 때문에, 큰 화면(데스크탑 등)에서는
 * 텍스트가 흐릿하게 보일 수 있다. resolution을 높여 텍스트 비트맵 자체를
 * 더 촘촘하게 그려서 확대되어도 또렷하게 보이도록 한다.
 */
export const TEXT_RESOLUTION = typeof window !== 'undefined' ? Math.min(8, Math.max(4, (window.devicePixelRatio || 1) * 4)) : 4;

export function hexToCss(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
