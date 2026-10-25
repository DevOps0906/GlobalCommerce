import { describe, expect, it } from "vitest";
import { JOB_TYPE_NAMES } from "../src/jobs";
import { PROCESS_STEP_ORDER, SYSTEM_PIPELINES, SYSTEM_PIPELINE_KEYS, stepPosition, type PipelineStep } from "../src/pipelines";
import { readRepoFile } from "./helpers";

/**
 * 01장 3.8절 표를 읽어 { key, steps: [{ label, jobTypes }] } 로 만든다.
 * 01장은 점 표기 키로 바뀔 예정이라(팀장 결정), 옛 키면 테스트 안에서만 새 키로 바꿔 대조한다.
 */
const LEGACY_PRD_KEYS: Record<string, string> = {
  import_amazon: "sourcing.amazon",
  import_excel: "sourcing.excel",
  process_products: "process",
  confirm_detail: "detail",
  upload_batch: "upload",
};
function parsePrd38() {
  const prd = readRepoFile("products/01_PRD.md");
  const start = prd.indexOf("### 3.8 R1 시스템 파이프라인");
  const end = prd.indexOf("\n### ", start + 10);
  const table = prd.slice(start, end);
  return [...table.matchAll(/^\| `([a-z_.]+)` \| [^|\n]+ \| ([^|\n]+) \| [^|\n]+ \|$/gm)].map((m) => ({
    key: LEGACY_PRD_KEYS[m[1] as string] ?? (m[1] as string),
    steps: (m[2] as string).split("→").map((raw) => {
      const s = raw.trim();
      const paren = s.indexOf("(");
      return {
        label: (paren < 0 ? s : s.slice(0, paren)).trim(),
        jobTypes: [...s.matchAll(/`([a-z_.]+)`/g)].map((x) => x[1] as string),
      };
    }),
  }));
}

/** 02장 4.3절 시스템 파이프라인 키 */
function parseArch43(): string[] {
  const arch = readRepoFile("products/02_ARCHITECTURE.md");
  const start = arch.indexOf("### 4.3 시스템 파이프라인");
  const end = arch.indexOf("\n### ", start + 10);
  return [...arch.slice(start, end).matchAll(/^\| `([a-z_.]+)` \|/gm)].map((m) => m[1] as string);
}

describe("SYSTEM_PIPELINES 키 = 02장 4.3절 · DB", () => {
  it("키 7개와 순서가 02장 4.3절과 같다", () => {
    expect(parseArch43()).toEqual([...SYSTEM_PIPELINE_KEYS]);
  });

  it("0002 gc_create_upload_batch 가 쓰는 'upload' 키가 있다", () => {
    const sql = readRepoFile("products/supabase/monolith/0002_globalcommerce_domain.sql");
    const used = [...sql.matchAll(/workflow_runs \(org_id, kind, pipeline[^)]*\)\s*values \([^,]+, 'system', '([a-z_.]+)'/g)].map((m) => m[1] as string);
    expect(used.length).toBeGreaterThan(0);
    for (const k of used) expect(SYSTEM_PIPELINE_KEYS).toContain(k);
  });
});

describe("단계 이름 · 잡 타입 = 01장 3.8절", () => {
  const doc = parsePrd38();

  it("01장 파이프라인 6개가 모두 있고 순서가 같다(image 는 01장에 없음)", () => {
    expect(doc.map((d) => d.key)).toEqual(SYSTEM_PIPELINE_KEYS.filter((k) => k !== "image"));
  });

  it.each(doc.map((d) => [d.key, d] as const))("%s 단계 이름 · 잡 타입", (key, d) => {
    const steps: readonly PipelineStep[] = SYSTEM_PIPELINES[key as keyof typeof SYSTEM_PIPELINES].steps;
    expect(steps.map((s) => s.label)).toEqual(d.steps.map((s) => s.label));
    steps.forEach((s, i) => {
      const fromCode = s.jobTypes ? [...s.jobTypes] : s.jobType ? [s.jobType] : [];
      expect(fromCode).toEqual(d.steps[i]?.jobTypes);
    });
  });

  it("단계 키는 실행 안에서 유일하고 node_key 로 쓸 수 있는 형식", () => {
    for (const key of SYSTEM_PIPELINE_KEYS) {
      const keys = SYSTEM_PIPELINES[key].steps.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const k of keys) expect(k).toMatch(/^[a-z_]{1,64}$/);
      // SQL workflow_runs_pipeline_check 형식
      expect(key).toMatch(/^[a-z_]+(\.[a-z_]+)?$/);
    }
  });

  it("단계의 잡 타입은 모두 실재한다", () => {
    for (const key of SYSTEM_PIPELINE_KEYS) {
      for (const s of SYSTEM_PIPELINES[key].steps as readonly PipelineStep[]) {
        for (const t of s.jobTypes ?? (s.jobType ? [s.jobType] : [])) expect(JOB_TYPE_NAMES).toContain(t);
      }
    }
  });

  it("가공 단계 순서와 position", () => {
    expect(SYSTEM_PIPELINES.process.steps.map((s) => s.key)).toEqual([...PROCESS_STEP_ORDER]);
    expect(stepPosition("process", "title")).toBe(1);
    expect(stepPosition("process", "assemble")).toBe(4);
    expect(stepPosition("process", "nope")).toBeNull();
  });
});
