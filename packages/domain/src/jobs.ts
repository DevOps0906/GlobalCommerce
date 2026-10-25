/**
 * 큐 · 잡 타입 상수와 R1 잡 페이로드 스키마.
 *
 * 정본: products/00_DECISIONS.md 5.4절(큐 `gc.<영역>` · job_type), products/04_API.md 4장(페이로드 계약).
 * 페이로드에 자격증명 · 키를 넣지 않는다(`market_account_id`만). 스키마는 `.strict()`라 모르는 필드(예: `access_key`)가
 * 섞이면 거부된다 — 런타임(GC-06-007)이 필드를 더하려면 이 스키마를 함께 고친다.
 */
import { z } from "zod";
import type { Release } from "./credits";

export const QUEUES = ["gc.import", "gc.ai", "gc.detail", "gc.upload", "gc.export", "gc.cron", "gc.workflow", "gc.content", "gc.search"] as const;
export type Queue = (typeof QUEUES)[number];

export const JOB_TYPES = {
  "import.amazon": { queue: "gc.import", release: "R1" },
  "import.excel": { queue: "gc.import", release: "R1" },
  "title.generate": { queue: "gc.ai", release: "R1" },
  "image.cutout": { queue: "gc.ai", release: "R1" },
  "image.compose": { queue: "gc.ai", release: "R1" },
  "detail.assemble": { queue: "gc.detail", release: "R1" },
  "detail.render_market": { queue: "gc.detail", release: "R1" },
  "upload.coupang": { queue: "gc.upload", release: "R1" },
  "upload.smartstore": { queue: "gc.upload", release: "R1" },
  "upload.poll_status": { queue: "gc.upload", release: "R1" },
  "export.excel": { queue: "gc.export", release: "R1" },
  "export.zip": { queue: "gc.export", release: "R1" },
  "fx.fetch": { queue: "gc.cron", release: "R1" },
  "trend.fetch": { queue: "gc.cron", release: "R1" },
  "export.expire": { queue: "gc.cron", release: "R1" },
  "workflow.step": { queue: "gc.workflow", release: "R2" },
  "blog.generate": { queue: "gc.content", release: "R2" },
  "blog.publish": { queue: "gc.content", release: "R2" },
  "shorts.render": { queue: "gc.content", release: "R2" },
  "sns.upload": { queue: "gc.content", release: "R2" },
  "sns.link_insert": { queue: "gc.content", release: "R2" },
  "embed.product": { queue: "gc.search", release: "R3" },
  "jsonld.build": { queue: "gc.search", release: "R3" },
} as const satisfies Record<string, { queue: Queue; release: Release }>;

export type JobType = keyof typeof JOB_TYPES;
export const JOB_TYPE_NAMES = Object.keys(JOB_TYPES) as JobType[];

export function isJobType(value: unknown): value is JobType {
  return typeof value === "string" && Object.hasOwn(JOB_TYPES, value);
}

export function queueOf(jobType: JobType): Queue {
  return JOB_TYPES[jobType].queue;
}

/** 잡 멱등 키(products/CLAUDE.md 4절, 04장 1절). item 은 항목 단위 키(예: 상품 id). */
export function jobIdempotencyKey(requestId: string, item?: string): string {
  return item === undefined ? `job:globalcommerce:${requestId}` : `job:globalcommerce:${requestId}:${item}`;
}

/** 크레딧 차감 멱등 키. */
export function consumeIdempotencyKey(requestId: string, item?: string): string {
  return item === undefined ? `consume:globalcommerce:${requestId}` : `consume:globalcommerce:${requestId}:${item}`;
}

// ---------------------------------------------------------------------------
// R1 페이로드(04장 4절). 모든 payload 에 run_id, step_id. 유료 잡은 credit_ledger_id(코어 credit_ledger.id, bigint).
// ---------------------------------------------------------------------------
const uuid = z.uuid();
const base = {
  run_id: uuid,
  step_id: uuid,
  credit_ledger_id: z.number().int().positive().optional(),
};
/** 크론 잡은 실행 기록(workflow_runs)이 없을 수 있어 run_id · step_id 를 선택으로 둔다(04장에 명시 없음, 가정). */
const cronBase = { run_id: uuid.optional(), step_id: uuid.optional() };
const marketplace = z.enum(["US", "CA", "JP", "DE", "UK"]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const jobPayloadSchemas = {
  "import.amazon": z.object({ ...base, url: z.string().max(2048), asin: z.string().regex(/^[A-Z0-9]{10}$/), marketplace }).strict(),
  "import.excel": z
    .object({
      ...base,
      import_id: uuid,
      storage_path: z.string().min(1).max(512),
      supplier: z.enum(["ownerclan", "domeggook", "custom"]),
      mode: z.enum(["preview", "commit"]),
      column_mapping: z.record(z.string().max(100), z.string().max(100)).optional(),
    })
    .strict(),
  "title.generate": z.object({ ...base, product_id: uuid, revision_id: uuid }).strict(),
  "image.cutout": z.object({ ...base, product_id: uuid, source_image_id: uuid, target_image_id: uuid }).strict(),
  "image.compose": z
    .object({
      ...base,
      product_id: uuid,
      cutout_image_id: uuid,
      target_image_id: uuid,
      background_prompt: z.string().min(1).max(300),
      product_ratio: z.number().min(0.5).max(0.85),
      overlay_text: z.string().max(20).optional(),
      attempt: z.number().int().min(1),
    })
    .strict(),
  "detail.assemble": z.object({ ...base, detail_page_id: uuid, product_id: uuid, attach_overseas_shipping: z.boolean() }).strict(),
  "detail.render_market": z.object({ ...base, detail_page_id: uuid, markets: z.array(z.enum(["coupang", "smartstore"])).min(1).max(2) }).strict(),
  "upload.coupang": z.object({ ...base, listing_id: uuid, market_account_id: uuid }).strict(),
  "upload.smartstore": z.object({ ...base, listing_id: uuid, market_account_id: uuid }).strict(),
  "upload.poll_status": z.object({ ...base, listing_ids: z.array(uuid).min(1).max(500) }).strict(),
  "export.excel": z.object({ ...base, export_id: uuid }).strict(),
  "export.zip": z.object({ ...base, export_id: uuid }).strict(),
  "export.expire": z.object({ ...cronBase, export_id: uuid }).strict(),
  "fx.fetch": z.object({ ...cronBase, date: isoDate }).strict(),
  "trend.fetch": z
    .object({ ...cronBase, date: isoDate, keyword_groups: z.array(z.string().max(40)).max(50), refresh_season_picks: z.boolean() })
    .strict(),
} as const;

export type R1JobType = keyof typeof jobPayloadSchemas;
export type JobPayload<T extends R1JobType> = z.output<(typeof jobPayloadSchemas)[T]>;

/** 워커 핸들러 첫 줄: payload 검증. 실패는 영구 실패(재시도하지 않는다). */
export function parseJobPayload<T extends R1JobType>(jobType: T, payload: unknown): JobPayload<T> {
  return jobPayloadSchemas[jobType].parse(payload) as JobPayload<T>;
}
