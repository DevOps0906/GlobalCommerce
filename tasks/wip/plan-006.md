# GC-06-006 인증 Stage A 구현 계획 (PLANNING ONLY)

근거: `tasks/task-006.md`, `06_AGENT_PLAN.md` GC-06-006 행, `products/CLAUDE.md` 2·4·9절, `04_API.md` 1·9절, `05_DATA_MODEL.md` 10절,
`03_SCREENS_UX.md` 3.16절, GC-D-07 · GC-D-21 · GC-D-26, platform-docs `AUTH_ROADMAP.md` 2·3절, `core_lite.sql`(handle_new_user · session_context · invite_member · accept_invite · grant_credits), `gc_domain_r1.sql` `gc_admin_set_plan(p_actor_id)`.

## 0. 현재 코드 사실 (읽은 것)

- `apps/web/lib/env.ts`(001): `AUTH_MODE` enum(mock|live, 기본 live), `DEV_SEED_PASSWORD` optional, superRefine(mock이면 DEV_SEED_PASSWORD 필수 · `VERCEL_ENV`/`RAILWAY_ENVIRONMENT` 있으면 실패), `assertNoMockInProduction()`(production 리터럴만), `getSupabaseServerUrl()`(컨테이너는 `SUPABASE_URL_INTERNAL=http://host.docker.internal:54321`).
- `next.config.ts`(001): 빌드 단계에서 `assertNoPublicSecretNames()` + `assertNoMockInProduction()` 호출 → "mock+production 빌드 실패"는 **이미 충족**. 006은 테스트만 추가(재사용).
- `scripts/dev/docker.mjs`(001): `supabase db reset` 뒤 `scripts/dev/seed-users.mjs --app globalcommerce`가 있으면 실행. seed는 루트 `.env.local`을 스스로 읽어야 한다(docker.mjs가 env-file을 넘기지 않음).
- 코어: `apps` 1행(open) → `handle_new_user`가 `signup_app` 없이도 free 부트스트랩(가입 30 멱등 키 `signup:<org>:globalcommerce`, 월 15 `monthly:<sub>:<date>`). `session_context(p_app)`는 `{user_id, platform_role, status, org{id,role}, plan_code, entitled, credit_balance}`. `invite_member`는 owner/admin 세션 또는 service, `accept_invite`는 본인 세션(이미 active면 `P0002`). `gc_admin_set_plan`은 service_role + `p_actor_id`가 active platform_admin + reason 5자 이상. `grant_credits`는 service_role 전용, 멱등 키 있으면 기존 행 반환.
- `supabase/config.toml`: `[auth.email] enable_confirmations=false`, `additional_redirect_urls`에 `/auth/callback`. 시드는 `email_confirm:true`로 만들어 영향 없음.
- `apps/web`에 Supabase 패키지 0개, vitest 설정 파일 없음(기본 node 환경, `lib/env.test.ts` 패턴). `/dashboard` 라우트는 아직 없음(016).
- 004가 `app/(app)/layout.tsx`에서 `isPlatformAdmin:false` 하드코딩 → 006 뒤 `requireSession` 연결 필요(004 소유, `[REQUEST]`).

## 1. 의존성 (정확 핀, `pnpm view` 2026-10-25 확인)

- `@supabase/ssr` **0.12.7** (peer `@supabase/supabase-js ^2.114.0`), `@supabase/supabase-js` **2.118.0**.
- `apps/web/package.json`은 001 소유 → `[REQUEST] GC-06-006 apps/web/package.json: dependencies에 @supabase/ssr 0.12.7, @supabase/supabase-js 2.118.0, server-only 0.0.1 추가`.
- 시드 스크립트용 → `[REQUEST] GC-06-006 package.json(루트): devDependencies에 @supabase/supabase-js 2.118.0 추가` (scripts/dev는 루트 패키지로 실행됨).
- 0.12.x API: `createServerClient(url, key, { cookies: { getAll, setAll } })`, `createBrowserClient(url, key)`. 사용자 확인은 `supabase.auth.getClaims()`(로컬 JWT 검증, 0.7+부터 권장) — 실제 시그니처는 설치 후 `node_modules` d.ts로 재확인("미확인"이면 `getUser()`로 대체).

