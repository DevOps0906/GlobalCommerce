/**
 * 상태 값 유니온. DB CHECK 제약과 같은 값이다.
 *
 * 정본: products/supabase/monolith/0002_globalcommerce_domain.sql 각 `<table>_status_check`.
 * 테스트(test/status.test.ts)가 SQL 파일을 읽어 값이 같은지 대조한다. SQL 이 바뀌면 이 파일도 바꾼다.
 */

export const PRODUCT_STATUSES = ["collected", "generating", "review", "approved", "archived"] as const;
export const PRODUCT_IMAGE_STATUSES = ["pending", "processing", "ready", "failed"] as const;
export const DETAIL_PAGE_STATUSES = ["assembling", "draft", "confirmed", "rendering", "ready", "failed", "archived"] as const;
export const UPLOAD_BATCH_STATUSES = ["queued", "running", "completed", "completed_with_errors", "canceled"] as const;
export const MARKET_LISTING_STATUSES = ["waiting", "sending", "submitted", "registered", "failed", "rejected", "canceled"] as const;
export const EXPORT_FILE_STATUSES = ["queued", "running", "succeeded", "failed", "canceled", "expired"] as const;
export const SOURCE_IMPORT_STATUSES = ["queued", "running", "preview_ready", "completed", "failed", "canceled"] as const;
export const IMPORT_ROW_STATUSES = ["pending", "collecting", "collected", "updated", "excluded", "error"] as const;
export const MARKET_ACCOUNT_STATUSES = ["active", "expired", "error", "disabled"] as const;
export const WORKFLOW_RUN_STATUSES = ["scheduled", "queued", "running", "succeeded", "failed", "canceled"] as const;
export const WORKFLOW_RUN_STEP_STATUSES = ["pending", "running", "succeeded", "failed", "skipped", "canceled"] as const;
export const COMPLIANCE_VERDICTS = ["pass", "warn", "fail"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type ProductImageStatus = (typeof PRODUCT_IMAGE_STATUSES)[number];
export type DetailPageStatus = (typeof DETAIL_PAGE_STATUSES)[number];
export type UploadBatchStatus = (typeof UPLOAD_BATCH_STATUSES)[number];
export type MarketListingStatus = (typeof MARKET_LISTING_STATUSES)[number];
export type ExportFileStatus = (typeof EXPORT_FILE_STATUSES)[number];
export type SourceImportStatus = (typeof SOURCE_IMPORT_STATUSES)[number];
export type ImportRowStatus = (typeof IMPORT_ROW_STATUSES)[number];
export type MarketAccountStatus = (typeof MARKET_ACCOUNT_STATUSES)[number];
export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUSES)[number];
export type WorkflowRunStepStatus = (typeof WORKFLOW_RUN_STEP_STATUSES)[number];
export type ComplianceVerdict = (typeof COMPLIANCE_VERDICTS)[number];

/** 테이블 이름 → 상태 목록(SQL 대조 테스트용). */
export const STATUS_BY_TABLE = {
  products: PRODUCT_STATUSES,
  product_images: PRODUCT_IMAGE_STATUSES,
  detail_pages: DETAIL_PAGE_STATUSES,
  upload_batches: UPLOAD_BATCH_STATUSES,
  market_listings: MARKET_LISTING_STATUSES,
  export_files: EXPORT_FILE_STATUSES,
  source_imports: SOURCE_IMPORT_STATUSES,
  import_rows: IMPORT_ROW_STATUSES,
  market_accounts: MARKET_ACCOUNT_STATUSES,
  workflow_runs: WORKFLOW_RUN_STATUSES,
  workflow_run_steps: WORKFLOW_RUN_STEP_STATUSES,
} as const;

/** 끝난 상태(더 진행하지 않음). 화면 진행률 · 재시도 판단용. */
export const TERMINAL_RUN_STATUSES: readonly WorkflowRunStatus[] = ["succeeded", "failed", "canceled"];
export const TERMINAL_LISTING_STATUSES: readonly MarketListingStatus[] = ["registered", "failed", "rejected", "canceled"];
