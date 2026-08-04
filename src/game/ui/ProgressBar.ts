import * as Phaser from 'phaser';
import { THEME } from '../config/theme';

export class ProgressBar extends Phaser.GameObjects.Container {
  private readonly track: Phaser.GameObjects.Graphics;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly barWidth: number;
  private readonly barHeight: number;
  private progress = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height = 14) {
    super(scene, x, y);
    this.barWidth = width;
    this.barHeight = height;

    this.track = scene.add.graphics();
    this.track.fillStyle(THEME.backgroundAlt, 1);
    this.track.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    this.add(this.track);

    this.fill = scene.add.graphics();
    this.add(this.fill);

    this.redrawFill();
    scene.add.existing(this);
  }

  setProgress(value: number): void {
    this.progress = Phaser.Math.Clamp(value, 0, 1);
    this.redrawFill();
  }

  private redrawFill(): void {
    this.fill.clear();
    if (this.progress <= 0) return;
    this.fill.fillStyle(THEME.accent, 1);
    const w = Math.max(this.barHeight, this.barWidth * this.progress);
    this.fill.fillRoundedRect(-this.barWidth / 2, -this.barHeight / 2, w, this.barHeight, this.barHeight / 2);
  }
}