## 2. Supabase 클라이언트 3종 (`apps/web/lib/supabase/`가 아니라 소유 경로 `lib/session/`에 둔다)

| 파일 | 내용 | 비밀 |
|---|---|---|
| `lib/session/supabase-server.ts` | `import "server-only"`. `createServerClient(getSupabaseServerUrl(), ANON, {cookies: await cookies()})`. RSC·Route Handler·서버 액션용(RLS 아래 사용자 세션) | anon만 |
| `lib/session/supabase-proxy.ts` | `proxy.ts` 전용: `request.cookies`/`response.cookies` 어댑터로 `createServerClient`. 세션 갱신 쿠키를 응답에 실음 | anon만 |
| `lib/session/supabase-admin.ts` | `import "server-only"`. `createClient(url, SERVICE_ROLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}})`. **Route Handler · 서버 액션에서만** import. 006에서 쓰는 곳 0개(향후 008·013용 자리). 주석에 사용 이유 필수 | service role |
| `lib/session/supabase-browser.ts` | `"use client"` 모듈. `createBrowserClient(NEXT_PUBLIC_*)`. 006에서는 로그아웃 등에 쓰지 않음(서버 액션으로 처리) → **만들지 않는다**(B단계 OAuth에서 필요할 때 036이 추가) | anon |

## 3. `requireSession` · 세션 컨텍스트 (`lib/session/`)

- `lib/session/context.ts`: zod 스키마 `sessionContextSchema`(session_context jsonb 응답 → `SessionContext` 타입; `org` nullable, `plan_code` nullable). 파싱 실패는 500(코어 계약 변경 감지).
- `lib/session/require-session.ts`:
  ```ts
  export const loadSessionContext = cache(async (appId: AppId) => { /* server client → rpc('session_context',{p_app}) 1회 */ })
  export async function requireSession(appId, opts?: { roles?: OrgRole[]; platformAdmin?: boolean }): Promise<SessionContext>
  ```
  - React `cache()`로 같은 서버 요청(RSC 렌더 1회 또는 Route Handler 1회) 안 중복 호출 제거. Route Handler에서도 `cache()`는 요청 단위 스코프로 동작(Next 15+; 설치 후 재확인).
  - 판정 순서(04장 1절): `ctx null` → `SessionError(401)`; `status==='suspended'|'pending'` → 403; `!entitled` → 402; `opts.roles` 있고 `ctx.org?.role`이 목록에 없으면 403(NULL-safe); `platformAdmin` 요구 시 `platform_role!=='platform_admin'` → 403.
  - 쿠키 · 헤더 · 바디의 role/plan은 **읽지 않는다**(`nomad_role` 등 문자열 코드에 없음, 테스트로 grep).
- `lib/session/errors.ts`: `SessionError {status, code: 'UNAUTHENTICATED'|'FORBIDDEN'|'NOT_ENTITLED'}` + `toApiResponse()` (`{error:{code,message}}` 봉투). 사용자 문구는 `lib/copy/errors.ts`(004)에 코드 3개 추가 요청 → `[REQUEST]`.
- 서버 레이아웃용 헬퍼 `redirectForSession(err)`: 401 → `redirect('/login?next=<현재 경로>')`, 403 suspended → `/login?error=suspended`.

## 4. `proxy.ts` (Next 16, 책임 분리)

