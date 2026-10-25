import { describe, expect, it } from "vitest";
import {
  DEFAULT_DUTY_RATE,
  DEFAULT_SHIPPING_KRW,
  applyRate,
  calcMargin,
  convertToKrw,
  formatKRW,
  isValidSellPrice,
} from "../src/margin";

describe("원가 환산(원 단위 반올림)", () => {
  it("01장 GC-F-101 예: $39.99 × 1,384.50 = ₩55,366", () => {
    expect(convertToKrw(39.99, 1384.5)).toBe(55366);
    expect(formatKRW(convertToKrw(39.99, 1384.5))).toBe("₩55,366");
  });

  it("반올림 경계: x.5 는 올림, x.4999 는 내림(부동소수 오차 없음)", () => {
    expect(convertToKrw(0.01, 50)).toBe(1); // 0.5 → 1
    expect(convertToKrw(0.01, 49.9999)).toBe(0); // 0.499999 → 0
    expect(convertToKrw(1.05, 1000.5)).toBe(1051); // 1050.525 → 1051
    expect(convertToKrw(0.1, 0.2 * 10000)).toBe(200);
  });

  it("0 과 음수 · NaN", () => {
    expect(convertToKrw(0, 1384.5)).toBe(0);
    expect(() => convertToKrw(-1, 1384.5)).toThrow(RangeError);
    expect(() => convertToKrw(1, Number.NaN)).toThrow(RangeError);
    expect(() => convertToKrw(Number.POSITIVE_INFINITY, 1)).toThrow(RangeError);
  });

  it("비율 적용", () => {
    expect(applyRate(20192, 0.1)).toBe(2019);
    expect(applyRate(15, 0.1)).toBe(2); // 1.5 → 2
    expect(applyRate(14, 0.1)).toBe(1); // 1.4 → 1
    expect(() => applyRate(10.5, 0.1)).toThrow(RangeError);
  });
});

describe("마진 = (판매가 − 원가 환산 − 관부가세 − 배송비) / 판매가", () => {
  it("MARKET_REGISTER_FORM.md 4장 예시: $14.99 × 1,347, 판매가 38,900 → 총원가 25,211, 35.1%", () => {
    const r = calcMargin({ sourcePrice: 14.99, fxRateKrw: 1347, sellPriceKrw: 38900 });
    expect(r.costKrw).toBe(20192);
    expect(r.dutyKrw).toBe(2019);
    expect(r.shippingKrw).toBe(DEFAULT_SHIPPING_KRW);
    expect(r.totalCostKrw).toBe(25211);
    expect(r.profitKrw).toBe(13689);
    expect(r.marginPct).toBe(35.1);
    expect(r.marginRate).toBeCloseTo(13689 / 38900, 12);
  });

  it("기본값: 관부가세 10%, 배송비 3,000원", () => {
    expect(DEFAULT_DUTY_RATE).toBe(0.1);
    expect(DEFAULT_SHIPPING_KRW).toBe(3000);
  });

  it("이익 0(손익분기) → 0%", () => {
    // 원가 10,000 + 관부가세 1,000 + 배송 3,000 = 14,000
    const r = calcMargin({ sourcePrice: 10, fxRateKrw: 1000, sellPriceKrw: 14000 });
    expect(r.profitKrw).toBe(0);
    expect(r.marginRate).toBe(0);
    expect(r.marginPct).toBe(0);
  });

  it("25% 경계(GC-F-106 필터): 정확히 25% 와 1원 모자람", () => {
    // 총원가 15,000(원가 12,000 · 관부가세 0 · 배송 3,000), 판매가 20,000 → 25.0%
    const exact = calcMargin({ sourcePrice: 12, fxRateKrw: 1000, sellPriceKrw: 20000, dutyRate: 0 });
    expect(exact.marginRate).toBe(0.25);
    expect(exact.marginPct).toBe(25);
    const below = calcMargin({ sourcePrice: 12, fxRateKrw: 1000, sellPriceKrw: 19990, dutyRate: 0 });
    expect(below.marginRate).toBeLessThan(0.25);
    expect(below.marginPct).toBe(24.9);
  });

  it("손해(음수 마진)는 내림으로 더 보수적으로 표시", () => {
    const r = calcMargin({ sourcePrice: 10, fxRateKrw: 1000, sellPriceKrw: 10000 });
    expect(r.profitKrw).toBe(-4000);
    expect(r.marginPct).toBe(-40);
    const r2 = calcMargin({ sourcePrice: 10, fxRateKrw: 1000, sellPriceKrw: 13990 });
    expect(r2.profitKrw).toBe(-10);
    expect(r2.marginPct).toBe(-0.1);
  });

  it("판매가 0 이면 마진율 null", () => {
    const r = calcMargin({ sourcePrice: 1, fxRateKrw: 1000, sellPriceKrw: 0 });
    expect(r.marginRate).toBeNull();
    expect(r.marginPct).toBeNull();
  });

  it("관부가세 · 배송비 사용자 수정", () => {
    const r = calcMargin({ sourcePrice: 100, fxRateKrw: 1300, sellPriceKrw: 200000, dutyRate: 0.18, shippingKrw: 0 });
    expect(r.costKrw).toBe(130000);
    expect(r.dutyKrw).toBe(23400);
    expect(r.totalCostKrw).toBe(153400);
  });

  it("판매가는 10원 단위만(DB CHECK sell_price_krw % 10 = 0)", () => {
    expect(() => calcMargin({ sourcePrice: 1, fxRateKrw: 1000, sellPriceKrw: 38905 })).toThrow(RangeError);
    expect(() => calcMargin({ sourcePrice: 1, fxRateKrw: 1000, sellPriceKrw: 100, shippingKrw: -1 })).toThrow(RangeError);
  });
});

describe("판매가 10원 단위(01장 GC-F-305)", () => {
  it("유효성", () => {
    expect(isValidSellPrice(38900)).toBe(true);
    expect(isValidSellPrice(0)).toBe(true);
    expect(isValidSellPrice(38905)).toBe(false);
    expect(isValidSellPrice(-10)).toBe(false);
    expect(isValidSellPrice(10.0000001)).toBe(false);
  });
});

describe("formatKRW(세 자리 콤마)", () => {
  it("기호 · 단위 · 음수 · 반올림", () => {
    expect(formatKRW(29000)).toBe("₩29,000");
    expect(formatKRW(149000, "unit")).toBe("149,000원");
    expect(formatKRW(0)).toBe("₩0");
    expect(formatKRW(1234567)).toBe("₩1,234,567");
    expect(formatKRW(-4000)).toBe("-₩4,000");
    expect(formatKRW(999.5, "unit")).toBe("1,000원");
    expect(() => formatKRW(Number.NaN)).toThrow(RangeError);
  });
});
