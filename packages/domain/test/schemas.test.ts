import { describe, expect, it } from "vitest";
import { FORBIDDEN_CLIENT_FIELDS, REQUEST_SCHEMAS, composeRequestSchema, productEditsRequestSchema, productsProcessRequestSchema } from "../src/schemas";

const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";
const U3 = "33333333-3333-4333-8333-333333333333";

/** 스키마마다 통과해야 하는 최소 바디 */
const VALID: Record<keyof typeof REQUEST_SCHEMAS, Record<string, unknown>> = {
  sourcingAmazon: { request_id: U1, urls: ["https://www.amazon.com/dp/B001G7QR5A"] },
  excelUploadUrl: { filename: "ownerclan.xlsx", bytes: 1024 },
  excelImport: { request_id: U1, storage_path: "org/globalcommerce/imports/a.xlsx", supplier: "ownerclan" },
  excelCommit: { request_id: U1, column_mapping: { 상품명: "title_original" } },
  productsProcess: { request_id: U1, product_ids: [U2], steps: ["title", "cutout"] },
  productEdits: { request_id: U1, edits: [{ product_id: U2, field: "title", value: "새 상품명", base_updated_at: "2026-10-25T10:00:00+09:00" }] },
  productsBulk: { ids: [U2], action: "archive" },
  productActivity: { body: "메모" },
  bannedWordCreate: { word: "여드름 치료", category: "cosmetics", severity: "fail", replacement: "피부 고민 케어" },
  cutout: { request_id: U1, source_image_id: U2 },
  compose: { request_id: U1, cutout_image_id: U2, background_prompt: "warm kitchen table, morning light" },
  detailPageCreate: { request_id: U1, product_id: U2 },
  detailPageFinalize: { request_id: U1 },
  blockRewrite: { request_id: U1, instruction: "더 짧게" },
  previewLink: { ttl_days: 7 },
  uploads: { request_id: U1, product_ids: [U2], market_account_ids: [U3] },
  retryFailed: { request_id: U1 },
  exports: { request_id: U1, kind: "zip", market: "coupang", product_ids: [U2] },
  runRetry: { request_id: U1, from_step: "start" },
};

const schemaEntries = Object.entries(REQUEST_SCHEMAS) as Array<[keyof typeof REQUEST_SCHEMAS, (typeof REQUEST_SCHEMAS)[keyof typeof REQUEST_SCHEMAS]]>;

describe("요청 스키마는 plan · role · model · provider 를 받지 않는다", () => {
  it("모든 요청 스키마에 유효 샘플이 있다", () => {
    expect(Object.keys(VALID).sort()).toEqual(Object.keys(REQUEST_SCHEMAS).sort());
  });

  it.each(schemaEntries)("%s: 유효 바디 통과", (name, schema) => {
    expect(schema.safeParse(VALID[name]).success).toBe(true);
  });

  for (const field of FORBIDDEN_CLIENT_FIELDS) {
    it.each(schemaEntries)(`%s: ${field} 필드가 있으면 실패`, (name, schema) => {
      const value = field === "plan" ? "enterprise" : field === "role" ? "owner" : field === "model" ? "gpt-4o" : "openai";
      const result = schema.safeParse({ ...VALID[name], [field]: value });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.code === "unrecognized_keys")).toBe(true);
      }
    });
  }

  it("중첩 객체(편집 항목)도 strict", () => {
    const body = { request_id: U1, edits: [{ product_id: U2, field: "title", value: "x", base_updated_at: "2026-10-25T10:00:00Z", role: "admin" }] };
    expect(productEditsRequestSchema.safeParse(body).success).toBe(false);
  });
});

describe("입력 상한 · 기본값", () => {
  it("가공 요청: 상품 1..100, 중복 금지, 단계 중복 금지", () => {
    expect(productsProcessRequestSchema.safeParse({ request_id: U1, product_ids: [] }).success).toBe(false);
    expect(productsProcessRequestSchema.safeParse({ request_id: U1, product_ids: [U2, U2] }).success).toBe(false);
    expect(productsProcessRequestSchema.safeParse({ request_id: U1, product_ids: [U2], steps: ["title", "title"] }).success).toBe(false);
    expect(productsProcessRequestSchema.safeParse({ request_id: "not-uuid", product_ids: [U2] }).success).toBe(false);
  });

  it("아마존 URL 50개 상한", () => {
    const urls = Array.from({ length: 51 }, (_, i) => `https://www.amazon.com/dp/B00000000${i % 10}`);
    expect(REQUEST_SCHEMAS.sourcingAmazon.safeParse({ request_id: U1, urls }).success).toBe(false);
    expect(REQUEST_SCHEMAS.sourcingAmazon.safeParse({ request_id: U1, urls: urls.slice(0, 50) }).success).toBe(true);
  });

  it("합성: 제품 비율 기본 0.7, 범위 0.5..0.85, 문구 20자", () => {
    const parsed = composeRequestSchema.parse(VALID.compose);
    expect(parsed.product_ratio).toBe(0.7);
    expect(composeRequestSchema.safeParse({ ...VALID.compose, product_ratio: 0.9 }).success).toBe(false);
    expect(composeRequestSchema.safeParse({ ...VALID.compose, overlay_text: "가".repeat(21) }).success).toBe(false);
  });

  it("엑셀 10MB 상한", () => {
    expect(REQUEST_SCHEMAS.excelUploadUrl.safeParse({ filename: "a.xlsx", bytes: 10 * 1024 * 1024 + 1 }).success).toBe(false);
  });
});