- 책임 A(모든 매칭 경로): 세션 쿠키 갱신(`supabase-proxy` 클라이언트로 `getClaims()`; DB 호출 없음) → 응답 쿠키 전달.
- 책임 B(보호 접두사 `/dashboard, /sourcing, /products, /upload, /runs, /settings, /billing, /onboarding`): 클레임 없으면 `302 /login?next=<pathname+search>`. 클레임 있고 `/login`이면 `302 /dashboard`(03장 "권한 없음" 행).
- 책임 C(`/admin`, `/api/admin`): 클레임 없음 **또는** `session_context` 결과 `platform_role!=='platform_admin'` → **403**(페이지는 간단한 403 응답, API는 JSON 봉투). 이 경로에서만 proxy가 RPC 1회 호출. 그 뒤 013의 레이아웃/핸들러가 `requireSession`을 다시 부르면 HTTP 요청당 2회가 된다 — proxy는 Node 런타임 별도 스코프라 `cache()` 공유 불가. **수용 기준 "요청당 1회"는 RSC/Route Handler 실행 스코프 기준**으로 해석하고, admin 경로의 추가 1회는 `[DECISION]` 후보로 보고(대안: proxy가 inbound `x-gc-ctx` 헤더를 지우고 자기 결과를 실어 보내기 — 복잡도 증가로 기본안 아님). plan-challenger 판정 요청.
- 책임 D: `/api/dev/login`은 matcher 제외(가드는 핸들러 자체). 웹훅 `/api/webhooks` 제외.
- matcher: 정적 파일 · `_next` · 이미지 제외. 위조 쿠키 `nomad_role`은 어디서도 읽지 않으므로 C에서 403.
- 06-013 수용 기준은 "그 외 404"라 006의 "403"과 다름 → 팀장 확인 필요(기본안: 006 기준 403, 013이 proxy 변경을 `[REQUEST]`).

## 5. 인증 모듈 (`lib/auth/`, `AUTH_MODE`를 읽는 유일한 lib)

