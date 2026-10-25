/**
 * 오류 코드 → HTTP 상태.
 *
 * 정본: products/00_DECISIONS.md 5.5절(GC001~GC010, 코어 CR001), products/04_API.md 8장(앱 코드).
 * 사용자 문구는 apps/web/lib/copy/errors.ts(GC-06-004)가 정한다. 여기에는 의미(개발자용)만 둔다.
 */

export const GC_ERRORS = {
  GC001: { http: 409, meaning: "허용되지 않는 상태 전이" },
  GC002: { http: 403, meaning: "상품 수 한도 초과" },
  GC003: { http: 403, meaning: "마켓 계정 슬롯 한도 초과(추가 슬롯 단계로 안내)" },
  GC004: { http: 422, meaning: "금지어 FAIL 상세페이지 · 상품명으로 업로드 · 내보내기 · 확정" },
  GC005: { http: 422, meaning: "확인하지 않은 WARN 이 있음" },
  GC006: { http: 422, meaning: "배송 · 반품 템플릿 규칙 위반(청약철회 7일 미만 등)" },
  GC007: { http: 403, meaning: "플랜에 없는 기능(또는 월 숏폼 편수 소진)" },
  GC008: { http: 202, meaning: "동시 실행 한도 초과(대기열로 넣음, 요청은 성공)" },
  GC009: { http: 422, meaning: "마켓 계정 키 검증 실패 또는 만료" },
  GC010: { http: 400, meaning: "허용 도메인이 아닌 URL" },
  CR001: { http: 402, meaning: "크레딧 부족(코어)" },
} as const;

export const APP_ERRORS = {
  VALIDATION: { http: 400, meaning: "zod 검증 실패" },
  VERSION_CONFLICT: { http: 409, meaning: "편집 기준 버전 불일치" },
  RATE_LIMITED: { http: 429, meaning: "rate_limit_hit 초과" },
  AI_UNAVAILABLE: { http: 503, meaning: "체인의 모든 제공자 실패(선차감 환불 완료)" },
  MARKET_UNAVAILABLE: { http: 502, meaning: "마켓 API 5xx · 타임아웃" },
  ADDON_PRICE_UNSET: { http: 404, meaning: "추가 슬롯 가격 미정(O-03)" },
  /** R2 */
  GRAPH_INVALID: { http: 422, meaning: "워크플로우 그래프 저장 검증 실패" },
} as const;

export type GcErrorCode = keyof typeof GC_ERRORS;
export type AppErrorCode = keyof typeof APP_ERRORS;
export type ErrorCode = GcErrorCode | AppErrorCode;

export const GC_ERROR_CODES = Object.keys(GC_ERRORS) as GcErrorCode[];

export function isGcErrorCode(value: unknown): value is GcErrorCode {
  return typeof value === "string" && Object.hasOwn(GC_ERRORS, value);
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (Object.hasOwn(GC_ERRORS, value) || Object.hasOwn(APP_ERRORS, value));
}

export function httpStatusOf(code: ErrorCode): number {
  return Object.hasOwn(GC_ERRORS, code) ? GC_ERRORS[code as GcErrorCode].http : APP_ERRORS[code as AppErrorCode].http;
}

/** GC008 은 오류가 아니라 안내(04장 8절): 응답은 성공 봉투 + notice. */
export function isNoticeCode(code: ErrorCode): boolean {
  return code === "GC008";
}
