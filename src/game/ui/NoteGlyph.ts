import * as Phaser from 'phaser';
import type { NoteVisualValue } from '../utils/noteVisuals';

/**
 * 노트를 네모 막대가 아니라 실제 음표 모양(음표머리 + 기둥 + 꼬리)으로 그린다.
 * - 4분음표: 머리 + 기둥
 * - 8분음표: 머리 + 기둥 + 꼬리 1개
 * - 16분음표: 머리 + 기둥 + 꼬리 2개
 *
 * (x, y)는 음표머리의 중심 좌표를 기준으로 한다 (판정선과 시각적으로 맞추기 위함).
 */
export function createNoteGlyph(
  scene: Phaser.Scene,
  x: number,
  y: number,
  laneWidth: number,
  color: number,
  strokeColor: number,
  value: NoteVisualValue,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  const headRadiusX = Math.min(15, laneWidth * 0.26);
  const headRadiusY = headRadiusX * 0.8;
  const stemHeight = 36;
  const stemX = headRadiusX * 0.82;

  const graphics = scene.add.graphics();

  // 기둥
  graphics.lineStyle(3, color, 1);
  graphics.beginPath();
  graphics.moveTo(stemX, 0);
  graphics.lineTo(stemX, -stemHeight);
  graphics.strokePath();

  // 꼬리 (8분/16분음표)
  graphics.fillStyle(color, 1);
  if (value === 'eighth' || value === 'sixteenth') {
    graphics.beginPath();
    graphics.moveTo(stemX, -stemHeight);
    graphics.lineTo(stemX + 11, -stemHeight + 7);
    graphics.lineTo(stemX, -stemHeight + 15);
    graphics.closePath();
    graphics.fillPath();
  }
  if (value === 'sixteenth') {
    graphics.beginPath();
    graphics.moveTo(stemX, -stemHeight + 11);
    graphics.lineTo(stemX + 11, -stemHeight + 18);
    graphics.lineTo(stemX, -stemHeight + 26);
    graphics.closePath();
    graphics.fillPath();
  }

  // 음표머리
  graphics.fillStyle(color, 1);
  graphics.lineStyle(2, strokeColor, 1);
  graphics.fillEllipse(0, 0, headRadiusX * 2, headRadiusY * 2);
  graphics.strokeEllipse(0, 0, headRadiusX * 2, headRadiusY * 2);

  container.add(graphics);
  return container;
}
