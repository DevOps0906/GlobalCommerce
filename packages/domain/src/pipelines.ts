/**
 * R1 시스템 파이프라인(`workflow_runs.kind = 'system'`)과 단계(`workflow_run_steps`) 이름 상수 `SYSTEM_PIPELINES`.
 *
 * 파이프라인 키(`workflow_runs.pipeline`) 정본: products/02_ARCHITECTURE.md 4.3절 점 표기 키
 *   (0002 `gc_create_upload_batch`의 'upload', 04장 `sourcing.amazon`과 같음. 팀장 결정 2026-10-25).
 * 단계 이름 · 순서 · 잡 타입 정본: products/01_PRD.md 3.8절(`image`는 01장에 없어 02장 4.3절 단계로 둔다).
 * 키는 SQL `workflow_runs_pipeline_check`(`^[a-z_]+(\.[a-z_]+)?$`)를 통과한다.
 * R2 사용자 워크플로우 노드 정의는 `workflow/`(GC-06-037)가 소유한다. 여기에 두지 않는다.
 */
import type { JobType } from "./jobs";

export interface PipelineStep {
  /** `workflow_run_steps.node_key`(실행 안에서 유일) */
  key: string;
  /** 화면 단계 이름(`workflow_run_steps.label`) */
  label: string;
  /** 이 단계가 잡이면 잡 타입(`workflow_run_steps.node_type`). 앱 · 워커 안의 동기 단계는 null */
  jobType: JobType | null;
  /** 같은 단계가 여러 잡 타입 중 하나로 실행될 때(계정별 전송, 엑셀/ZIP) */
  jobTypes?: readonly JobType[];
}

export interface SystemPipeline {
  key: string;
  /** 시작 행동(화면 문구) */
  trigger: string;
  steps: readonly PipelineStep[];
  /** 실행 기록 이름 예(01장 표시 예) */
  nameExample: string;
}

export const SYSTEM_PIPELINES = {
  "sourcing.amazon": {
    key: "sourcing.amazon",
    trigger: "소싱 \"N건 수집 시작\"",
    steps: [
      { key: "extract_asin", label: "ASIN 추출", jobType: null },
      { key: "fetch_product", label: "상품 데이터 조회", jobType: "import.amazon" },
      { key: "save_products", label: "상품 저장", jobType: null },
    ],
    nameExample: "아마존 URL 수집 · 3 / 3건",
  },
  "sourcing.excel": {
    key: "sourcing.excel",
    trigger: "엑셀 파일 확인 후 저장",
    steps: [
      { key: "parse", label: "파싱·열 매핑", jobType: null },
      { key: "validate_rows", label: "행 검증", jobType: null },
      { key: "save_products", label: "상품 저장", jobType: "import.excel" },
    ],
    nameExample: "오너클랜 엑셀 수집 · 312 / 312행",
  },
  "process": {
    key: "process",
    trigger: "상품 관리 \"선택 상품 가공\"",
    steps: [
      { key: "title", label: "상품명", jobType: "title.generate" },
      { key: "cutout", label: "누끼", jobType: "image.cutout" },
      { key: "compose", label: "합성", jobType: "image.compose" },
      { key: "assemble", label: "상세 조립", jobType: "detail.assemble" },
    ],
    nameExample: "선택 상품 가공 · 상품 4개",
  },
  image: {
    key: "image",
    trigger: "상품 이미지 \"누끼\", \"다시 만들기\"",
    // 한 실행은 둘 중 한 단계만 만든다(02장 4.3절 "cutout 또는 compose", 잡 1개).
    steps: [
      { key: "cutout", label: "누끼", jobType: "image.cutout" },
      { key: "compose", label: "합성", jobType: "image.compose" },
    ],
    nameExample: "누끼 · 상품 1개",
  },
  detail: {
    key: "detail",
    trigger: "상세페이지 확정",
    steps: [
      { key: "compliance", label: "금지어 판정", jobType: null },
      { key: "render_market", label: "마켓 규격 변환", jobType: "detail.render_market" },
    ],
    nameExample: "상세페이지 확정 · 쿠팡·스마트스토어",
  },
  "upload": {
    key: "upload",
    trigger: "업로드 \"선택한 N건 전송\"",
    steps: [
      { key: "precheck", label: "사전 검증", jobType: null },
      { key: "send", label: "계정별 전송", jobType: null, jobTypes: ["upload.coupang", "upload.smartstore"] },
      { key: "poll_status", label: "상태 확인", jobType: "upload.poll_status" },
    ],
    nameExample: "쿠팡 2호점 일괄 업로드 · 24 / 24건",
  },
  export: {
    key: "export",
    trigger: "엑셀 · ZIP 내보내기",
    steps: [
      { key: "build_file", label: "파일 생성", jobType: null, jobTypes: ["export.excel", "export.zip"] },
      { key: "signed_url", label: "서명 URL", jobType: null },
    ],
    nameExample: "엑셀 내보내기 · 상품 30개",
  },
} as const satisfies Record<string, SystemPipeline>;

export type SystemPipelineKey = keyof typeof SYSTEM_PIPELINES;
export const SYSTEM_PIPELINE_KEYS = Object.keys(SYSTEM_PIPELINES) as SystemPipelineKey[];

export type PipelineStepKey<P extends SystemPipelineKey> = (typeof SYSTEM_PIPELINES)[P]["steps"][number]["key"];

/** `process` 단계 순서(04장 `POST /api/products/process` steps 부분집합, 순서 고정). */
export const PROCESS_STEP_ORDER = ["title", "cutout", "compose", "assemble"] as const;
export type ProcessStep = (typeof PROCESS_STEP_ORDER)[number];

export function isSystemPipelineKey(value: unknown): value is SystemPipelineKey {
  return typeof value === "string" && Object.hasOwn(SYSTEM_PIPELINES, value);
}

/** 단계 키 → 1부터 시작하는 position(`workflow_run_steps.position`). 없으면 null. */
export function stepPosition(pipeline: SystemPipelineKey, stepKey: string): number | null {
  const steps: readonly PipelineStep[] = SYSTEM_PIPELINES[pipeline].steps;
  const index = steps.findIndex((s) => s.key === stepKey);
  return index < 0 ? null : index + 1;
}
