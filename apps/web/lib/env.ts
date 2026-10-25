/**
 * 웹 환경 변수 검증 (products/02_ARCHITECTURE.md 8절, 9절).
 *
 * - 필수 키가 없거나 형식이 틀리면 getServerEnv()가 던진다 (기동 실패).
 * - 비밀 값은 NEXT_PUBLIC_ 이름으로 두지 않는다. assertNoPublicSecretNames()가 막는다.
 * - 이 파일의 getServerEnv()는 서버 코드에서만 쓴다. 클라이언트 컴포넌트에서 import 하지 않는다.
 *   브라우저에는 getPublicEnv()가 돌려주는 공개 값만 나간다.
 */
import { z } from "zod";

type RawEnv = Record<string, string | undefined>;

/** `KEY=` 처럼 빈 문자열인 값은 없는 값으로 본다. */
function withoutEmpty(env: RawEnv): RawEnv {
  const out: RawEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined && value.trim() !== "") out[key] = value;
  }
  return out;
}

const providerSchema = z.enum(["fake", "live"]);

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
});

export const serverEnvSchema = publicEnvSchema
  .extend({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    APP_ID: z.literal("globalcommerce"),
    /** 컨테이너에서 Supabase 로 붙는 주소. 없으면 NEXT_PUBLIC_SUPABASE_URL. */
    SUPABASE_URL_INTERNAL: z.url().optional(),

    AUTH_MODE: z.enum(["mock", "live"]).default("live"),
    AUTH_PROVIDERS: z.string().optional(),
    DEV_SEED_PASSWORD: z.string().min(1).optional(),

    AI_PROVIDER: providerSchema.default("fake"),
    PAYMENT_PROVIDER: providerSchema.default("fake"),

    TOSS_CLIENT_KEY: z.string().min(1).optional(),
    TOSS_SECRET_KEY: z.string().min(1).optional(),
    TOSS_WEBHOOK_SECRET: z.string().min(1).optional(),

    CREDENTIALS_KEY_VERSION: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
    META_APP_ID: z.string().min(1).optional(),
    META_APP_SECRET: z.string().min(1).optional(),

    VERCEL_ENV: z.string().optional(),
    RAILWAY_ENVIRONMENT: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.AUTH_MODE !== "mock") return;
    if (!env.DEV_SEED_PASSWORD) {
      ctx.addIssue({
        code: "custom",
        path: ["DEV_SEED_PASSWORD"],
        message: "AUTH_MODE=mock 에서는 DEV_SEED_PASSWORD 가 필요합니다",
      });
    }
    if (env.VERCEL_ENV || env.RAILWAY_ENVIRONMENT) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_MODE"],
        message: "배포 환경(VERCEL_ENV · RAILWAY_ENVIRONMENT)에서는 AUTH_MODE=mock 을 쓸 수 없습니다",
      });
    }
  });

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** NEXT_PUBLIC_ 에 두면 안 되는 이름 조각 (GC-D-21). */
const FORBIDDEN_PUBLIC_NAME = /SERVICE_ROLE|OPENAI|ANTHROPIC|TOSS_SECRET/i;

export function findForbiddenPublicEnvNames(env: RawEnv = process.env): string[] {
  return Object.keys(env).filter(
    (name) => name.startsWith("NEXT_PUBLIC_") && FORBIDDEN_PUBLIC_NAME.test(name),
  );
}

/** NEXT_PUBLIC_ 이름에 비밀 키 이름이 있으면 던진다. */
export function assertNoPublicSecretNames(env: RawEnv = process.env): void {
  const bad = findForbiddenPublicEnvNames(env);
  if (bad.length > 0) {
    throw new Error(
      `NEXT_PUBLIC_ 변수는 브라우저에 노출됩니다. 비밀 값 이름을 쓸 수 없습니다: ${bad.join(", ")}`,
    );
  }
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `- ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

/** 순수 검증 함수. 테스트와 getServerEnv 가 쓴다. */
export function parseServerEnv(env: RawEnv): ServerEnv {
  assertNoPublicSecretNames(env);
  const result = serverEnvSchema.safeParse(withoutEmpty(env));
  if (!result.success) {
    throw new Error(`환경 변수 검증 실패 (.env.example 참고):\n${formatIssues(result.error)}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

/** 서버 전용. 처음 호출에서 검증하고 결과를 재사용한다. */
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}

/** 서버에서 Supabase 로 붙을 URL (컨테이너면 host.docker.internal). */
export function getSupabaseServerUrl(): string {
  const env = getServerEnv();
  return env.SUPABASE_URL_INTERNAL ?? env.NEXT_PUBLIC_SUPABASE_URL;
}

/** 브라우저에 나가도 되는 값. Next.js 가 빌드 때 치환하도록 정적으로 참조한다. */
export function getPublicEnv(): PublicEnv {
  const result = publicEnvSchema.safeParse(
    withoutEmpty({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    }),
  );
  if (!result.success) {
    throw new Error(`공개 환경 변수 검증 실패:\n${formatIssues(result.error)}`);
  }
  return result.data;
}
