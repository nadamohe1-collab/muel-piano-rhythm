import * as Phaser from 'phaser';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { formatScore, formatAccuracy, formatDate } from '../utils/formatting';
import type { RankingEntry } from '../types/ranking';

/** 곡·난이도별 상위 5명 랭킹 테이블을 그린다 */
export function createRankingTable(
  scene: Phaser.Scene,
  x: number,
  y: number,
  entries: RankingEntry[],
  width = 700,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const rowHeight = 56;
  const headerHeight = 44;
  const height = headerHeight + rowHeight * 5 + 20;

  const bg = scene.add.graphics();
  bg.fillStyle(THEME.surface, 1);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
  container.add(bg);

  const headerText = scene.add
    .text(0, -height / 2 + headerHeight / 2, '순위       이름          점수       정확도       등급       날짜', {
      fontFamily: FONT_FAMILY,
      resolution: TEXT_RESOLUTION,
      fontSize: '18px',
      color: '#b8ada2',
    })
    .setOrigin(0.5);
  container.add(headerText);

  if (entries.length === 0) {
    const emptyText = scene.add
      .text(0, 20, '아직 기록이 없어요.\n첫 번째 도전자가 되어보세요!', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '24px',
        color: '#7a6f63',
        align: 'center',
      })
      .setOrigin(0.5);
    container.add(emptyText);
    return container;
  }

  entries.slice(0, 5).forEach((entry, index) => {
    const rowY = -height / 2 + headerHeight + rowHeight * index + rowHeight / 2 + 10;

    if (index % 2 === 0) {
      const rowBg = scene.add.graphics();
      rowBg.fillStyle(THEME.backgroundAlt, 1);
      rowBg.fillRoundedRect(-width / 2 + 12, rowY - rowHeight / 2 + 4, width - 24, rowHeight - 8, 12);
      container.add(rowBg);
    }

    const rankColor = index === 0 ? Phaser.Display.Color.IntegerToColor(THEME.accent).rgba : '#2b2b2b';
    const rankLabel = index === 0 ? '1위 👑' : `${index + 1}위`;

    const rowText = scene.add
      .text(-width / 2 + 36, rowY, rankLabel, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '22px',
        fontStyle: 'bold',
        color: rankColor,
      })
      .setOrigin(0, 0.5);
    container.add(rowText);

    const nameText = scene.add
      .text(-width / 2 + 150, rowY, entry.studentName, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '22px',
        color: '#2b2b2b',
      })
      .setOrigin(0, 0.5);
    container.add(nameText);

    const scoreText = scene.add
      .text(20, rowY, formatScore(entry.score), {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '20px',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);
    container.add(scoreText);

    const accText = scene.add
      .text(width / 2 - 220, rowY, formatAccuracy(entry.accuracy), {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '19px',
        color: '#7a6f63',
      })
      .setOrigin(0.5);
    container.add(accText);

    const gradeText = scene.add
      .text(width / 2 - 130, rowY, entry.grade, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#8a6f57',
      })
      .setOrigin(0.5);
    container.add(gradeText);

    const dateText = scene.add
      .text(width / 2 - 50, rowY, formatDate(entry.achievedAt), {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '17px',
        color: '#b8ada2',
      })
      .setOrigin(0.5);
    container.add(dateText);
  });

  return container;
}
