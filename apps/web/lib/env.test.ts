import { describe, expect, it } from "vitest";
import { findForbiddenPublicEnvNames, parseServerEnv } from "./env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  APP_ID: "globalcommerce",
};

describe("parseServerEnv", () => {
  it("필수 키가 모두 있으면 통과하고 기본값을 채운다", () => {
    const env = parseServerEnv(valid);
    expect(env.AUTH_MODE).toBe("live");
    expect(env.AI_PROVIDER).toBe("fake");
  });

  it.each(Object.keys(valid))("%s 가 없으면 던진다", (key) => {
    const rest: Record<string, string | undefined> = { ...valid };
    delete rest[key];
    expect(() => parseServerEnv(rest)).toThrow(key);
  });

  it("빈 문자열은 없는 값으로 본다", () => {
    expect(() => parseServerEnv({ ...valid, SUPABASE_SERVICE_ROLE_KEY: "" })).toThrow();
  });

  it("AUTH_MODE=mock 은 DEV_SEED_PASSWORD 가 필요하다", () => {
    expect(() => parseServerEnv({ ...valid, AUTH_MODE: "mock" })).toThrow("DEV_SEED_PASSWORD");
    expect(parseServerEnv({ ...valid, AUTH_MODE: "mock", DEV_SEED_PASSWORD: "x" }).AUTH_MODE).toBe("mock");
  });

  it("배포 환경에서는 AUTH_MODE=mock 이 실패한다", () => {
    expect(() =>
      parseServerEnv({ ...valid, AUTH_MODE: "mock", DEV_SEED_PASSWORD: "x", VERCEL_ENV: "production" }),
    ).toThrow("mock");
  });
});

describe("NEXT_PUBLIC 비밀 이름 검사", () => {
  it.each([
    "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_OPENAI_API_KEY",
    "NEXT_PUBLIC_ANTHROPIC_API_KEY",
    "NEXT_PUBLIC_TOSS_SECRET_KEY",
  ])("%s 를 거부한다", (name) => {
    expect(findForbiddenPublicEnvNames({ [name]: "x" })).toEqual([name]);
    expect(() => parseServerEnv({ ...valid, [name]: "x" })).toThrow(name);
  });

  it("공개 이름은 통과한다", () => {
    expect(findForbiddenPublicEnvNames(valid)).toEqual([]);
  });
});
