import { describe, expect, it } from "vitest";
import { COMPLIANCE_VERDICTS, STATUS_BY_TABLE } from "../src/status";
import { parseSqlInList, readRepoFile } from "./helpers";

const sql = readRepoFile("products/supabase/monolith/0002_globalcommerce_domain.sql");

describe("상태 값 = 0002 SQL CHECK", () => {
  it.each(Object.entries(STATUS_BY_TABLE))("%s", (table, statuses) => {
    const re = new RegExp(`constraint ${table}_status_check check \\(status in \\(([^)]*)\\)\\)`);
    const m = sql.match(re);
    expect(m, `${table}_status_check 를 SQL 에서 찾지 못함`).not.toBeNull();
    expect(parseSqlInList(m?.[1] ?? "")).toEqual([...statuses]);
  });

  it("verdict 값 = detail_pages_verdict_check", () => {
    const m = sql.match(/detail_pages_verdict_check check \(verdict is null or verdict in \(([^)]*)\)\)/);
    expect(parseSqlInList(m?.[1] ?? "")).toEqual([...COMPLIANCE_VERDICTS]);
  });
});
