/**
 * 플랜 4종과 `plans.features` 파서.
 *
 * 정본: products/00_DECISIONS.md GC-D-04, products/supabase/monolith/seed.sql(features 키 이름 정본),
 *       products/01_PRD.md 4.1 · 4.4절.
 * 이 파일의 값은 화면 표시 · 예상 계산용이다. 한도의 최종 집행은 DB 트리거 · RPC(GC002, GC003, GC007, GC008)이고,
 * 서버 판정은 `session_context` + `entitled_plan_code` + DB `plans.features`만 쓴다(products/CLAUDE.md 2절).
 * 요청 바디 · 쿠키의 plan 값을 이 모듈에 넣어 판정하지 않는다.
 */
import { z } from "zod";

export const PLAN_CODES = ["free", "starter", "pro", "enterprise"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

/** R1 API 업로드 대상 마켓(GC-D-03). */
export const MARKET_API_CODES = ["coupang", "smartstore"] as const;
export type MarketApiCode = (typeof MARKET_API_CODES)[number];

export const IMAGE_QUALITIES = ["draft", "standard", "pro", "ultra"] as const;
export type ImageQuality = (typeof IMAGE_QUALITIES)[number];

/**
 * 누락 키 기본값 = free 플랜 값(가장 좁은 권한). 키가 빠진 features 로 권한이 넓어지지 않게 한다(실패 시 닫힘).
 * seed.sql 의 free 행과 같다.
 */
export const DEFAULT_FEATURES = {
  products: 30,
  market_slots: 1,
  concurrency: 1,
  excel_export: false,
  zip_export: true,
  market_api: ["coupang", "smartstore"] as MarketApiCode[],
  image_quality: "draft" as ImageQuality,
  shorts_per_month: 0,
  workflow_canvas: false,
  blog: false,
  sns: false,
  search: false,
} as const;

const nonNegativeInt = z.number().int().min(0);

export const planFeaturesSchema = z.object({
  products: nonNegativeInt.default(DEFAULT_FEATURES.products),
  market_slots: nonNegativeInt.default(DEFAULT_FEATURES.market_slots),
  concurrency: z.number().int().min(1).default(DEFAULT_FEATURES.concurrency),
  excel_export: z.boolean().default(DEFAULT_FEATURES.excel_export),
  zip_export: z.boolean().default(DEFAULT_FEATURES.zip_export),
  market_api: z.array(z.enum(MARKET_API_CODES)).default(() => [...DEFAULT_FEATURES.market_api]),
  image_quality: z.enum(IMAGE_QUALITIES).default(DEFAULT_FEATURES.image_quality),
  /** R2(O-05 제안값) */
  shorts_per_month: nonNegativeInt.default(DEFAULT_FEATURES.shorts_per_month),
  /** R2 */
  workflow_canvas: z.boolean().default(DEFAULT_FEATURES.workflow_canvas),
  /** R2. 01장 4.4절의 `blog_publish` 는 이 키로 읽는다(seed.sql 머리 주석). */
  blog: z.boolean().default(DEFAULT_FEATURES.blog),
  /** R2. 01장 4.4절의 `sns_publish` 는 이 키로 읽는다. */
  sns: z.boolean().default(DEFAULT_FEATURES.sns),
  /** R3. 01장 4.4절의 `hybrid_search` 는 이 키로 읽는다. */
  search: z.boolean().default(DEFAULT_FEATURES.search),
});
// 알 수 없는 키는 버린다(z.object 기본 strip). DB 에 새 키가 먼저 생겨도 파싱이 깨지지 않게 한다.

export type PlanFeatures = z.output<typeof planFeaturesSchema>;

/**
 * `plans.features`(jsonb) → 타입 있는 features.
 * - null · undefined · 빈 객체 → 전부 기본값(free).
 * - 누락 키 → 기본값.
 * - 있는 키의 타입이 틀리면 ZodError(조용히 기본값으로 바꾸지 않는다: DB 오염을 숨기지 않기 위해).
 */
export function parseFeatures(json: unknown): PlanFeatures {
  return planFeaturesSchema.parse(json ?? {});
}

export type LimitKey = "products" | "market_slots" | "concurrency" | "shorts_per_month";
export type BooleanFeatureKey = "excel_export" | "zip_export" | "workflow_canvas" | "blog" | "sns" | "search";

/** 수치 한도. `market_slots`는 플랜 기본값이며 추가 슬롯(`slot_addons`)은 DB 가 더한다. */
export function getLimit(features: PlanFeatures, key: LimitKey): number {
  return features[key];
}

export function isFeatureEnabled(features: PlanFeatures, key: BooleanFeatureKey): boolean {
  return features[key];
}

export function isMarketApiAllowed(features: PlanFeatures, market: string): boolean {
  return (features.market_api as readonly string[]).includes(market);
}

export interface PlanDefinition {
  code: PlanCode;
  /** 화면 표기 */
  name: string;
  /** 월 가격(원, VAT 포함) */
  priceKrw: number;
  monthlyCredits: number;
  signupCredits: number;
  /** 크레딧 이월 없음(코어 plans.carry_over=false) */
  carryOver: false;
  isDefault: boolean;
  /** enterprise 는 초기 미판매(O-14, seed.sql is_active false) */
  isActive: boolean;
  sortOrder: number;
  features: PlanFeatures;
}

/** GC-D-04 + seed.sql. 값을 바꾸려면 GC-D-04 변경(사용자 승인)과 seed.sql 을 함께 바꾼다. */
export const PLANS: Readonly<Record<PlanCode, PlanDefinition>> = {
  free: {
    code: "free",
    name: "무료",
    priceKrw: 0,
    monthlyCredits: 15,
    signupCredits: 30,
    carryOver: false,
    isDefault: true,
    isActive: true,
    sortOrder: 0,
    features: {
      products: 30,
      market_slots: 1,
      concurrency: 1,
      excel_export: false,
      zip_export: true,
      market_api: ["coupang", "smartstore"],
      image_quality: "draft",
      shorts_per_month: 0,
      workflow_canvas: false,
      blog: false,
      sns: false,
      search: false,
    },
  },
  starter: {
    code: "starter",
    name: "기본",
    priceKrw: 29000,
    monthlyCredits: 150,
    signupCredits: 0,
    carryOver: false,
    isDefault: false,
    isActive: true,
    sortOrder: 1,
    features: {
      products: 300,
      market_slots: 3,
      concurrency: 1,
      excel_export: true,
      zip_export: true,
      market_api: ["coupang", "smartstore"],
      image_quality: "standard",
      shorts_per_month: 30,
      workflow_canvas: false,
      blog: true,
      sns: true,
      search: true,
    },
  },
  pro: {
    code: "pro",
    name: "프로",
    priceKrw: 69000,
    monthlyCredits: 350,
    signupCredits: 0,
    carryOver: false,
    isDefault: false,
    isActive: true,
    sortOrder: 2,
    features: {
      products: 2000,
      market_slots: 10,
      concurrency: 2,
      excel_export: true,
      zip_export: true,
      market_api: ["coupang", "smartstore"],
      image_quality: "pro",
      shorts_per_month: 100,
      workflow_canvas: true,
      blog: true,
      sns: true,
      search: true,
    },
  },
  enterprise: {
    code: "enterprise",
    name: "엔터",
    priceKrw: 149000,
    monthlyCredits: 900,
    signupCredits: 0,
    carryOver: false,
    isDefault: false,
    isActive: false,
    sortOrder: 3,
    features: {
      products: 10000,
      market_slots: 30,
      concurrency: 5,
      excel_export: true,
      zip_export: true,
      market_api: ["coupang", "smartstore"],
      image_quality: "ultra",
      shorts_per_month: 300,
      workflow_canvas: true,
      blog: true,
      sns: true,
      search: true,
    },
  },
};

export function isPlanCode(value: unknown): value is PlanCode {
  return typeof value === "string" && (PLAN_CODES as readonly string[]).includes(value);
}

/** 화면 표기(무료/기본/프로/엔터). 모르는 코드는 코드 그대로 돌려준다. */
export function planDisplayName(code: string): string {
  return isPlanCode(code) ? PLANS[code].name : code;
}
