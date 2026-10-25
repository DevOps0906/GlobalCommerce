import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  DEFAULT_FEATURES,
  PLAN_CODES,
  PLANS,
  UNLIMITED,
  getLimit,
  isFeatureEnabled,
  isUnlimited,
  isMarketApiAllowed,
  parseFeatures,
  planDisplayName,
  type PlanCode,
} from "../src/plans";
import { readRepoFile } from "./helpers";

describe("누락 키 기본값 = SQL 기본값(R1 마이그레이션 파싱 대조)", () => {
  const sql = readRepoFile("supabase/migrations/20261025000002_gc_domain_r1.sql");

  it("gc_limit(org, key, 기본값) 호출의 기본값과 같다", () => {
    const calls = [...sql.matchAll(/gc_limit\([^,()]+, '(\w+)', (-?\d+)\)/g)].map((m) => [m[1] as string, Number(m[2])] as const);
    const keys = new Set(calls.map(([k]) => k));
    expect([...keys].sort()).toEqual(["concurrency", "market_slots", "products"]);
    for (const [key, def] of calls) {
      expect(DEFAULT_FEATURES[key as "products" | "market_slots" | "concurrency"], key).toBe(def);
    }
  });

  it("gc_flag 는 키가 없으면 false, 쓰는 키의 기본값도 false", () => {
    expect(sql).toMatch(/function public\.gc_flag[\s\S]*?coalesce\(nullif\(public\.gc_features\(p_org_id\) ->> p_key, ''\)::boolean, false\)/);
    const flags = [...sql.matchAll(/gc_flag\([^,()]+, '(\w+)'\)/g)].map((m) => m[1] as string);
    expect(flags.length).toBeGreaterThan(0);
    for (const key of flags) expect(DEFAULT_FEATURES[key as "excel_export" | "zip_export"], key).toBe(false);
    for (const key of ["workflow_canvas", "blog", "sns", "search"] as const) expect(DEFAULT_FEATURES[key]).toBe(false);
  });

  it("market_api 키가 없으면 SQL 이 거부 → 기본값 []", () => {
    expect(sql).toContain("coalesce(public.gc_features(new.org_id) -> 'market_api' ? new.market, false)");
    expect(DEFAULT_FEATURES.market_api).toEqual([]);
  });
});

describe("parseFeatures — 누락 키 기본값", () => {
  it("null · undefined · {} 는 전부 DEFAULT_FEATURES", () => {
    for (const input of [null, undefined, {}]) {
      expect(parseFeatures(input)).toEqual({
        products: 0,
        market_slots: 1,
        concurrency: 1,
        excel_export: false,
        zip_export: false,
        market_api: [],
        image_quality: "draft",
        shorts_per_month: 0,
        workflow_canvas: false,
        blog: false,
        sns: false,
        search: false,
      });
    }
  });

  it("일부 키만 있으면 나머지는 SQL 기본값", () => {
    const f = parseFeatures({ products: 2000, workflow_canvas: true });
    expect(f.products).toBe(2000);
    expect(f.workflow_canvas).toBe(true);
    expect(f.market_slots).toBe(1);
    expect(f.concurrency).toBe(1);
    expect(f.shorts_per_month).toBe(0);
    expect(f.excel_export).toBe(false);
    expect(f.zip_export).toBe(false);
    expect(f.market_api).toEqual([]);
    expect(f.blog).toBe(false);
    expect(f.sns).toBe(false);
    expect(f.search).toBe(false);
    expect(f.image_quality).toBe("draft");
    expect(DEFAULT_FEATURES.products).toBe(0);
  });

  it("-1 은 무제한(SQL gc_limit 과 같음), -2 는 거부", () => {
    const f = parseFeatures({ products: -1, market_slots: -1, concurrency: -1, shorts_per_month: -1 });
    for (const key of ["products", "market_slots", "concurrency", "shorts_per_month"] as const) {
      expect(getLimit(f, key)).toBe(UNLIMITED);
      expect(isUnlimited(getLimit(f, key))).toBe(true);
    }
    expect(isUnlimited(getLimit(PLANS.enterprise.features, "products"))).toBe(false);
    expect(() => parseFeatures({ products: -2 })).toThrow(ZodError);
  });

  it("모르는 키는 버린다", () => {
    const f = parseFeatures({ products: 1, future_key: 123 });
    expect(f).not.toHaveProperty("future_key");
  });

  it("모르는 enum 값은 전체 실패가 아니라 항목 제거 · 기본값", () => {
    expect(parseFeatures({ market_api: ["coupang", "gmarket"] }).market_api).toEqual(["coupang"]);
    expect(parseFeatures({ market_api: ["gmarket"] }).market_api).toEqual([]);
    expect(parseFeatures({ image_quality: "hyper" }).image_quality).toBe("draft");
    expect(parseFeatures({ image_quality: "pro" }).image_quality).toBe("pro");
  });

  it("있는 키의 타입이 틀리면 조용히 넘기지 않고 ZodError", () => {
    expect(() => parseFeatures({ products: "30" })).toThrow(ZodError);
    expect(() => parseFeatures({ products: 1.5 })).toThrow(ZodError);
    expect(() => parseFeatures({ excel_export: "true" })).toThrow(ZodError);
    expect(() => parseFeatures({ market_api: "coupang" })).toThrow(ZodError);
    expect(() => parseFeatures({ image_quality: 3 })).toThrow(ZodError);
  });

  it("기본값 배열을 공유하지 않는다(호출 간 변조 방지)", () => {
    const a = parseFeatures({});
    a.market_api.push("coupang");
    expect(parseFeatures({}).market_api).toEqual([]);
  });
});

