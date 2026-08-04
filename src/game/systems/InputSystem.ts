import { LANE_KEYBOARD_KEYS, LANE_COUNT } from '../config/constants';

/** 키보드 KeyboardEvent.code 값을 레인 번호로 변환한다. 매핑에 없으면 undefined */
export function keyCodeToLane(code: string): number | undefined {
  const index = LANE_KEYBOARD_KEYS.indexOf(code as (typeof LANE_KEYBOARD_KEYS)[number]);
  return index === -1 ? undefined : index;
}

export function laneToKeyLabel(lane: number): string {
  const key = LANE_KEYBOARD_KEYS[lane];
  return key ? key.replace('Key', '') : '';
}

/**
 * 여러 포인터(터치)가 동시에 눌려도 각 레인에 대해 중복 입력이 발생하지 않도록
 * 포인터 id -> 현재 눌려있는 레인을 추적한다. 터치가 건반 밖으로 이동하거나
 * 취소되는 경우에도 상태가 고정되지 않도록 release를 명확히 호출해야 한다.
 */
export class MultiTouchLaneTracker {
  private readonly pointerToLane = new Map<number, number>();
  private readonly pressedLanes = new Set<number>();

  /** 포인터가 특정 레인을 눌렀을 때 호출. 이미 다른 포인터가 같은 레인을 누르고 있어도 별도로 추적한다 */
  press(pointerId: number, lane: number): boolean {
    if (lane < 0 || lane >= LANE_COUNT) return false;
    this.pointerToLane.set(pointerId, lane);
    const wasEmpty = !this.pressedLanes.has(lane);
    this.pressedLanes.add(lane);
    return wasEmpty;
  }

  /** 포인터가 떼어지거나 취소되었을 때 호출 (건반 밖 이동 포함) */
  release(pointerId: number): number | undefined {
    const lane = this.pointerToLane.get(pointerId);
    this.pointerToLane.delete(pointerId);
    if (lane === undefined) return undefined;

    // 같은 레인을 누르고 있는 다른 포인터가 없을 때만 레인을 해제한다
    const stillPressed = [...this.pointerToLane.values()].includes(lane);
    if (!stillPressed) {
      this.pressedLanes.delete(lane);
    }
    return lane;
  }

  releaseAll(): void {
    this.pointerToLane.clear();
    this.pressedLanes.clear();
  }

  isLanePressed(lane: number): boolean {
    return this.pressedLanes.has(lane);
  }
}
