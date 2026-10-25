#!/usr/bin/env node
// Docker Desktop 기준 로컬 실행 (GC-D-26).
//   node scripts/dev/docker.mjs up    : supabase start -> db reset -> (시드) -> docker compose up --build
//   node scripts/dev/docker.mjs down  : docker compose down + supabase stop
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SUPABASE_CLI_VERSION = "2.122.0";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const isWindows = process.platform === "win32";

function fail(message) {
  console.error(`\n[오류] ${message}\n`);
  process.exit(1);
}

function step(message) {
  console.log(`\n==> ${message}`);
}

/** 명령 출력을 문자열로 돌려준다 (비밀이 섞일 수 있어 콘솔에 찍지 않는다). 실패하면 null. */
function capture(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", shell: isWindows });
  if (result.error || result.status !== 0) return null;
  return result.stdout;
}

/** 명령을 실행하고 종료 코드를 돌려준다. 실행 파일이 없으면 null. */
function run(command, args, { quiet = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: quiet ? "ignore" : "inherit",
    shell: isWindows,
  });
  if (result.error) return null;
  return result.status ?? 1;
}

function requireDocker() {
  if (run("docker", ["--version"], { quiet: true }) === null) {
    fail("Docker 가 설치되어 있지 않습니다. Docker Desktop 을 설치하세요 (Windows 는 WSL2 백엔드).");
  }
  if (run("docker", ["info"], { quiet: true }) !== 0) {
    fail(
      "Docker Desktop 이 실행 중이 아닙니다. Docker Desktop 을 켜고 완전히 시작된 뒤(고래 아이콘이 멈춤) 다시 시도하세요.",
    );
  }
  if (run("docker", ["compose", "version"], { quiet: true }) !== 0) {
    fail("`docker compose` 를 쓸 수 없습니다. Docker Desktop 을 최신 버전으로 업데이트하세요.");
  }
}

/** Supabase CLI 실행기: 설치되어 있으면 그대로, 없으면 고정 버전을 npx 로 실행한다. */
function supabaseRunner() {
  if (run("supabase", ["--version"], { quiet: true }) === 0) return { command: "supabase", prefix: [] };
  console.log(`supabase CLI 가 없어 npx supabase@${SUPABASE_CLI_VERSION} 를 사용합니다.`);
  return { command: "npx", prefix: ["--yes", `supabase@${SUPABASE_CLI_VERSION}`] };
}

function parseEnvOutput(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return out;
}

/**
 * .env.local 이 없으면 .env.example 을 복사하고, 비어 있는 Supabase 값만 `supabase status -o env` 로 채운다.
 * 이미 값이 있는 키는 덮어쓰지 않고, 값은 출력하지 않는다.
 */
function ensureEnvLocal(sb) {
  const target = path.join(root, ".env.local");
  if (existsSync(target)) return;
  const example = path.join(root, ".env.example");
  if (!existsSync(example)) fail(".env.example 이 없어 .env.local 을 만들 수 없습니다.");
  copyFileSync(example, target);

  const status = capture(sb.command, [...sb.prefix, "status", "-o", "env"]);
  if (status === null) fail(".env.local 은 만들었지만 `supabase status -o env` 가 실패했습니다. Supabase 값을 직접 채우세요.");
  const values = parseEnvOutput(status);
  const wanted = {
    NEXT_PUBLIC_SUPABASE_URL: values.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
  };
  const filled = [];
  const lines = readFileSync(target, "utf8").split(/\r?\n/).map((line) => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && m[2].trim() === "" && wanted[m[1]]) {
      filled.push(m[1]);
      return `${m[1]}=${wanted[m[1]]}`;
    }
    return line;
  });
  writeFileSync(target, lines.join("\n"));
  console.log(`.env.local 을 .env.example 에서 만들었습니다. 채운 키: ${filled.join(", ") || "(없음)"}`);
}

function up() {
  requireDocker();
  const sb = supabaseRunner();
  const supabase = (...args) => run(sb.command, [...sb.prefix, ...args]);

  step("Supabase 로컬 스택 기동 (supabase start)");
  if (supabase("start") !== 0) fail("supabase start 가 실패했습니다. 위 로그를 확인하세요.");

  ensureEnvLocal(sb);

  step("DB 초기화 (supabase db reset --local)");
  if (supabase("db", "reset", "--local") !== 0) fail("supabase db reset 이 실패했습니다. supabase/migrations 를 확인하세요.");

  const seed = path.join(root, "scripts", "dev", "seed-users.mjs");
  if (existsSync(seed)) {
    step("개발용 로그인 페르소나 시드");
    if (run("node", [seed, "--app", "globalcommerce"]) !== 0) fail("seed-users.mjs 가 실패했습니다.");
  } else {
    console.log("\n(scripts/dev/seed-users.mjs 가 아직 없어 시드를 건너뜁니다. GC-06-006)");
  }

  const hasWorker = existsSync(path.join(root, "services", "worker", "Dockerfile"));
  const composeArgs = hasWorker ? ["compose", "up", "--build"] : ["compose", "up", "--build", "web"];
  step(`${hasWorker ? "web · worker" : "web"} 기동 (docker compose up --build)`);
  if (!hasWorker) console.log("worker 는 GC-06-007 이후 함께 기동");
  console.log("웹: http://localhost:3000  (종료: Ctrl+C, 정리: pnpm dev:docker:down)");
  const code = run("docker", composeArgs);
  process.exit(code ?? 1);
}

function down() {
  requireDocker();
  const sb = supabaseRunner();

  step("web · worker 정지 (docker compose down)");
  const composeCode = run("docker", ["compose", "down"]);

  step("Supabase 정지 (supabase stop)");
  const supabaseCode = run(sb.command, [...sb.prefix, "stop"]);

  if (composeCode !== 0 || supabaseCode !== 0) fail("정지 중 일부 명령이 실패했습니다. 위 로그를 확인하세요.");
}

const command = process.argv[2];
if (command === "up") up();
else if (command === "down") down();
else fail("사용법: node scripts/dev/docker.mjs <up|down>");
