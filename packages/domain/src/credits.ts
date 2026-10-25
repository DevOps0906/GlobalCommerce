/**
 * 크레딧 단가 표 `CREDIT_COST`.
 *
 * 정본: products/01_PRD.md 4.2절. 02장 4.2절 · 04장 2.2절의 값과 다르면 01장 값을 쓴다(02장 4.2절 머리말).
 * Route Handler 의 `withCredits({ requestId, feature })`가 이 표의 키로 단가를 읽고, 화면의 예상 크레딧도 같은 값을 쓴다.
 * 워커는 크레딧을 계산하지 않는다(최종 실패 시 payload 의 `credit_ledger_id`로 `refund_credits` 1회).
 */

export type Release = "R1" | "R2" | "R3";

export interface CreditCostEntry {
  /** 1회(1건 · 1개 · 1장 · 1편)당 크레딧 */
  credits: number;
  release: Release;
  /** 01장에서 "제안"으로 표시된 값(O-05, O-09 결정 전) */
  proposal: boolean;
  /** 화면 · 로그용 한 줄 설명 */
  label: string;
}

export const CREDIT_COST = {
  // R1 (01장 4.2절)
  "import.amazon": { credits: 1, release: "R1", proposal: false, label: "아마존 상품 수집 1건" },
  "import.excel": { credits: 0, release: "R1", proposal: false, label: "위탁 엑셀 수집" },
  "title.generate": { credits: 1, release: "R1", proposal: false, label: "AI 상품명 1개" },
  "image.cutout": { credits: 1, release: "R1", proposal: true, label: "누끼 1장" },
  "image.compose": { credits: 2, release: "R1", proposal: true, label: "대표 이미지 합성 1장(다시 만들기 포함, 1회마다)" },
  "detail.assemble": { credits: 2, release: "R1", proposal: true, label: "상세페이지 4단 조립" },
  "detail.rewrite": { credits: 1, release: "R1", proposal: false, label: "블록 AI로 다시 쓰기 1회" },
  "detail.render_market": { credits: 0, release: "R1", proposal: false, label: "상세페이지 확정 · 마켓 규격 변환" },
  upload: { credits: 0, release: "R1", proposal: false, label: "마켓 업로드" },
  export: { credits: 0, release: "R1", proposal: false, label: "엑셀 · ZIP 내보내기" },
  // R2 (O-05 제안)
  "shorts.render.15": { credits: 2, release: "R2", proposal: true, label: "숏폼 렌더 15초" },
  "shorts.render.30": { credits: 3, release: "R2", proposal: true, label: "숏폼 렌더 30초" },
  "shorts.render.50": { credits: 4, release: "R2", proposal: true, label: "숏폼 렌더 50초" },
  "blog.generate": { credits: 2, release: "R2", proposal: true, label: "블로그 원고 1편" },
  "blog.refine": { credits: 1, release: "R2", proposal: true, label: "블로그 AI로 다듬기 1회" },
  "blog.publish": { credits: 0, release: "R2", proposal: false, label: "블로그 발행" },
  "sns.upload": { credits: 0, release: "R2", proposal: false, label: "SNS 업로드" },
  "sns.link_insert": { credits: 0, release: "R2", proposal: false, label: "SNS 링크 삽입" },
  // R3
  "embed.product": { credits: 0, release: "R3", proposal: true, label: "상품 임베딩" },
  "search.hybrid": { credits: 0, release: "R3", proposal: true, label: "하이브리드 검색" },
  "jsonld.build": { credits: 0, release: "R3", proposal: true, label: "JSON-LD 생성" },
} as const satisfies Record<string, CreditCostEntry>;

export type CreditFeature = keyof typeof CREDIT_COST;

export const CREDIT_FEATURES = Object.keys(CREDIT_COST) as CreditFeature[];

export function isCreditFeature(value: unknown): value is CreditFeature {
  return typeof value === "string" && Object.hasOwn(CREDIT_COST, value);
}

export function creditCost(feature: CreditFeature): number {
  return CREDIT_COST[feature].credits;
}

/** 예상 크레딧 합계(화면 버튼의 "예상 N크레딧"). quantity 는 0 이상 정수. */
export function estimateCredits(items: ReadonlyArray<{ feature: CreditFeature; quantity: number }>): number {
  let total = 0;
  for (const { feature, quantity } of items) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new RangeError(`quantity 는 0 이상 정수여야 합니다: ${feature}=${quantity}`);
    }
    total += creditCost(feature) * quantity;
  }
  return total;
}

/** 숏폼 길이(초) → 단가 키(R2). */
export function shortsCreditFeature(durationSec: 15 | 30 | 50): CreditFeature {
  return `shorts.render.${durationSec}` as const;
}
