import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { assertNoMockInProduction, assertNoPublicSecretNames, getServerEnv } from "./lib/env";

// 저장소 루트의 .env.local 도 읽는다 (Docker · 로컬 공통 파일, GC-D-26).
const repoRoot = path.resolve(process.cwd(), "../..");
loadEnvConfig(repoRoot);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: repoRoot },
};

export default function config(phase: string): NextConfig {
  // NEXT_PUBLIC_ 이름 검사는 빌드에서도 항상 한다.
  assertNoPublicSecretNames();
  // 빌드에서도 mock 가드만 실행한다 (운영 빌드에 AUTH_MODE=mock 금지).
  assertNoMockInProduction();
  // 필수 키 검증은 기동(dev · start)에서 한다. CI 빌드는 키 없이 통과한다.
  if (phase !== PHASE_PRODUCTION_BUILD) {
    getServerEnv();
  }
  return nextConfig;
}
