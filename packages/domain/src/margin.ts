/**
 * 원가 환산 · 마진 계산 · 원화 표시.
 *
 * 정본: products/01_PRD.md GC-F-101(마진 = (판매가 − 원가 환산 − 예상 관부가세 − 배송비) / 판매가,
 *       관부가세 기본 10%, 배송비 기본 3,000원, $39.99 × 1,384.50 = ₩55,366 원 단위 반올림),
 *       GC-F-305 · docs/spec/MARKET_REGISTER_FORM.md 4장(판매가 10원 단위, 계산 예시),
 *       0002_globalcommerce_domain.sql `products_sell_price_check`(sell_price_krw % 10 = 0).
 *
 * 규칙: 금액은 정수(원). 외화 × 환율은 정수 연산(BigInt)으로 한 번만 반올림한다(부동소수 누적 오차 방지).
 * 환율은 수출입은행 값(`fx_rates`)만 넣는다. LLM 추정 환율 금지(GC-D-16).
 */

/** 관부가세 기본 비율(10%) */
export const DEFAULT_DUTY_RATE = 0.1;
/** 해외 배송비 기본(원) */
export const DEFAULT_SHIPPING_KRW = 3000;
/** 판매가 단위(원) */
export const SELL_PRICE_UNIT_KRW = 10;

const SOURCE_PRICE_SCALE = 100n; // 원가: 소수 2자리(numeric(12,2))
const FX_RATE_SCALE = 10_000n; // 환율: 소수 4자리(numeric(14,4))
const RATE_SCALE = 10_000n; // 비율: 0.01% 단위

function assertFiniteNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} 는 0 이상의 유한한 수여야 합니다: ${value}`);
  }
}

function assertNonNegativeInt(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} 는 0 이상 정수(원)여야 합니다: ${value}`);
  }
}

function toScaled(value: number, scale: bigint): bigint {
  return BigInt(Math.round(value * Number(scale)));
}

/** 양수 분수 num/den 의 반올림(0.5 올림). */
function roundHalfUp(num: bigint, den: bigint): bigint {
  return (num * 2n + den) / (den * 2n);
}

/** 외화 원가 × 환율 → 원(원 단위 반올림). 예: 39.99 × 1384.50 = 55,366. */
export function convertToKrw(sourcePrice: number, fxRateKrw: number): number {
  assertFiniteNonNegative("sourcePrice", sourcePrice);
  assertFiniteNonNegative("fxRateKrw", fxRateKrw);
  const num = toScaled(sourcePrice, SOURCE_PRICE_SCALE) * toScaled(fxRateKrw, FX_RATE_SCALE);
  return Number(roundHalfUp(num, SOURCE_PRICE_SCALE * FX_RATE_SCALE));
}

/** 정수 원 × 비율 → 원(원 단위 반올림). */
export function applyRate(amountKrw: number, rate: number): number {
  assertNonNegativeInt("amountKrw", amountKrw);
  assertFiniteNonNegative("rate", rate);
  return Number(roundHalfUp(BigInt(amountKrw) * toScaled(rate, RATE_SCALE), RATE_SCALE));
}

/** 10원 단위 반올림(5원 올림). */
export function roundTo10(amountKrw: number): number {
  assertFiniteNonNegative("amountKrw", amountKrw);
  return Math.round(amountKrw / SELL_PRICE_UNIT_KRW) * SELL_PRICE_UNIT_KRW;
}

/** 10원 단위 올림(목표 마진을 밑돌지 않게 판매가를 제안할 때). */
export function ceilTo10(amountKrw: number): number {
  assertFiniteNonNegative("amountKrw", amountKrw);
  return Math.ceil(amountKrw / SELL_PRICE_UNIT_KRW) * SELL_PRICE_UNIT_KRW;
}

/** DB CHECK 와 같은 판매가 규칙: 0 이상 정수, 10원 단위. */
export function isValidSellPrice(amountKrw: number): boolean {
  return Number.isSafeInteger(amountKrw) && amountKrw >= 0 && amountKrw % SELL_PRICE_UNIT_KRW === 0;
}

