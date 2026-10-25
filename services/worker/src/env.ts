/**
 * 워커 환경 변수 검증 (products/02_ARCHITECTURE.md 8절).
 * 필수 키가 없으면 loadWorkerEnv()가 던진다 (기동 실패). 인증 변수는 두지 않는다 (service_role 만 사용).
 */
import { z } from "zod";

type RawEnv = Record<string, string | undefined>;

function withoutEmpty(env: RawEnv): RawEnv {
  const out: RawEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined && value.trim() !== "") out[key] = value;
  }
  return out;
}

const providerSchema = z.enum(["fake", "live"]);

export const workerEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  /** 컨테이너에서 Supabase 로 붙는 주소. 없으면 NEXT_PUBLIC_SUPABASE_URL. */
  SUPABASE_URL_INTERNAL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APP_ID: z.literal("globalcommerce"),

  WORKER_ID: z.string().min(1).default("main"),
  WORKER_ROLE: z.enum(["main", "media"]).default("main"),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(4),

  AMAZON_DATA_PROVIDER: providerSchema.default("fake"),
  AMAZON_DATA_API_KEY: z.string().min(1).optional(),
  IMAGE_COMPOSE_PROVIDER: z.enum(["openai-image", "fal-flux"]).default("openai-image"),

  CREDENTIALS_KEY_VERSION: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  FAL_KEY: z.string().min(1).optional(),
  KOREAEXIM_API_KEY: z.string().min(1).optional(),
  NAVER_DATALAB_CLIENT_ID: z.string().min(1).optional(),
  NAVER_DATALAB_CLIENT_SECRET: z.string().min(1).optional(),
  TOSS_SECRET_KEY: z.string().min(1).optional(),
  EMAIL_PROVIDER_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

/** NEXT_PUBLIC_ 에 두면 안 되는 이름 조각 (GC-D-21). */
const FORBIDDEN_PUBLIC_NAME =
  /CREDENTIALS_KEY|DEV_SEED_PASSWORD|WEBHOOK_SECRET|FAL_KEY|CLIENT_SECRET|APP_SECRET|SECRET|PASSWORD|SERVICE_ROLE|OPENAI|ANTHROPIC|TOSS_SECRET/i;

export function findForbiddenPublicEnvNames(env: RawEnv = process.env): string[] {
  return Object.keys(env).filter(
    (name) => name.startsWith("NEXT_PUBLIC_") && FORBIDDEN_PUBLIC_NAME.test(name),
  );
}

export function assertNoPublicSecretNames(env: RawEnv = process.env): void {
  const bad = findForbiddenPublicEnvNames(env);
  if (bad.length > 0) {
    throw new Error(
      `NEXT_PUBLIC_ 변수에 비밀 값 이름을 쓸 수 없습니다: ${bad.join(", ")}`,
    );
  }
}

export function loadWorkerEnv(env: RawEnv = process.env): WorkerEnv {
  assertNoPublicSecretNames(env);
  const result = workerEnvSchema.safeParse(withoutEmpty(env));
  if (!result.success) {
    const lines = result.error.issues
      .map((issue) => `- ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`환경 변수 검증 실패 (.env.example 참고):\n${lines}`);
  }
  return result.data;
}

/** 워커가 Supabase 로 붙을 URL. */
export function supabaseUrlOf(env: WorkerEnv): string {
  return env.SUPABASE_URL_INTERNAL ?? env.NEXT_PUBLIC_SUPABASE_URL;
}
