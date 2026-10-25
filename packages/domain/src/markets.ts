/**
 * 마켓 규격(R1: 쿠팡 · 스마트스토어).
 *
 * 출처: docs/spec/MARKET_IMAGE_SPEC.md 2장(대표 이미지), 3장(상세 이미지), 7장(TypeScript 규격 정의);
 *       docs/spec/MARKET_REGISTER_FORM.md 3 · 4장(상품명 · 태그 · 판매가 · 재고);
 *       products/01_PRD.md GC-F-201(상품명 50자), GC-F-204(누끼 마스터 2000×2000), GC-F-205(합성 1080×1080, 쿠팡 대표 금지),
 *       GC-F-207(미리보기 폭 390/860), GC-F-209(쿠팡 1000px · 2,800px 분할 · 20장, 스마트스토어 860px · 4,800px 분할).
 * 미확인: 위 수치는 내부 스펙 기준이며 쿠팡 Wing · 네이버 커머스 현행 가이드와 대조하지 않았다(01장 GC-F-209).
 * 렌더 실행(Sharp · Puppeteer)은 packages/render · 워커가 하고, 여기는 규격 값과 순수 계산만 둔다.
 */

/** DB `market_accounts.market` · `market_images.market` CHECK 값(0002). R1 은 앞의 둘만 쓴다. */
export const MARKET_CODES = ["coupang", "smartstore", "gmarket", "auction", "street11", "lotteon"] as const;
export type MarketCode = (typeof MARKET_CODES)[number];

export const R1_MARKETS = ["coupang", "smartstore"] as const;
export type R1Market = (typeof R1_MARKETS)[number];

export const MARKET_LABELS: Readonly<Record<R1Market, string>> = {
  coupang: "쿠팡",
  smartstore: "스마트스토어",
};

const MB = 1024 * 1024;

export interface ThumbnailSpec {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  format: "jpeg";
  quality: number;
  /** 배경. 쿠팡은 순백 필수, 스마트스토어는 권장 */
  background: "#FFFFFF";
  backgroundRequired: boolean;
  maxBytes: number;
  maxCount: number;
  /** 대표 이미지 원천: 쿠팡은 누끼를 흰 배경에 올린 것만(합성 이미지 금지, GC-F-205) */
  source: "cutout_on_white" | "composite_or_cutout";
  /** 상품이 차지해야 하는 최소 면적 비율(쿠팡 85%) */
  minProductAreaRatio: number | null;
  /** 텍스트 · 로고 · 프로모션 오버레이 금지 */
  overlayForbidden: boolean;
}

export interface DetailImageSpec {
  width: number;
  /** 장당 최대 세로 */
  maxHeight: number;
  /** 이 높이를 넘으면 잘라 여러 장으로 */
  splitAt: number;
  format: "jpeg";
  quality: number;
  maxBytes: number;
  /** 최대 장수(null = 제한 없음) */
  maxCount: number | null;
  gifAllowed: boolean;
}

export interface TextSpec {
  /** 노출 상품명 최대 글자수(GC-F-201 생성 규칙. 마켓 자체 한도는 미확인) */
  titleMaxLength: number;
  /** 검색 태그 최대 개수 */
  searchTagsMax: number;
  /** 판매가 단위(원) */
  sellPriceUnitKrw: number;
  /** 구매대행 기본 재고 */
  defaultStock: number;
  /** 스마트스토어 미성년자 구매 가능 필드 필수 */
  minorPurchaseFieldRequired: boolean;
}

export interface MarketSpec {
  market: R1Market;
  thumbnail: ThumbnailSpec;
  detail: DetailImageSpec;
  text: TextSpec;
}