- `lib/auth/config.ts`: `getAuthConfig()` = `getServerEnv()`의 `AUTH_MODE`·`AUTH_PROVIDERS` 래핑. `isMockAuthAllowed()`: `AUTH_MODE==='mock'` ∧ `NEXT_PUBLIC_SUPABASE_URL` 호스트 ∈ {localhost,127.0.0.1} ∧ (`SUPABASE_URL_INTERNAL` 없거나 호스트 ∈ {localhost,127.0.0.1,host.docker.internal}) ∧ `VERCEL_ENV`·`RAILWAY_ENVIRONMENT` 비어 있음. 순수 함수 `isMockAuthAllowedFor(env)`를 따로 두어 단위 테스트.
- `lib/auth/personas.ts`: `PERSONAS = ['owner','admin','member','viewer','outsider','no_app','suspended','ops','pro'] as const`, `personaEmail(key) = <key>@dev.test`, 라벨(한국어). 시드 스크립트와 같은 목록을 쓰기 위해 `scripts/dev/personas.json`을 정본으로 두고 양쪽이 읽는다(중복 정의 금지).
- `lib/auth/next-param.ts`: `safeNext(raw: string|null): string` — 디코딩 1회, `/`로 시작, 두 번째 글자가 `/`·`\` 아님, `@`·`\`·제어문자 없음, `/api/`·`/login`·`/auth/` 접두 제외, 길이 ≤ 512 → 통과 아니면 `/dashboard`. 절대 URL 조립은 `NEXT_PUBLIC_APP_URL` origin 고정.
- `lib/auth/finish-login.ts`: `finishLogin(appId, next)` — `loadSessionContext` → `ctx null`이면 signOut 후 `/login?error=callback` → `!entitled`면 `rpc('bootstrap_app_for_org',{p_app_id})` 1회 후 재조회(모놀리스에서는 no-op) → suspended면 signOut 후 `/login?error=suspended` → `safeNext(next)` 반환. 약관 미동의 → `/onboarding` 분기는 기록 방식 미확정(03장 "확정 필요") → **A단계에서는 분기 없음**, 로그에 가정 기록.
- `lib/auth/sign-out.ts`: 서버 액션 `signOutAction()` → `supabase.auth.signOut()` → `redirect('/login')`.

## 6. `/api/dev/login` (`app/api/dev/login/route.ts`)

1. `if (!isMockAuthAllowed()) return new Response(null,{status:404})` — 첫 줄. `requireSession` 예외 경로(04장 9절).
2. 입력: `application/x-www-form-urlencoded` 또는 JSON `{persona, next?}` → zod(`z.enum(PERSONAS)`); 실패 400.
3. `supabase-server` 클라이언트로 `signInWithPassword({email: personaEmail(p), password: DEV_SEED_PASSWORD})`. `invalid_credentials` → 409 "시드 안 됨: `pnpm db:seed-users`" (04장 9절 409).
4. `finishLogin('globalcommerce', next)` → `303 Location`. 세션 쿠키는 ssr 클라이언트가 `cookies()`에 기록(가짜 쿠키 0).
5. `GET`은 405. 로그 0(비밀번호·토큰 미출력).
- `AUTH_MODE=live`면 1번에서 404 → 수용 기준 충족. 파일 자체를 빌드에서 빼지는 않음(04장: "호출이 404").

## 7. 로그인 페이지 (`app/(auth)/login/`)

- `layout.tsx`: 셸 없음, 카드 400px 중앙, 모바일(~767) 테두리 없이 전체 폭 · 좌우 16px(03장 3.16 반응형). 토큰만 사용.
- `page.tsx`(서버 컴포넌트): `searchParams` await → `error` 띠 문구(`lib/copy/login.ts`: callback/state/email_in_use/suspended), `next` 보존. 세션 있으면 `/dashboard`로 redirect(proxy와 이중). `isMockAuthAllowed()`면 `<DevLoginPanel next=…/>` 렌더, 아니면 "현재 로그인 방법이 준비 중입니다"(B 전까지 제공자 버튼 0).
- `dev-login-panel.tsx`(서버 컴포넌트, JS 없음): `<form method="post" action="/api/dev/login">` + hidden `next` + 페르소나 버튼 9개(`name="persona" value=key`, 라벨·역할 설명). 상단 고정 배지 "MOCK AUTH · 로컬 전용"은 로그인 레이아웃에만(모든 화면 배지는 004 셸 → `[REQUEST] app/(app)/layout.tsx: isMockAuthAllowed()일 때 배지 렌더 + requireSession 연결`).
- 로그인 상태 표시·로그아웃 버튼(서버 액션)은 패널 아래.

## 8. 온보딩 기본 단계 (`app/onboarding/`, `terms/` 제외)

- `layout.tsx`: 로고 + "n / 3" Stepper(공용 `components/ui`에 Stepper 없으면 로컬 최소 구현, 004에 승격 요청).
- `page.tsx`: `requireSession('globalcommerce')` 첫 줄 → step 쿼리(`?step=2|3`, 기본 2). 2단계: 주 소싱처·마켓 라디오 + "건너뛰기"(저장 안 함 — 03장 "저장 여부 확정 필요", 로그에 가정). 3단계: "가입 크레딧 N을 드렸습니다"(N은 `ctx.credit_balance` 표시가 아니라 `plans.signup_credits` 조회값 — 서버 정수 그대로) + 주 행동 `/sourcing`, 보조 `/settings/markets`(링크만, 대상 라우트는 후속 task).
- 1단계 약관은 범위 밖. `/onboarding` 진입 분기도 없음(5절).

## 9. 시드 스크립트 (`scripts/dev/seed-users.mjs` + `scripts/dev/personas.json`)

1. 루트 `.env.local` 파서(docker.mjs `parseEnvOutput` 스타일, 값 미출력) → `NEXT_PUBLIC_SUPABASE_URL`(또는 `SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DEV_SEED_PASSWORD`.
2. **첫 검사**: URL 호스트 ∉ {localhost,127.0.0.1} → `console.error` 후 `process.exit(1)`(네트워크 호출 전). `DEV_SEED_PASSWORD`·키 없음 → exit 1. `--app globalcommerce` 외 값 → exit 1.
3. admin 클라이언트(service role). 페르소나 순서: owner → outsider → no_app → admin/member/viewer → suspended → ops → pro.
4. 사용자 생성: `auth.admin.listUsers`로 이메일 조회 → 없으면 `createUser({email, password, email_confirm:true, user_metadata:{full_name:key, signup_app:'globalcommerce'}})`(`no_app`만 `signup_app` 생략) → 있으면 `updateUserById(id,{password})`로 비밀번호 동기화. 트리거가 조직·엔타이틀먼트·크레딧 생성(앱 코드가 조직을 만들지 않음).
5. 역할: anon 클라이언트로 owner `signInWithPassword` → `rpc('invite_member',{p_org_id: ownerOrg, p_user_id, p_role})`; 대상 사용자로 로그인 → `rpc('accept_invite')`(P0002 = 이미 active → 건너뜀). 실제 RPC 경로 검증.
6. `suspended`: service role `profiles.status='suspended'`; `ops`: `platform_role='platform_admin'`.
7. `pro`: 가입 후 service role `rpc('gc_admin_set_plan',{p_org_id, p_plan_code:'pro', p_reason:'dev seed persona pro', p_actor_id: ops.id})` + `rpc('grant_credits',{p_org_id, p_amount:350, p_app_id:'globalcommerce', p_reason:'dev_seed_pro', p_bucket:'pack', p_ref_type:'dev', p_ref_id:'pro', p_idempotency_key:'dev:pro:<org>'})`.
8. 멱등: 두 번 실행 → `credit_ledger` 행 수 변화 0(가입 키·`dev:pro` 키). 끝에 표 출력(키·이메일·org id·plan·잔액, 비밀번호 없음). 종료 코드 0.
9. `package.json` 스크립트 `db:seed-users` 추가 → `[REQUEST]` 루트 package.json.

## 10. 검증 스크립트 (Docker 필요, 소유 경로 `scripts/dev/verify-auth.mjs`)

기동된 로컬 스택(`pnpm dev:docker`)에 대해 Node fetch로: 페르소나 9개 `/api/dev/login` → 쿠키 획득; owner `session_context` entitled·free assert; owner 3회 재로그인 전후 `credit_ledger` count(service role) 동일; outsider 세션으로 owner 조직 `products`·`market_accounts` 0행; `Cookie: nomad_role=SUPER_ADMIN`(세션 없음/ member 세션)으로 `/admin/users` → 403; `next=//evil.com` → Location `/dashboard`; `AUTH_MODE=live` 컨테이너 재기동 뒤 `/api/dev/login` 404(수동 단계, 안내 출력); 원격 URL로 seed 실행 exit 1. 결과를 표로 출력. 이 스크립트가 e2e 대체(`tests/e2e/`는 033 소유).

