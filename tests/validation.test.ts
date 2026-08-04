import { describe, it, expect } from 'vitest';
import { validateStudentName, normalizeNameForComparison } from '../src/game/utils/validation';

describe('validateStudentName', () => {
  it('2자 이상 8자 이하 한글 이름을 허용한다', () => {
    expect(validateStudentName('민석').valid).toBe(true);
    expect(validateStudentName('가나다라마바사아').valid).toBe(true);
  });

  it('1자 이름은 거부한다', () => {
    expect(validateStudentName('가').valid).toBe(false);
  });

  it('9자 이상 이름은 거부한다', () => {
    expect(validateStudentName('가나다라마바사아자').valid).toBe(false);
  });

  it('영문/숫자 조합을 허용한다', () => {
    expect(validateStudentName('Minseok1').valid).toBe(true);
  });

  it('단일 공백을 허용한다', () => {
    const result = validateStudentName('김 민');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('김 민');
  });

  it('앞뒤 공백은 자동 제거된다', () => {
    const result = validateStudentName('  민석  ');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('민석');
  });

  it('공백만 입력하면 거부한다', () => {
    expect(validateStudentName('   ').valid).toBe(false);
  });

  it('줄바꿈이 포함되면 거부한다', () => {
    expect(validateStudentName('민석\n').valid).toBe(false);
  });

  it('이모지나 특수문자는 거부한다', () => {
    expect(validateStudentName('민석😀').valid).toBe(false);
    expect(validateStudentName('민석!!').valid).toBe(false);
  });
});

describe('normalizeNameForComparison', () => {
  it('공백과 대소문자를 정규화한다', () => {
    expect(normalizeNameForComparison('  Minseok  ')).toBe('minseok');
    expect(normalizeNameForComparison('MinSeok')).toBe(normalizeNameForComparison('minseok'));
  });

  it('연속 공백을 단일 공백으로 축소한다', () => {
    expect(normalizeNameForComparison('김   민')).toBe('김 민');
  });
});