export const MARKET_SPECS: Readonly<Record<R1Market, MarketSpec>> = {
  coupang: {
    market: "coupang",
    thumbnail: {
      width: 1000,
      height: 1000,
      minWidth: 1000,
      minHeight: 1000,
      format: "jpeg",
      quality: 92,
      background: "#FFFFFF",
      backgroundRequired: true,
      maxBytes: 5 * MB,
      maxCount: 10,
      source: "cutout_on_white",
      minProductAreaRatio: 0.85,
      overlayForbidden: true,
    },
    detail: {
      width: 1000,
      maxHeight: 3000,
      splitAt: 2800,
      format: "jpeg",
      quality: 88,
      maxBytes: 20 * MB,
      maxCount: 20,
      gifAllowed: false,
    },
    text: {
      titleMaxLength: 50,
      searchTagsMax: 10,
      sellPriceUnitKrw: 10,
      defaultStock: 999,
      minorPurchaseFieldRequired: false,
    },
  },
  smartstore: {
    market: "smartstore",
    thumbnail: {
      width: 1000,
      height: 1000,
      minWidth: 500,
      minHeight: 500,
      format: "jpeg",
      quality: 90,
      background: "#FFFFFF",
      backgroundRequired: false,
      maxBytes: 10 * MB,
      maxCount: 10,
      source: "composite_or_cutout",
      minProductAreaRatio: null,
      overlayForbidden: false,
    },
    detail: {
      width: 860,
      maxHeight: 5000,
      splitAt: 4800,
      format: "jpeg",
      quality: 88,
      maxBytes: 20 * MB,
      maxCount: null,
      gifAllowed: true,
    },
    text: {
      titleMaxLength: 50,
      searchTagsMax: 10,
      sellPriceUnitKrw: 10,
      defaultStock: 999,
      minorPurchaseFieldRequired: true,
    },
  },
};

/** 마스터 이미지 규격. 마켓 변환은 항상 마스터에서 파생한다(MARKET_IMAGE_SPEC.md 1장). */
export const IMAGE_MASTERS = {
  /** 누끼 투명 PNG(GC-F-204) */
  cutout: { width: 2000, height: 2000, format: "png" },
  /** 대표 합성 이미지(GC-D-09, GC-F-205). 스마트스토어 대표 · 추가 이미지용, 쿠팡 대표 금지 */
  composite: { width: 1080, height: 1080, format: "png" },
  /** 상세페이지 렌더 마스터 폭(MARKET_IMAGE_SPEC.md 1장) */
  detailWidth: 1200,
} as const;

/** 상세페이지 에디터 미리보기 폭(GC-F-207, 제안) */
export const DETAIL_PREVIEW_WIDTHS = { mobile: 390, desktop: 860 } as const;

export interface SplitPart {
  index: number;
  top: number;
  height: number;
}

/**
 * 마켓 폭으로 맞춘 상세 이미지 높이 → 분할 조각. splitAt 이하이면 1장.
 * 예: 쿠팡 6,000px → 2,800 · 2,800 · 400 (3장).
 */
export function planDetailSplit(market: R1Market, scaledHeight: number): SplitPart[] {
  if (!Number.isSafeInteger(scaledHeight) || scaledHeight <= 0) {
    throw new RangeError(`높이는 양의 정수(px)여야 합니다: ${scaledHeight}`);
  }
  const { splitAt } = MARKET_SPECS[market].detail;
  const parts: SplitPart[] = [];
  for (let top = 0, index = 0; top < scaledHeight; top += splitAt, index += 1) {
    parts.push({ index, top, height: Math.min(splitAt, scaledHeight - top) });
  }
  return parts;
}

/** 마스터(폭 sourceWidth)를 마켓 상세 폭으로 줄였을 때의 높이(px, 반올림). */
export function scaledDetailHeight(market: R1Market, sourceWidth: number, sourceHeight: number): number {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new RangeError("원본 크기는 양수여야 합니다");
  }
  return Math.round((sourceHeight * MARKET_SPECS[market].detail.width) / sourceWidth);
}

/** 조각 수가 마켓 최대 장수를 넘는지. */
export function exceedsDetailMaxCount(market: R1Market, partCount: number): boolean {
  const { maxCount } = MARKET_SPECS[market].detail;
  return maxCount !== null && partCount > maxCount;
}