## 11. 테스트 매핑 (vitest, Docker 불필요 — `apps/web/lib/**/*.test.ts`)

| 수용 항목 | 테스트 | 방식 |
|---|---|---|
| 페르소나 9개 로그인 | `personas.test.ts`: JSON 정본과 enum 일치, 이메일 형식 | 단위 |
| 〃 (실제) | `verify-auth.mjs` | Docker |
| owner entitled·free | `finish-login.test.ts`: mock rpc 응답 → 반환 경로; `verify-auth` | 단위 + Docker |
| 재로그인 3회 원장 동일 | `finish-login.test.ts`: entitled=true면 bootstrap 호출 0; `verify-auth` count | 단위 + Docker |
| outsider 0행 | `verify-auth`(RLS는 003 매트릭스가 정본) | Docker |
| 위조 쿠키 → 403 | `proxy.test.ts`: `nomad_role=SUPER_ADMIN` + mock ctx(member) → 403; 코드베이스 grep 테스트 `nomad_role`·`nomad_plan`·`mock-auth` 0건(lib/auth·session·proxy) | 단위 |
| `next=//evil.com` → `/dashboard` | `next-param.test.ts`: `//evil.com`, `/\evil`, `/@evil`, `%2F%2Fevil`, `/api/x`, `javascript:`, 정상 `/products?x=1` | 단위 |
| session_context 1회 | `require-session.test.ts`: `vi.mock('react',{cache})` 또는 실제 cache + 같은 요청 스코프에서 2회 호출 → rpc mock 1회 | 단위 |
| 역할 판정 | `require-session.test.ts`: null→401, suspended→403, entitled=false→402, role 불일치→403, org null→403 | 단위 |
| mock+production 빌드 실패 | 기존 `env.test.ts` 보강 없음(001 소유). `auth/config.test.ts`: `isMockAuthAllowedFor` 조건 조합 표(원격 호스트·VERCEL_ENV·RAILWAY) | 단위 |
| live → dev/login 404 | `route.test.ts`: `isMockAuthAllowed` mock false → 404, true+모르는 persona → 400, invalid_credentials → 409 | 단위 |
| seed 원격 URL exit 1 | `scripts/dev/seed-users.test.mjs`(vitest 루트 또는 `node --test`): `assertLocalUrl('https://x.supabase.co')` throws; 스크립트를 자식 프로세스로 `SUPABASE_URL=https://x.supabase.co` 실행 → exit 1 | 단위(네트워크 없음) |

