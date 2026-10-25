import type { ErrorCode } from "@gc/domain";

/**
 * 오류 코드 → 사용자 문구. 이 파일이 유일한 위치다(products/CLAUDE.md 4절 오류 · 5절 문구).
 * 정본 코드: products/00_DECISIONS.md 5.5절. 문구는 "무슨 일이 일어났나 + 해결책" 한 쌍이다.
 */
export interface ErrorCopy {
  message: string;
  /** 해결 안내(버튼 · 링크 문구가 아니라 한 줄 설명) */
  fix: string;
}

type GcCopyCode = Extract<ErrorCode, `GC${string}` | "CR001">;

export const ERROR_COPY: Readonly<Record<GcCopyCode, ErrorCopy>> = {
  GC001: { message: "지금 상태에서는 이 작업을 할 수 없습니다.", fix: "화면을 새로고침해 최신 상태를 확인한 뒤 다시 시도해 주세요." },
  GC002: { message: "플랜의 상품 수 한도에 도달했습니다.", fix: "안 쓰는 상품을 정리하거나 플랜을 올려 주세요." },
  GC003: { message: "마켓 계정 슬롯이 가득 찼습니다.", fix: "추가 슬롯을 구매하거나 쓰지 않는 마켓 계정을 연결 해제해 주세요." },
  GC004: { message: "금지어가 포함되어 있어 업로드할 수 없습니다.", fix: "표시된 문구를 수정한 뒤 다시 검사해 주세요." },
  GC005: { message: "확인하지 않은 주의 항목이 있습니다.", fix: "주의 항목을 검토하고 확인 표시를 한 뒤 진행해 주세요." },
  GC006: { message: "배송·반품 템플릿이 규칙에 맞지 않습니다.", fix: "청약철회 기간 등 표시된 항목을 규칙에 맞게 고쳐 주세요." },
  GC007: { message: "현재 플랜에서 쓸 수 없는 기능입니다.", fix: "플랜·결제 화면에서 이 기능이 포함된 플랜을 확인해 주세요." },
  GC008: { message: "동시 실행 한도를 넘어 대기열에 넣었습니다.", fix: "앞선 작업이 끝나면 자동으로 시작됩니다. 실행 기록에서 진행을 확인해 주세요." },
  GC009: { message: "마켓 계정 키를 확인하지 못했습니다.", fix: "설정의 마켓 계정에서 키를 다시 입력하고 연결을 확인해 주세요." },
  GC010: { message: "허용되지 않은 주소입니다.", fix: "지원하는 마켓의 상품 주소인지 확인한 뒤 다시 붙여 넣어 주세요." },
  CR001: { message: "크레딧이 부족합니다.", fix: "플랜·결제에서 크레딧을 충전한 뒤 다시 시도해 주세요." },
};

const FALLBACK: ErrorCopy = {
  message: "요청을 처리하지 못했습니다.",
  fix: "잠시 후 다시 시도해 주세요. 계속되면 설정의 문의 경로로 알려 주세요.",
};

/** 알 수 없는 코드는 일반 문구로 돌려준다(코드 · 서버 메시지를 화면에 노출하지 않음). */
export function errorCopy(code: string | null | undefined): ErrorCopy {
  if (code && Object.hasOwn(ERROR_COPY, code)) return ERROR_COPY[code as GcCopyCode];
  return FALLBACK;
}
