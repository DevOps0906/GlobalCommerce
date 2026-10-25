import { describe, expect, it } from "vitest";
import { CREDIT_COST, CREDIT_FEATURES, SHORTS_DURATIONS, creditCost, estimateCredits, isCreditFeature } from "../src/credits";
import { readRepoFile } from "./helpers";

/** 01장 4.2절 표 → [{ item, credits: number[], release }] */
function parsePrd42() {
  const prd = readRepoFile("products/01_PRD.md");
  const start = prd.indexOf("### 4.2 크레딧 단가");
  const end = prd.indexOf("\n### ", start + 10);
  return [...prd.slice(start, end).matchAll(/^\| ([^|\n]+?) \| ([\d /]+) \| (R\d) \| [^|\n]+ \|$/gm)].map((m) => ({
    item: m[1] as string,
    credits: (m[2] as string).split("/").map((x) => Number(x.trim())),
    release: m[3] as string,
  }));
}

describe("CREDIT_COST = 01장 4.2절(표 파싱 대조)", () => {
  const rows = parsePrd42();

  it("01장 행 수 = 상수 항목 수, 순서와 문구가 같다", () => {
    expect(rows.length).toBeGreaterThan(10);
    expect(CREDIT_FEATURES.map((f) => CREDIT_COST[f].item)).toEqual(rows.map((r) => r.item));
  });

  it.each(rows.map((r) => [r.item, r] as const))("%s: 단가 · 릴리스", (_item, row) => {
    const feature = CREDIT_FEATURES.find((f) => CREDIT_COST[f].item === row.item);
    expect(feature).toBeDefined();
    if (!feature) return;
    expect(CREDIT_COST[feature].release).toBe(row.release);
    const credits: number | Readonly<Record<number, number>> = CREDIT_COST[feature].credits;
    if (typeof credits === "number") {
      expect([credits]).toEqual(row.credits);
    } else {
      // "숏폼 렌더 15 / 30 / 50초 | 2 / 3 / 4"
      expect(SHORTS_DURATIONS.map((d) => credits[d])).toEqual(row.credits);
      expect(row.item).toContain(SHORTS_DURATIONS.join(" / "));
    }
  });
});

describe("계산", () => {
  it("아마존 상품 1개를 수집부터 상세 조립까지 = 7크레딧(01장 4.2절 본문)", () => {
    expect(
      estimateCredits([
        { feature: "import.amazon", quantity: 1 },
        { feature: "title.generate", quantity: 1 },
        { feature: "image.cutout", quantity: 1 },
        { feature: "image.compose", quantity: 1 },
        { feature: "detail.assemble", quantity: 1 },
      ]),
    ).toBe(7);
  });

  it("숏폼은 길이가 필요하다", () => {
    expect(creditCost("shorts.render", 30)).toBe(3);
    expect(estimateCredits([{ feature: "shorts.render", quantity: 2, durationSec: 50 }])).toBe(8);
    expect(() => creditCost("shorts.render")).toThrow(RangeError);
  });

  it("수량 검증과 키 판별", () => {
    expect(estimateCredits([{ feature: "title.generate", quantity: 50 }])).toBe(50);
    expect(() => estimateCredits([{ feature: "title.generate", quantity: -1 }])).toThrow(RangeError);
    expect(() => estimateCredits([{ feature: "title.generate", quantity: 1.5 }])).toThrow(RangeError);
    expect(isCreditFeature("image.compose")).toBe(true);
    expect(isCreditFeature("toString")).toBe(false);
    expect(isCreditFeature("free_credits")).toBe(false);
  });
});
