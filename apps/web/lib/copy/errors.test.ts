import { GC_ERROR_CODES } from "@gc/domain";
import { describe, expect, it } from "vitest";
import { ERROR_COPY, errorCopy } from "./errors";

describe("errors copy", () => {
  it("GC001~GC010 과 CR001 모두 문구와 해결 안내가 있다", () => {
    for (const code of GC_ERROR_CODES) {
      expect(ERROR_COPY[code].message.length).toBeGreaterThan(0);
      expect(ERROR_COPY[code].fix.length).toBeGreaterThan(0);
    }
    expect(GC_ERROR_CODES).toHaveLength(11);
  });
  it("알 수 없는 코드는 일반 문구", () => {
    expect(errorCopy("NOPE").message).toContain("처리하지 못했습니다");
    expect(errorCopy(null).fix.length).toBeGreaterThan(0);
  });
});