export interface MarginInput {
  /** 외화 원가(예: USD 39.99) */
  sourcePrice: number;
  /** 원/외화 1단위 매매기준율(예: 1384.50). JPY 처럼 100단위 고시는 호출 쪽에서 1단위로 바꿔 넣는다 */
  fxRateKrw: number;
  /** 판매가(원, 10원 단위) */
  sellPriceKrw: number;
  /** 관부가세 비율, 기본 0.1 */
  dutyRate?: number;
  /** 배송비(원), 기본 3,000 */
  shippingKrw?: number;
}

export interface MarginResult {
  /** 원가 환산(원) */
  costKrw: number;
  /** 예상 관부가세(원) = 원가 환산 × 관부가세 비율 */
  dutyKrw: number;
  shippingKrw: number;
  /** 총 원가 = 원가 환산 + 관부가세 + 배송비 */
  totalCostKrw: number;
  sellPriceKrw: number;
  /** 이익 = 판매가 − 총 원가(음수 가능) */
  profitKrw: number;
  /** 마진율(비율, 판매가 0 이면 null) */
  marginRate: number | null;
  /** 표시용 % (소수 1자리, 내림 — 마진을 부풀려 보이지 않게). 판매가 0 이면 null */
  marginPct: number | null;
}

export function calcMargin(input: MarginInput): MarginResult {
  const dutyRate = input.dutyRate ?? DEFAULT_DUTY_RATE;
  const shippingKrw = input.shippingKrw ?? DEFAULT_SHIPPING_KRW;
  assertNonNegativeInt("sellPriceKrw", input.sellPriceKrw);
  assertNonNegativeInt("shippingKrw", shippingKrw);
  if (!isValidSellPrice(input.sellPriceKrw)) {
    throw new RangeError(`판매가는 10원 단위여야 합니다: ${input.sellPriceKrw}`);
  }

  const costKrw = convertToKrw(input.sourcePrice, input.fxRateKrw);
  const dutyKrw = applyRate(costKrw, dutyRate);
  const totalCostKrw = costKrw + dutyKrw + shippingKrw;
  const profitKrw = input.sellPriceKrw - totalCostKrw;

  if (input.sellPriceKrw === 0) {
    return { costKrw, dutyKrw, shippingKrw, totalCostKrw, sellPriceKrw: 0, profitKrw, marginRate: null, marginPct: null };
  }
  const marginRate = profitKrw / input.sellPriceKrw;
  // 정수 연산으로 0.1% 단위 내림: floor(profit * 1000 / sell) / 10
  const permille = Math.floor((profitKrw * 1000) / input.sellPriceKrw);
  return {
    costKrw,
    dutyKrw,
    shippingKrw,
    totalCostKrw,
    sellPriceKrw: input.sellPriceKrw,
    profitKrw,
    marginRate,
    marginPct: permille / 10,
  };
}

/**
 * 목표 마진율을 만족하는 최소 판매가(10원 단위 올림).
 * targetMarginRate 는 0 이상 1 미만(예: 0.25 = 25%).
 */
export function suggestSellPrice(totalCostKrw: number, targetMarginRate: number): number {
  assertNonNegativeInt("totalCostKrw", totalCostKrw);
  if (!Number.isFinite(targetMarginRate) || targetMarginRate < 0 || targetMarginRate >= 1) {
    throw new RangeError(`목표 마진율은 0 이상 1 미만이어야 합니다: ${targetMarginRate}`);
  }
  // 판매가 ≥ 총원가 / (1 − m) 를 정수 연산으로: ceil(total * S / (S − mS))
  const m = toScaled(targetMarginRate, RATE_SCALE);
  const den = RATE_SCALE - m;
  const num = BigInt(totalCostKrw) * RATE_SCALE;
  const minPrice = (num + den - 1n) / den;
  return ceilTo10(Number(minPrice));
}

const krwNumberFormat = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

/**
 * 원화 표시(세 자리 콤마). 모든 화면 금액은 이 함수를 쓴다(products/CLAUDE.md 5절).
 * style 'symbol' → "₩55,366", 'unit' → "55,366원". 소수는 반올림.
 */
export function formatKRW(amount: number, style: "symbol" | "unit" = "symbol"): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`금액이 유한한 수가 아닙니다: ${amount}`);
  }
  const rounded = Math.round(amount);
  const body = krwNumberFormat.format(Math.abs(rounded));
  const sign = rounded < 0 ? "-" : "";
  return style === "symbol" ? `${sign}₩${body}` : `${sign}${body}원`;
}
