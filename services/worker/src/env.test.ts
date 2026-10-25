import { describe, expect, it } from "vitest";
import { findForbiddenPublicEnvNames, loadWorkerEnv } from "./env.js";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  APP_ID: "globalcommerce",
};

describe("loadWorkerEnv", () => {
  it("필수 키가 있으면 통과하고 기본값을 채운다", () => {
    const env = loadWorkerEnv(valid);
    expect(env.WORKER_ID).toBe("main");
    expect(env.WORKER_CONCURRENCY).toBe(4);
    expect(env.AMAZON_DATA_PROVIDER).toBe("fake");
  });

  it.each(Object.keys(valid))("%s 가 없으면 던진다", (key) => {
    const rest: Record<string, string | undefined> = { ...valid };
    delete rest[key];
    expect(() => loadWorkerEnv(rest)).toThrow(key);
  });

  it("NEXT_PUBLIC 비밀 이름을 거부한다", () => {
    const name = "NEXT_PUBLIC_OPENAI_API_KEY";
    expect(findForbiddenPublicEnvNames({ [name]: "x" })).toEqual([name]);
    expect(() => loadWorkerEnv({ ...valid, [name]: "x" })).toThrow(name);
  });
});
