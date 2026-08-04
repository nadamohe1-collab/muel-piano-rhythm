import * as Phaser from 'phaser';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { formatScore, formatAccuracy } from '../utils/formatting';
import type { PlayResult } from '../types/score';

/** 결과 화면의 카드형 요약 UI를 생성한다 */
export function createResultCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  result: PlayResult,
  songTitle: string,
  difficultyLabel: string,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const width = 620;
  const height = 420;

  const card = scene.add.graphics();
  card.fillStyle(THEME.surface, 1);
  card.fillRoundedRect(-width / 2, -height / 2, width, height, 28);
  container.add(card);

  const nameText = scene.add
    .text(0, -height / 2 + 44, `${result.studentName} 학생`, {
      fontFamily: FONT_FAMILY,
      resolution: TEXT_RESOLUTION,
      fontSize: '26px',
      color: '#7a6f63',
    })
    .setOrigin(0.5);
  container.add(nameText);

  const songText = scene.add
    .text(0, -height / 2 + 78, `${songTitle} · ${difficultyLabel}`, {
      fontFamily: FONT_FAMILY,
      resolution: TEXT_RESOLUTION,
      fontSize: '22px',
      color: '#b8ada2',
    })
    .setOrigin(0.5);
  container.add(songText);

  const gradeColor = result.grade === 'RETRY' ? THEME.danger : THEME.accent;
  const gradeLabel = result.grade === 'RETRY' ? '다시 도전' : result.grade;
  const gradeText = scene.add
    .text(0, -height / 2 + 150, gradeLabel, {
      fontFamily: FONT_FAMILY,
      resolution: TEXT_RESOLUTION,
      fontSize: '77px',
      fontStyle: 'bold',
      color: Phaser.Display.Color.IntegerToColor(gradeColor).rgba,
    })
    .setOrigin(0.5);
  container.add(gradeText);

  const starsText = scene.add
    .text(0, -height / 2 + 210, '⭐'.repeat(result.stars) + '☆'.repeat(3 - result.stars), {
      fontFamily: FONT_FAMILY,
      resolution: TEXT_RESOLUTION,
      fontSize: '36px',
    })
    .setOrigin(0.5);
  container.add(starsText);

  const scoreText = scene.add
    .text(0, -height / 2 + 260, `${formatScore(result.score)}점`, {
      fontFamily: FONT_FAMILY,
      resolution: TEXT_RESOLUTION,
      fontSize: '41px',
      fontStyle: 'bold',
      color: '#2b2b2b',
    })
    .setOrigin(0.5);
  container.add(scoreText);

  const statsLines = [
    `정확도 ${formatAccuracy(result.accuracy)}   최고 콤보 ${result.maxCombo}`,
    `Perfect ${result.judgments.perfect}  Great ${result.judgments.great}  Good ${result.judgments.good}  Miss ${result.judgments.miss}`,
  ];
  const statsText = scene.add
    .text(0, -height / 2 + 310, statsLines.join('\n'), {
      fontFamily: FONT_FAMILY,
      resolution: TEXT_RESOLUTION,
      fontSize: '20px',
      color: '#7a6f63',
      align: 'center',
      lineSpacing: 8,
    })
    .setOrigin(0.5);
  container.add(statsText);

  const footer = scene.add
    .text(0, height / 2 - 32, '뮤엘피아노', {
      fontFamily: FONT_FAMILY,
      resolution: TEXT_RESOLUTION,
      fontSize: '18px',
      color: '#b8ada2',
      fontStyle: 'italic',
    })
    .setOrigin(0.5);
  container.add(footer);

  return container;
}
