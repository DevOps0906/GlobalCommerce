/**
 * 공용 요청 바디 zod 스키마(R1 Route Handler 입력).
 *
 * 정본: products/04_API.md 2.1 ~ 2.3절(입력 zod 요약), 1절(입력 상한 · request_id 멱등).
 * 보안 규칙(products/CLAUDE.md 2절 "플랜은 서버에서", GC-D-21): 요청 바디의 plan · role · model · provider 값을 받지 않는다.
 * 모든 객체 스키마는 `.strict()`라 이 필드(그리고 모르는 필드 전부)가 있으면 parse 가 실패한다(→ 400 VALIDATION).
 */
import { z } from "zod";
import { PROCESS_STEP_ORDER } from "./pipelines";

/** 요청 바디에 오면 안 되는 필드. 테스트와 보안 점검(GC-06-034)이 참조한다. */
export const FORBIDDEN_CLIENT_FIELDS = ["plan", "role", "model", "provider"] as const;

const MB = 1024 * 1024;

export const requestIdSchema = z.uuid();
const uuid = z.uuid();
const uuidList = (min: number, max: number) =>
  z
    .array(uuid)
    .min(min)
    .max(max)
    .refine((ids) => new Set(ids).size === ids.length, { message: "중복된 id 가 있습니다" });

// 2.1 소싱 · 상품 --------------------------------------------------------------

export const sourcingAmazonRequestSchema = z
  .object({
    request_id: requestIdSchema,
    /** 한 줄에 하나, 최대 50개. 도메인 판정(GC010)은 packages/net · packages/sourcing 이 행 단위로 한다 */
    urls: z.array(z.string().trim().min(1).max(2048)).min(1).max(50),
  })
  .strict();

export const excelUploadUrlRequestSchema = z
  .object({
    filename: z.string().trim().min(1).max(255),
    bytes: z.number().int().min(1).max(10 * MB),
  })
  .strict();

export const EXCEL_SUPPLIERS = ["ownerclan", "domeggook", "custom"] as const;

export const excelImportRequestSchema = z
  .object({
    request_id: requestIdSchema,
    storage_path: z.string().min(1).max(512),
    supplier: z.enum(EXCEL_SUPPLIERS),
  })
  .strict();

export const excelCommitRequestSchema = z
  .object({
    request_id: requestIdSchema,
    column_mapping: z.record(z.string().max(100), z.string().max(100)),
  })
  .strict();

export const productsProcessRequestSchema = z
  .object({
    request_id: requestIdSchema,
    product_ids: uuidList(1, 100),
    /** 순서는 서버가 PROCESS_STEP_ORDER 로 고정한다. 생략 시 기본 ['title'](04장, 제안) */
    steps: z
      .array(z.enum(PROCESS_STEP_ORDER))
      .min(1)
      .max(PROCESS_STEP_ORDER.length)
      .refine((s) => new Set(s).size === s.length, { message: "중복된 단계가 있습니다" })
      .optional(),
  })
  .strict();

export const productEditSchema = z
  .object({
    product_id: uuid,
    field: z.enum(["title", "cost_usd", "category"]),
    value: z.union([z.string().max(500), z.number().finite().min(0)]),
    base_updated_at: z.iso.datetime({ offset: true }),
  })
  .strict();

export const productEditsRequestSchema = z
  .object({
    request_id: requestIdSchema,
    edits: z.array(productEditSchema).min(1).max(200),
  })
  .strict();

export const productsBulkRequestSchema = z
  .object({
    ids: uuidList(1, 500),
    action: z.enum(["archive", "restore", "delete"]),
  })
  .strict();

export const productActivityRequestSchema = z.object({ body: z.string().trim().min(1).max(1000) }).strict();

export const bannedWordCreateRequestSchema = z
  .object({
    word: z.string().trim().min(1).max(40),
    category: z.enum(["cosmetics", "health_food"]),
    severity: z.enum(["fail", "warn"]),
    replacement: z.string().trim().min(1).max(40).optional(),
  })
  .strict();

// 2.2 이미지 · 상세페이지 --------------------------------------------------------

export const cutoutRequestSchema = z.object({ request_id: requestIdSchema, source_image_id: uuid }).strict();

export const composeRequestSchema = z
  .object({
    request_id: requestIdSchema,
    cutout_image_id: uuid,
    background_prompt: z.string().trim().min(1).max(300),
    product_ratio: z.number().min(0.5).max(0.85).default(0.7),
    /** 한글 문구는 이미지 모델이 아니라 Sharp 후합성(GC-D-09) */
    overlay_text: z.string().trim().max(20).optional(),
  })
  .strict();

export const detailPageCreateRequestSchema = z.object({ request_id: requestIdSchema, product_id: uuid }).strict();

export const detailPageFinalizeRequestSchema = z.object({ request_id: requestIdSchema }).strict();

export const blockRewriteRequestSchema = z
  .object({ request_id: requestIdSchema, instruction: z.string().trim().max(200).optional() })
  .strict();

export const previewLinkRequestSchema = z.object({ ttl_days: z.number().int().min(1).max(7).optional() }).strict();

// 2.3 업로드 · 내보내기 · 실행 기록 ------------------------------------------------

export const uploadsRequestSchema = z
  .object({
    request_id: requestIdSchema,
    product_ids: uuidList(1, 100),
    market_account_ids: uuidList(1, 30),
  })
  .strict();

export const retryFailedRequestSchema = z.object({ request_id: requestIdSchema }).strict();

export const exportsRequestSchema = z
  .object({
    request_id: requestIdSchema,
    kind: z.enum(["excel", "zip"]),
    market: z.enum(["coupang", "smartstore", "playauto"]),
    product_ids: uuidList(1, 500),
  })
  .strict();

export const runRetryRequestSchema = z
  .object({
    request_id: requestIdSchema,
    /** 'start' 또는 단계 키(pipelines.ts) */
    from_step: z.string().regex(/^[a-z_]{1,64}$/),
  })
  .strict();

/** 테스트 · 보안 점검용 목록. 새 요청 스키마를 만들면 여기에 넣는다. */
export const REQUEST_SCHEMAS = {
  sourcingAmazon: sourcingAmazonRequestSchema,
  excelUploadUrl: excelUploadUrlRequestSchema,
  excelImport: excelImportRequestSchema,
  excelCommit: excelCommitRequestSchema,
  productsProcess: productsProcessRequestSchema,
  productEdits: productEditsRequestSchema,
  productsBulk: productsBulkRequestSchema,
  productActivity: productActivityRequestSchema,
  bannedWordCreate: bannedWordCreateRequestSchema,
  cutout: cutoutRequestSchema,
  compose: composeRequestSchema,
  detailPageCreate: detailPageCreateRequestSchema,
  detailPageFinalize: detailPageFinalizeRequestSchema,
  blockRewrite: blockRewriteRequestSchema,
  previewLink: previewLinkRequestSchema,
  uploads: uploadsRequestSchema,
  retryFailed: retryFailedRequestSchema,
  exports: exportsRequestSchema,
  runRetry: runRetryRequestSchema,
} as const;

export type SourcingAmazonRequest = z.output<typeof sourcingAmazonRequestSchema>;
export type ProductsProcessRequest = z.output<typeof productsProcessRequestSchema>;
export type ProductEditsRequest = z.output<typeof productEditsRequestSchema>;
export type ComposeRequest = z.output<typeof composeRequestSchema>;
export type UploadsRequest = z.output<typeof uploadsRequestSchema>;
export type ExportsRequest = z.output<typeof exportsRequestSchema>;
export type RunRetryRequest = z.output<typeof runRetryRequestSchema>;