테스트에서 `server-only`·`next/headers`·`next/navigation`은 `vi.mock`. 세팅 파일 필요 시 `apps/web/vitest.config.ts`는 001 소유 → `[REQUEST]`(없으면 각 테스트 상단 mock으로 처리).

## 12. 파일 목록 (소유 경로 안)

`apps/web/proxy.ts`, `apps/web/lib/session/{supabase-server,supabase-proxy,supabase-admin,context,require-session,errors}.ts` + 테스트,
`apps/web/lib/auth/{config,personas,next-param,finish-login,sign-out}.ts` + 테스트, `apps/web/lib/auth/copy.ts`(로그인 문구; `lib/copy/`는 004 소유라 auth 아래),
`apps/web/app/(auth)/login/{layout,page,dev-login-panel}.tsx`, `apps/web/app/api/dev/login/route.ts` + `route.test.ts`,
`apps/web/app/onboarding/{layout,page}.tsx`, `scripts/dev/{personas.json,seed-users.mjs,verify-auth.mjs,seed-users.test.mjs}`.

## 13. `[REQUEST]` 목록 (소유 경로 밖)

1. `apps/web/package.json`(001): `@supabase/ssr 0.12.7`, `@supabase/supabase-js 2.118.0`, `server-only 0.0.1`.
2. 루트 `package.json`(001): devDep `@supabase/supabase-js 2.118.0`, 스크립트 `db:seed-users`, `verify:auth`.
3. `app/(app)/layout.tsx`(004): `requireSession` 연결(`isPlatformAdmin = ctx.platform_role==='platform_admin'`), 401 리다이렉트, MOCK 배지.
4. `lib/copy/errors.ts`(004): `UNAUTHENTICATED`·`FORBIDDEN`·`NOT_ENTITLED` 문구.
5. `.env.example`(001): `DEV_SEED_PASSWORD` 주석에 "시드와 웹 서버가 같은 값" 보강(선택).

## 14. 가정 · 질문 (팀장 확인 필요)

- A1. 관리자 거부 코드: 006=403, 013="그 외 404". 기본안 403, 013에서 바꾸려면 proxy `[REQUEST]`.
- A2. "요청당 session_context 1회"는 RSC/Route Handler 스코프 기준. `/admin*`는 proxy 1회 + 레이아웃 1회가 될 수 있음(4절 C). 헤더 전달 대안 채택 여부.
- A3. `isMockAuthAllowed`에 `host.docker.internal` 허용(컨테이너 내부 URL). AUTH_ROADMAP 2.4절에는 없음 → GC-D-26 때문에 추가, 공개 URL은 여전히 localhost만.
- A4. 온보딩 약관 기록 방식·사업 정보 저장은 미확정 → A단계는 분기 없음, 저장 없음.
- A5. 보호 접두사 목록은 00장 5.2 경로에서 가져오되 R1 라우트만. `/dashboard`가 없으므로 로그인 성공 뒤 404가 보일 수 있음(016 전까지) — 임시 페이지는 만들지 않음(소유 밖).
- A6. `getClaims()` 시그니처·`cache()`의 Route Handler 스코프는 설치 뒤 d.ts로 확인, 불일치 시 `getUser()`/명시적 per-request Map으로 대체하고 보고.
- A7. 로컬 `jwt_expiry=3600`, 세션 갱신은 proxy A 책임으로 충분(브라우저 클라이언트 없음).
- A8. 시드가 `admin.listUsers` 페이지네이션(기본 50)으로 조회 — 페르소나 9개라 1페이지 가정.