describe("플랜 값 = GC-D-04", () => {
  // products/00_DECISIONS.md GC-D-04 그대로 옮긴 기대값
  const expected: Record<PlanCode, { name: string; price: number; monthly: number; signup: number; slots: number; products: number; concurrency: number; shorts: number }> = {
    free: { name: "무료", price: 0, monthly: 15, signup: 30, slots: 1, products: 30, concurrency: 1, shorts: 0 },
    starter: { name: "기본", price: 29000, monthly: 150, signup: 0, slots: 3, products: 300, concurrency: 1, shorts: 30 },
    pro: { name: "프로", price: 69000, monthly: 350, signup: 0, slots: 10, products: 2000, concurrency: 2, shorts: 100 },
    enterprise: { name: "엔터", price: 149000, monthly: 900, signup: 0, slots: 30, products: 10000, concurrency: 5, shorts: 300 },
  };

  it.each(PLAN_CODES)("%s", (code) => {
    const plan = PLANS[code];
    const e = expected[code];
    expect(plan.name).toBe(e.name);
    expect(planDisplayName(code)).toBe(e.name);
    expect(plan.priceKrw).toBe(e.price);
    expect(plan.monthlyCredits).toBe(e.monthly);
    expect(plan.signupCredits).toBe(e.signup);
    expect(getLimit(plan.features, "market_slots")).toBe(e.slots);
    expect(getLimit(plan.features, "products")).toBe(e.products);
    expect(getLimit(plan.features, "concurrency")).toBe(e.concurrency);
    expect(getLimit(plan.features, "shorts_per_month")).toBe(e.shorts);
  });

  it("엑셀 내보내기는 starter 이상(GC-F-303), API 업로드는 전 플랜 두 마켓(O-12 기본안)", () => {
    expect(isFeatureEnabled(PLANS.free.features, "excel_export")).toBe(false);
    for (const code of ["starter", "pro", "enterprise"] as const) {
      expect(isFeatureEnabled(PLANS[code].features, "excel_export")).toBe(true);
    }
    for (const code of PLAN_CODES) {
      expect(isMarketApiAllowed(PLANS[code].features, "coupang")).toBe(true);
      expect(isMarketApiAllowed(PLANS[code].features, "smartstore")).toBe(true);
      expect(isMarketApiAllowed(PLANS[code].features, "gmarket")).toBe(false);
    }
  });

  it("모르는 플랜 코드는 표시명에 코드를 그대로", () => {
    expect(planDisplayName("platinum")).toBe("platinum");
  });
});

describe("플랜 값 = seed.sql (정본 시드 파싱 대조)", () => {
  const seed = readRepoFile("products/supabase/monolith/seed.sql");
  const rowRe =
    /\('globalcommerce', '(\w+)', '([^']+)', (\d+), 'month', (\d+), (\d+), (true|false),\s*'(\{[^']*\})',\s*(true|false), (true|false), (\d+)\)/g;
  const rows = [...seed.matchAll(rowRe)].map((m) => ({
    code: m[1] as string,
    name: m[2] as string,
    price: Number(m[3]),
    monthly: Number(m[4]),
    signup: Number(m[5]),
    carryOver: m[6] === "true",
    features: JSON.parse(m[7] as string) as unknown,
    isDefault: m[8] === "true",
    isActive: m[9] === "true",
    sortOrder: Number(m[10]),
  }));

  it("시드에 플랜 4행", () => {
    expect(rows.map((r) => r.code)).toEqual([...PLAN_CODES]);
  });

  it.each(PLAN_CODES)("%s 행이 PLANS 와 같다", (code) => {
    const row = rows.find((r) => r.code === code);
    expect(row).toBeDefined();
    if (!row) return;
    const plan = PLANS[code];
    expect(row.name).toBe(plan.name);
    expect(row.price).toBe(plan.priceKrw);
    expect(row.monthly).toBe(plan.monthlyCredits);
    expect(row.signup).toBe(plan.signupCredits);
    expect(row.carryOver).toBe(false);
    expect(row.isDefault).toBe(plan.isDefault);
    expect(row.isActive).toBe(plan.isActive);
    expect(row.sortOrder).toBe(plan.sortOrder);
    // features: 시드 원문 그대로가 상수와 같고, 키 집합도 파서와 같다
    expect(row.features).toEqual(plan.features);
    expect(parseFeatures(row.features)).toEqual(plan.features);
    expect(Object.keys(row.features as object).sort()).toEqual(Object.keys(DEFAULT_FEATURES).sort());
  });
});
