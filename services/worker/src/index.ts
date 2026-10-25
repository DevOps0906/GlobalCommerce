/**
 * 워커 진입점 스텁. GC-06-007 이 잡 루프 · 디스패처 · 크론으로 교체한다.
 * 환경 변수를 검증하고 시작 로그만 남긴다.
 */
import { loadWorkerEnv, supabaseUrlOf } from "./env.js";

type Level = "info" | "error";

function log(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  process.stdout.write(`${JSON.stringify({ t: new Date().toISOString(), level, msg, ...fields })}\n`);
}

function main(): void {
  let env;
  try {
    env = loadWorkerEnv();
  } catch (error) {
    log("error", "워커 기동 실패", { reason: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }

  log("info", "워커 시작(스텁)", {
    workerId: env.WORKER_ID,
    role: env.WORKER_ROLE,
    concurrency: env.WORKER_CONCURRENCY,
    supabaseUrl: supabaseUrlOf(env),
  });

  // 스텁: 컨테이너가 바로 종료되지 않도록 유지한다.
  const keepAlive = setInterval(() => undefined, 60_000);
  const shutdown = (signal: string): void => {
    log("info", "워커 종료", { signal });
    clearInterval(keepAlive);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
