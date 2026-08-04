/** 점수를 천 단위 콤마와 함께 표시 */
export function formatScore(score: number): string {
  return Math.round(score).toLocaleString('ko-KR');
}

/** 정확도를 소수점 첫째 자리까지 표시 (예: 97.3%) */
export function formatAccuracy(accuracy: number): string {
  return `${accuracy.toFixed(1)}%`;
}

/** 초 단위 시간을 분:초로 표시 (예: 1:05) */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** epoch ms를 'YYYY.MM.DD' 형식으로 표시 */
export function formatDate(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}.${m}.${day}`;
}
