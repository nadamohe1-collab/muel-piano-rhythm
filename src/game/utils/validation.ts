import { NAME_RULES } from '../config/constants';

export interface NameValidationResult {
  valid: boolean;
  normalized: string;
  reason?: string;
}

/**
 * 이름 규칙:
 * - 2자 이상 8자 이하
 * - 한글, 영문, 숫자만 허용 (단일 공백 허용)
 * - 앞뒤 공백 자동 제거, 공백만 입력 불가, 줄바꿈 불가
 * - 이모지 및 부적절한 특수문자 제한
 */
export function validateStudentName(rawInput: string): NameValidationResult {
  if (/[\r\n]/.test(rawInput)) {
    return { valid: false, normalized: '', reason: '줄바꿈은 사용할 수 없어요.' };
  }

  // 앞뒤 공백 제거 + 내부 연속 공백은 단일 공백으로 축소
  const trimmed = rawInput.trim().replace(/\s+/g, ' ');

  if (trimmed.length === 0) {
    return { valid: false, normalized: '', reason: '이름을 입력해 주세요.' };
  }

  if (trimmed.length < NAME_RULES.minLength) {
    return { valid: false, normalized: trimmed, reason: `이름은 ${NAME_RULES.minLength}자 이상이어야 해요.` };
  }

  if (trimmed.length > NAME_RULES.maxLength) {
    return { valid: false, normalized: trimmed, reason: `이름은 ${NAME_RULES.maxLength}자 이하여야 해요.` };
  }

  // 한글(자모 포함), 영문, 숫자, 단일 공백만 허용
  const allowedPattern = /^[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9 ]+$/;
  if (!allowedPattern.test(trimmed)) {
    return { valid: false, normalized: trimmed, reason: '한글, 영문, 숫자만 사용할 수 있어요.' };
  }

  return { valid: true, normalized: trimmed };
}

/** 랭킹/최근이름 비교용 정규화: 앞뒤 공백 제거 + 소문자 변환 */
export function normalizeNameForComparison(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
