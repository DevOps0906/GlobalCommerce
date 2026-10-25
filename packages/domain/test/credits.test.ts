import { describe, expect, it } from "vitest";
import { CREDIT_COST, CREDIT_FEATURES, creditCost, estimateCredits, isCreditFeature, shortsCreditFeature } from "../src/credits";
import { JOB_TYPE_NAMES } from "../src/jobs";

describe("CREDIT_COST = 01장 4.2절", () => {
  it("R1 단가", () => {
    expect(creditCost("import.amazon")).toBe(1);
    expect(creditCost("import.excel")).toBe(0);
    expect(creditCost("title.generate")).toBe(1);
    expect(creditCost("image.cutout")).toBe(1);
    expect(creditCost("image.compose")).toBe(2);
    expect(creditCost("detail.assemble")).toBe(2);
    expect(creditCost("detail.rewrite")).toBe(1);
    expect(creditCost("detail.render_market")).toBe(0);
    expect(creditCost("upload")).toBe(0);
    expect(creditCost("export")).toBe(0);
  });

  it("R2 · R3 단가와 릴리스 표시", () => {
    expect([15, 30, 50].map((s) => creditCost(shortsCreditFeature(s as 15 | 30 | 50)))).toEqual([2, 3, 4]);
    expect(creditCost("blog.generate")).toBe(2);
    expect(creditCost("blog.refine")).toBe(1);
    for (const key of ["shorts.render.15", "blog.generate", "blog.publish", "sns.upload", "sns.link_insert"] as const) {
      expect(CREDIT_COST[key].release).toBe("R2");
    }
    for (const key of ["embed.product", "search.hybrid", "jsonld.build"] as const) {
      expect(CREDIT_COST[key].release).toBe("R3");
      expect(creditCost(key)).toBe(0);
    }
  });

  it("아마존 상품 1개를 수집부터 상세 조립까지 = 7크레딧(01장 4.2절)", () => {
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

  it("수량 검증과 키 판별", () => {
    expect(estimateCredits([{ feature: "title.generate", quantity: 50 }])).toBe(50);
    expect(() => estimateCredits([{ feature: "title.generate", quantity: -1 }])).toThrow(RangeError);
    expect(() => estimateCredits([{ feature: "title.generate", quantity: 1.5 }])).toThrow(RangeError);
    expect(isCreditFeature("image.compose")).toBe(true);
    expect(isCreditFeature("toString")).toBe(false);
    expect(isCreditFeature("free_credits")).toBe(false);
  });

  it("모든 단가는 0 이상 정수", () => {
    for (const f of CREDIT_FEATURES) {
      expect(Number.isInteger(CREDIT_COST[f].credits) && CREDIT_COST[f].credits >= 0).toBe(true);
    }
  });

  it("잡 이름과 같은 단가 키는 실제 잡 타입이다(오타 방지)", () => {
    const jobLike = CREDIT_FEATURES.filter((f) => !["upload", "export", "detail.rewrite", "blog.refine", "search.hybrid"].includes(f) && !f.startsWith("shorts.render."));
    for (const f of jobLike) expect(JOB_TYPE_NAMES).toContain(f);
  });
});
