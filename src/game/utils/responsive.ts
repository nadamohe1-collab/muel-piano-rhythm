import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../config/constants';

/** 디자인 해상도 대비 안전 영역 여백 비율을 이용해 실제 좌표를 계산하는 헬퍼 */
export const layout = {
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  centerX: DESIGN_WIDTH / 2,
  centerY: DESIGN_HEIGHT / 2,
  /** 비율(0~1)로 x좌표 계산 */
  x(ratio: number): number {
    return DESIGN_WIDTH * ratio;
  },
  /** 비율(0~1)로 y좌표 계산 */
  y(ratio: number): number {
    return DESIGN_HEIGHT * ratio;
  },
};

/** 최소 터치 영역(56px) 이상을 보장하는 크기 계산 */
export function ensureMinTouchSize(size: number, minSize = 56): number {
  return Math.max(size, minSize);
}
