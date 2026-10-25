import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { JOB_TYPES, JOB_TYPE_NAMES, QUEUES, consumeIdempotencyKey, isJobType, jobIdempotencyKey, parseJobPayload, queueOf } from "../src/jobs";
import { APP_ERRORS, GC_ERRORS, GC_ERROR_CODES, httpStatusOf, isErrorCode, isGcErrorCode, isNoticeCode } from "../src/errors";
import { readRepoFile } from "./helpers";

const decisions = readRepoFile("products/00_DECISIONS.md");

function section(md: string, startHeading: string): string {
  const start = md.indexOf(startHeading);
  const next = md.indexOf("\n### ", start + startHeading.length);
  return md.slice(start, next < 0 ? undefined : next);
}

describe("큐 · 잡 타입 = 00장 5.4절", () => {
  const table = section(decisions, "### 5.4 잡 타입");
  const rows = [...table.matchAll(/^\| `(gc\.[a-z]+)` \| (.+?) \| (R\d) \|$/gm)].map((m) => ({
    queue: m[1] as string,
    jobTypes: [...(m[2] as string).matchAll(/`([a-z_.]+)`/g)].map((x) => x[1] as string),
    release: m[3] as string,
  }));

  it("문서 표를 읽었다", () => {
    expect(rows.length).toBe(9);
  });

  it("큐 목록이 같다", () => {
    expect(rows.map((r) => r.queue)).toEqual([...QUEUES]);
  });

  it("job_type · 큐 · 릴리스가 같다", () => {
    const fromDoc = rows.flatMap((r) => r.jobTypes.map((t) => [t, r.queue, r.release]));
    expect(fromDoc.map(([t]) => t).sort()).toEqual([...JOB_TYPE_NAMES].sort());
    for (const [t, q, rel] of fromDoc) {
      expect(isJobType(t)).toBe(true);
      if (!isJobType(t)) continue;
      expect(queueOf(t)).toBe(q);
      expect(JOB_TYPES[t].release).toBe(rel);
    }
  });

  it("문서에 없는 이름은 잡 타입이 아니다", () => {
    expect(isJobType("upload.gmarket")).toBe(false);
    expect(isJobType("constructor")).toBe(false);
  });
});

describe("잡 페이로드 · 멱등 키", () => {
  const ids = {
    run_id: "11111111-1111-4111-8111-111111111111",
    step_id: "22222222-2222-4222-8222-222222222222",
    listing_id: "33333333-3333-4333-8333-333333333333",
    market_account_id: "44444444-4444-4444-8444-444444444444",
  };

  it("업로드 payload 는 자격증명 id 만, 키 필드는 거부", () => {
    expect(parseJobPayload("upload.coupang", ids)).toEqual(ids);
    expect(() => parseJobPayload("upload.coupang", { ...ids, access_key: "AK", secret_key: "SK" })).toThrow(ZodError);
  });

  it("유료 잡은 credit_ledger_id 를 실을 수 있다", () => {
    const p = parseJobPayload("title.generate", { run_id: ids.run_id, step_id: ids.step_id, product_id: ids.listing_id, revision_id: ids.market_account_id, credit_ledger_id: 42 });
    expect(p.credit_ledger_id).toBe(42);
  });

  it("크론 잡은 run_id 없이도 된다", () => {
    expect(parseJobPayload("fx.fetch", { date: "2026-10-26" })).toEqual({ date: "2026-10-26" });
    expect(() => parseJobPayload("fx.fetch", { date: "2026/10/26" })).toThrow(ZodError);
  });

  it("ASIN 형식", () => {
    const base = { run_id: ids.run_id, step_id: ids.step_id, url: "https://www.amazon.com/dp/B001G7QR5A", marketplace: "US" };
    expect(parseJobPayload("import.amazon", { ...base, asin: "B001G7QR5A" }).asin).toBe("B001G7QR5A");
    expect(() => parseJobPayload("import.amazon", { ...base, asin: "b001" })).toThrow(ZodError);
  });

  it("멱등 키 형식(products/CLAUDE.md 4절)", () => {
    expect(jobIdempotencyKey("r1")).toBe("job:globalcommerce:r1");
    expect(jobIdempotencyKey("r1", "p1")).toBe("job:globalcommerce:r1:p1");
    expect(consumeIdempotencyKey("r1")).toBe("consume:globalcommerce:r1");
    expect(consumeIdempotencyKey("r1", "p1")).toBe("consume:globalcommerce:r1:p1");
  });
});

describe("오류 코드 = 00장 5.5절", () => {
  const table = section(decisions, "### 5.5 오류 코드");
  const rows = [...table.matchAll(/^\| (GC\d{3}|CR001)(?:\(코어\))? \| .+? \| (\d{3}) \|$/gm)].map((m) => [m[1] as string, Number(m[2])] as const);

  it("코드 11개와 HTTP 상태가 같다", () => {
    expect(rows.length).toBe(11);
    expect(rows.map(([c]) => c)).toEqual([...GC_ERROR_CODES]);
    for (const [code, http] of rows) {
      expect(isGcErrorCode(code)).toBe(true);
      if (isGcErrorCode(code)) expect(httpStatusOf(code)).toBe(http);
    }
  });

  it("앱 코드(04장 8절)와 안내 코드", () => {
    expect(httpStatusOf("VALIDATION")).toBe(400);
    expect(httpStatusOf("VERSION_CONFLICT")).toBe(409);
    expect(httpStatusOf("RATE_LIMITED")).toBe(429);
    expect(httpStatusOf("AI_UNAVAILABLE")).toBe(503);
    expect(httpStatusOf("MARKET_UNAVAILABLE")).toBe(502);
    expect(isErrorCode("ADDON_PRICE_UNSET")).toBe(true);
    expect(isErrorCode("GC011")).toBe(false);
    expect(isNoticeCode("GC008")).toBe(true);
    expect(isNoticeCode("GC007")).toBe(false);
    expect(Object.keys(GC_ERRORS).some((k) => k in APP_ERRORS)).toBe(false);
  });
});
