import { describe, expect, it } from "vitest";
import {
  DETAIL_PREVIEW_WIDTHS,
  IMAGE_MASTERS,
  MARKET_CODES,
  MARKET_SPECS,
  exceedsDetailMaxCount,
  planDetailSplit,
  scaledDetailHeight,
} from "../src/markets";
import { parseSqlInList, readRepoFile } from "./helpers";

describe("쿠팡 규격(MARKET_IMAGE_SPEC.md 2 · 3장, 01장 GC-F-209)", () => {
  const c = MARKET_SPECS.coupang;
  it("대표 1000×1000 JPG 순백 필수, 누끼 기반, 오버레이 금지, 85%", () => {
    expect([c.thumbnail.width, c.thumbnail.height]).toEqual([1000, 1000]);
    expect(c.thumbnail.format).toBe("jpeg");
    expect(c.thumbnail.background).toBe("#FFFFFF");
    expect(c.thumbnail.backgroundRequired).toBe(true);
    expect(c.thumbnail.source).toBe("cutout_on_white");
    expect(c.thumbnail.overlayForbidden).toBe(true);
    expect(c.thumbnail.minProductAreaRatio).toBe(0.85);
    expect(c.thumbnail.maxBytes).toBe(5 * 1024 * 1024);
  });

  it("상세 폭 1000px · 분할 2,800px · 장당 최대 3,000px · 20장 이하", () => {
    expect(c.detail.width).toBe(1000);
    expect(c.detail.splitAt).toBe(2800);
    expect(c.detail.maxHeight).toBe(3000);
    expect(c.detail.maxCount).toBe(20);
    expect(c.detail.gifAllowed).toBe(false);
  });

  it("6,000px 상세 → 3장(각 2,800px 이하)", () => {
    const parts = planDetailSplit("coupang", 6000);
    expect(parts).toEqual([
      { index: 0, top: 0, height: 2800 },
      { index: 1, top: 2800, height: 2800 },
      { index: 2, top: 5600, height: 400 },
    ]);
    expect(parts.every((p) => p.height <= 2800)).toBe(true);
    expect(parts.reduce((s, p) => s + p.height, 0)).toBe(6000);
  });

  it("분할 경계: 2,800 은 1장, 2,801 은 2장", () => {
    expect(planDetailSplit("coupang", 2800)).toHaveLength(1);
    expect(planDetailSplit("coupang", 2801)).toEqual([
      { index: 0, top: 0, height: 2800 },
      { index: 1, top: 2800, height: 1 },
    ]);
    expect(() => planDetailSplit("coupang", 0)).toThrow(RangeError);
    expect(() => planDetailSplit("coupang", 10.5)).toThrow(RangeError);
  });

  it("20장 초과 판정", () => {
    expect(exceedsDetailMaxCount("coupang", planDetailSplit("coupang", 2800 * 20).length)).toBe(false);
    expect(exceedsDetailMaxCount("coupang", planDetailSplit("coupang", 2800 * 20 + 1).length)).toBe(true);
  });
});

describe("스마트스토어 규격", () => {
  const s = MARKET_SPECS.smartstore;
  it("대표 1000×1000, 상세 860px · 4,800px 분할, 장수 제한 없음, 미성년자 필드 필수", () => {
    expect([s.thumbnail.width, s.thumbnail.height]).toEqual([1000, 1000]);
    expect(s.detail.width).toBe(860);
    expect(s.detail.splitAt).toBe(4800);
    expect(s.detail.maxHeight).toBe(5000);
    expect(s.detail.maxCount).toBeNull();
    expect(exceedsDetailMaxCount("smartstore", 999)).toBe(false);
    expect(planDetailSplit("smartstore", 6000).map((p) => p.height)).toEqual([4800, 1200]);
    expect(s.text.minorPurchaseFieldRequired).toBe(true);
  });
});

describe("공통 텍스트 · 마스터 규격", () => {
  it("상품명 50자, 태그 10개, 판매가 10원 단위, 재고 999", () => {
    for (const m of ["coupang", "smartstore"] as const) {
      expect(MARKET_SPECS[m].text).toMatchObject({ titleMaxLength: 50, searchTagsMax: 10, sellPriceUnitKrw: 10, defaultStock: 999 });
    }
  });

  it("마스터: 누끼 2000×2000, 합성 1080×1080, 상세 1200px, 미리보기 390/860", () => {
    expect(IMAGE_MASTERS.cutout).toMatchObject({ width: 2000, height: 2000 });
    expect(IMAGE_MASTERS.composite).toMatchObject({ width: 1080, height: 1080 });
    expect(IMAGE_MASTERS.detailWidth).toBe(1200);
    expect(DETAIL_PREVIEW_WIDTHS).toEqual({ mobile: 390, desktop: 860 });
  });

  it("마스터 1200px → 마켓 폭 축소 높이", () => {
    expect(scaledDetailHeight("coupang", 1200, 7200)).toBe(6000);
    expect(scaledDetailHeight("smartstore", 1200, 1200)).toBe(860);
  });

  it("마켓 코드 = SQL market_accounts_market_check", () => {
    const sql = readRepoFile("products/supabase/monolith/0002_globalcommerce_domain.sql");
    const m = sql.match(/market_accounts_market_check check \(market in \(([^)]*)\)\)/);
    expect(m).not.toBeNull();
    expect(parseSqlInList(m?.[1] ?? "")).toEqual([...MARKET_CODES]);
  });
});
