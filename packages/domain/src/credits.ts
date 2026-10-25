/**
 * 크레딧 단가 표 `CREDIT_COST`.
 *
 * 정본: products/01_PRD.md 4.2절(O-09). 항목은 01장 표의 행과 1:1 이고 `item`은 01장 "작업" 열 문구 그대로다.
 * 테스트(test/credits.test.ts)가 01장 표를 읽어 행 · 단가 · 릴리스를 대조한다. 01장을 바꾸면 이 표도 바꾼다.
 * Route Handler 의 `withCredits({ requestId, feature })`가 이 표의 키로 단가를 읽고, 화면의 예상 크레딧도 같은 값을 쓴다.
 * 워커는 크레딧을 계산하지 않는다(최종 실패 시 payload 의 `credit_ledger_id`로 `refund_credits` 1회).
 */

export type Release = "R1" | "R2" | "R3";

/** 숏폼 길이(초). 01장 "숏폼 렌더 15 / 30 / 50초" */
export const SHORTS_DURATIONS = [15, 30, 50] as const;
export type ShortsDuration = (typeof SHORTS_DURATIONS)[number];

export interface CreditCostEntry {
  /** 01장 4.2절 "작업" 열 문구 */
  item: string;
  /** 1회당 크레딧. 숏폼은 길이별 */
  credits: number | Readonly<Record<ShortsDuration, number>>;
  release: Release;
}

export const CREDIT_COST = {
  "import.amazon": { item: "아마존 상품 수집 1건", credits: 1, release: "R1" },
  "import.excel": { item: "위탁 엑셀 수집", credits: 0, release: "R1" },
  "title.generate": { item: "AI 상품명 1개(번역 + 키워드)", credits: 1, release: "R1" },
  "image.cutout": { item: "누끼 1장", credits: 1, release: "R1" },
  "image.compose": { item: "대표 이미지 합성 1장(다시 만들기 포함, 1회마다)", credits: 2, release: "R1" },
  "detail.assemble": { item: "상세페이지 4단 조립(초안 문구 + 금지어 판정)", credits: 2, release: "R1" },
  "detail.rewrite": { item: "블록 \"AI로 다시 쓰기\" 1회", credits: 1, release: "R1" },
  "detail.render_market": { item: "상세페이지 확정·마켓 규격 변환", credits: 0, release: "R1" },
  upload_export: { item: "마켓 업로드, 엑셀·ZIP 내보내기", credits: 0, release: "R1" },
  "shorts.render": { item: "숏폼 렌더 15 / 30 / 50초", credits: { 15: 2, 30: 3, 50: 4 }, release: "R2" },
  "blog.generate": { item: "블로그 원고 1편", credits: 2, release: "R2" },
  "blog.refine": { item: "블로그 \"AI로 다듬기\" 1회", credits: 1, release: "R2" },
  publish_distribute: { item: "블로그 발행, SNS 업로드·링크 삽입", credits: 0, release: "R2" },
  "embed.product": { item: "상품 임베딩", credits: 0, release: "R3" },
  search_jsonld: { item: "하이브리드 검색, JSON-LD 생성", credits: 0, release: "R3" },
} as const satisfies Record<string, CreditCostEntry>;

export type CreditFeature = keyof typeof CREDIT_COST;

export const CREDIT_FEATURES = Object.keys(CREDIT_COST) as CreditFeature[];

export function isCreditFeature(value: unknown): value is CreditFeature {
  return typeof value === "string" && Object.hasOwn(CREDIT_COST, value);
}

/** 1회 단가. 숏폼은 durationSec 이 필요하다. */
export function creditCost(feature: CreditFeature, durationSec?: ShortsDuration): number {
  const credits: CreditCostEntry["credits"] = CREDIT_COST[feature].credits;
  if (typeof credits === "number") return credits;
  if (durationSec === undefined) {
    throw new RangeError(`${feature} 는 길이(15/30/50초)가 필요합니다`);
  }
  return credits[durationSec];
}

/** 예상 크레딧 합계(화면 버튼의 "예상 N크레딧"). quantity 는 0 이상 정수. */
export function estimateCredits(
  items: ReadonlyArray<{ feature: CreditFeature; quantity: number; durationSec?: ShortsDuration }>,
): number {
  let total = 0;
  for (const { feature, quantity, durationSec } of items) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new RangeError(`quantity 는 0 이상 정수여야 합니다: ${feature}=${quantity}`);
    }
    total += creditCost(feature, durationSec) * quantity;
  }
  return total;
}
