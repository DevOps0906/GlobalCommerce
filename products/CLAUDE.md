# CLAUDE.md: GlobalCommerce 제품 개발 규칙

개발 에이전트가 코드를 쓸 때 따르는 제품 규칙이다. 팀 운영(팀장 세션, 에이전트 호출, 작업 기록, 보고)은 루트 `CLAUDE.md`와 `develop/MULTI_AGENT.md`가 정하고 여기서 반복하지 않는다. 이 문서와 `00_DECISIONS.md`가 `docs/spec/CLAUDE.md`(v3.0.0)와 원본 프로젝트 관행보다 우선한다. 근거 없는 수치는 "제안", 확인하지 않은 외부 사실은 "미확인"으로 쓴다.

## 1. 먼저 읽을 문서

| 순서 | 문서 | 언제 |
|---|---|---|
| 1 | 루트 `CLAUDE.md`, `develop/MULTI_AGENT.md`, `tasks/README.md` | 모든 작업 시작 전(팀 운영, 작업 기록 형식) |
| 2 | `products/00_DECISIONS.md` | 항상. 결정·ID·테이블·잡·오류 코드의 정본 |
| 3 | `06_AGENT_PLAN.md`의 자기 작업 행(소유 경로, 의존, 수용 기준) | 항상 |
| 4 | `01_PRD.md` → `02_ARCHITECTURE.md` → `05_DATA_MODEL.md` → `04_API.md` → `03_SCREENS_UX.md` | 자기 작업과 관련된 장 |
| 5 | `07_SOURCE_MIGRATION.md` 5절(복사 금지 결함) | 원본 자산을 참고하는 작업 |
| 6 | `docs/design/dashboard/README.md`와 해당 `.dc.html`, `docs/design/structure-map.html` | 화면 작업 |
| 7 | platform-docs `products/_platform-core/`의 `SECURITY_BASELINE.md`, `AUTH_ROADMAP.md`, `MONOLITH_CORE_LITE.sql` | DB·인증·결제·키 작업 |

## 2. 절대 규칙

| 규칙 | 내용 |
|---|---|
| service_role | `SUPABASE_SERVICE_ROLE_KEY`와 admin 클라이언트는 Route Handler와 워커에서만. `NEXT_PUBLIC_` 접두사 금지, 클라이언트 컴포넌트에서 import 금지 |
| 크레딧 선차감 | 유료 작업은 Route Handler 안에서 `withCredits`(코어 `consume_credits`) → 잡 enqueue 또는 작업 → 실패 시 `refund_credits`. 별도 차감 API를 만들지 않는다. 잡에는 `credit_ledger_id`를 싣는다 |
| 플랜은 서버에서 | 판정은 `session_context` + `entitled_plan_code` + `plans.features`만. 요청 바디·쿠키·쿼리·브라우저 저장소의 plan, role, model, provider 값은 읽지 않는다. 한도는 DB 트리거가 최종 집행(GC002, GC003, GC008) |
| 마켓·SNS 키 | `encrypted_credentials`에만 저장. 응답은 마스킹, 로그·오류 메시지·AI 입력에 넣지 않는다. 복호화는 워커(`services/worker/src/upload/`, `sns/`, `blog/`)와 `apps/web/lib/credentials/`의 검증 함수에서만 |
| compliance | 금지어 판정 FAIL이면 업로드·내보내기 차단(GC004). WARN은 확인 RPC로 사용자 확인을 기록한 뒤에만 진행(GC005). 사전은 `banned_words` 하나 |
| 금지 AI 출력 | 후기·평점·"전문가 추천", "단순 변심 반품 불가", "이 제품은 건강기능식품이 아닙니다" 자동 문구, 질병 효능 단정, 상품 행에 없는 수치, LLM 추정 환율, 이미지 모델에 한글 글자 요청(한글은 Sharp 후합성). 위반 출력은 저장하지 않고 FAIL 처리 |
| LLM 키(GC-D-08) | LLM·이미지·임베딩 제공자 키는 서버 env(Vercel 서버 함수, 워커)에만. `packages/ai`는 `server-only`를 import한다. 브라우저는 `/api/*`만 부르고 제공자를 직접 호출하지 않는다. FastAPI·Dify·LangGraph는 R3 판단 전까지 넣지 않는다 |
| 브라우저 저장소 | localStorage·sessionStorage·IndexedDB·쿠키에 키, 토큰, 역할, 플랜, 크레딧을 두지 않는다. UI 편의 상태(사이드바 접기, 표 열 너비, 저장 안 한 입력 초안)만 허용 |
| 외부 URL | 사용자가 준 URL은 `packages/net` 안전 fetch로만, 허용 도메인 밖이면 GC010. 아마존 페이지를 직접 긁지 않는다(O-02 공급자 어댑터) |
| Tailwind | 반드시 Tailwind CSS v4. CSS 우선 설정(`@import "tailwindcss"`, `@theme`, `@custom-variant dark`). `tailwind.config.js`, `@tailwind base` 같은 v3 문법 금지. 지시·문서에 "Tailwind"가 아니라 "Tailwind CSS v4"라고 쓴다 |
| 디자인 토큰 | 정답은 `apps/web/styles/tokens.css`(`@theme`) 하나. 값의 출처는 `docs/design/dashboard/README.md` 토큰 표(GC-D-19). 컴포넌트에 hex·`bg-[#...]` 금지, 포인트 색은 민트 1색, 상태색은 배지·진행 표시에만 |
| 범위 | 00장 5.1절 기능 ID 밖의 기능을 만들지 않는다. R2·R3 메뉴와 화면은 해당 릴리스 전까지 렌더하지 않는다(숨김). 플랜 잠금은 숨기지 않고 잠금 배지 |
| 소유 경계 | 자기 작업의 소유 경로 밖 파일은 고치지 않는다. 필요하면 task `log.md`에 1줄 요청(06장 2.1절) |

## 3. 디렉토리와 소유 경계

| 경로 | 내용 | 소유 작업(06장 2절) |
|---|---|---|
| 루트 설정, `.github/workflows/`, `apps/web/lib/env.ts`, `services/worker/src/env.ts` | 모노레포, CI, env 검증 | 001 |
| `supabase/` | 마이그레이션(R1 002, R2·R3는 작업별 새 파일), seed, config | 002, 037, 039, 040, 042, 045 |
| `tests/rls/`, `tests/e2e/billing/`, `tests/e2e/responsive/`, `tests/e2e/` 나머지 | RLS, 결제 E2E, 반응형, 핵심 흐름 | 003, 009, 035, 033 |
| `packages/domain/` | 상수, zod, 플랜 features, 단가, 마진, 마켓 규격, nav(`workflow/` 037, `jsonld/` 046) | 005 |
| `packages/compliance/` | 금지어 매처 | 021 |
| `packages/ai/` | 제공자 어댑터, 체인 규약(`chains/<기능>/`은 기능 작업) | 020(+022, 023, 025, 039, 040, 045) |
| `packages/net/` | 안전 fetch | 007 |
| `packages/sourcing/{amazon,excel}/` | 수집 | 017, 018 |
| `packages/markets/{coupang,smartstore,export}/` | 마켓 어댑터, 내보내기 양식 | 027, 028, 031 |
| `packages/render/{image,market,video}/` | Sharp 합성, 마켓 규격 변환·분할, FFmpeg | 023, 025, 040 |
| `apps/web/app/(app)/<화면>/`, `components/<영역>/` | 화면 | 06장 2절 표 |
| `apps/web/app/api/<영역>/` | Route Handler | 06장 2절 표 |
| `apps/web/styles/tokens.css`, `components/{ui,shell}/`, `lib/copy/errors.ts` | 토큰, 공용 셸, 오류 문구 | 004 |
| `apps/web/lib/{auth,session}/`, `proxy.ts`, `app/(auth)/login/`, `app/api/dev/login/` | 인증 Stage A | 006 |
| `services/worker/src/runtime/`, `Dockerfile` | 잡 루프, 디스패처, 크론 로더 | 007 |
| `services/worker/src/<영역>/{handler,cron}.ts` | 핸들러·크론(자동 로드) | 각 기능 작업 |
| `scripts/dev/`, `scripts/security/` | 시드 페르소나, 보안 검사 | 006, 034 |

공용 인덱스 파일(핸들러 목록, 체인 목록, 라우트 목록)을 만들지 않는다. 앱과 워커는 `packages/*`로만 코드를 공유한다.

## 4. 코어 사용 규칙

| 용도 | 쓰는 것 |
|---|---|
| 세션 | `requireSession('globalcommerce', { roles })` → `session_context` 요청당 1회 |
| 크레딧 | `withCredits({ requestId, feature })`, 멱등 키 `consume:globalcommerce:<request_id>`. 단가는 `packages/domain`의 표(01장) |
| 잡 | 코어 `enqueue_job`, 큐 `gc.<영역>`, `job_type`은 00장 5.4절 이름만, 멱등 키 `job:globalcommerce:<request_id>`, `credit_ledger_id` 첨부 |
| 실행 기록 | 사용자에게 보이는 단위는 `workflow_runs`(R1은 kind `system`)·`workflow_run_steps`. 워커 런타임 헬퍼로만 쓴다 |
| 진행률 | 워커가 행을 갱신하고 화면은 Supabase Realtime 구독. SSE·폴링 루프·브라우저 큐 금지 |
| 자격증명 | `encrypted_credentials` 저장, 해제는 `revoke_credential`, 키 `CREDENTIALS_KEY` 없으면 기동 실패 |
| 감사 | 역할·플랜 변경, 마켓 계정 추가·해제, 내보내기, 환불, WARN 확인은 `write_audit` 1행 |
| Storage | `<org_id>/globalcommerce/<entity>/<uuid>.<ext>`. 내보내기는 서명 URL 7일. 외부 제공자 URL을 정본으로 저장하지 않는다 |
| 오류 | SQLSTATE `GC001`~`GC010`, 코어 `CR001` → HTTP는 00장 5.5절, 사용자 문구는 `apps/web/lib/copy/errors.ts` |
| 결제 | Toss 금액은 DB(`plans`, `credit_packs`, 추가 슬롯 가격)에서만, customerKey `org_<id>`, 웹훅은 서명 검증 + 멱등 |

## 5. 코드 규칙

| 항목 | 규칙 |
|---|---|
| 스택 | Next.js 16 App Router(문서 기준 16.2.7, GC-06-001이 lockfile로 고정), React 19, TypeScript strict, zod 4, Zustand 5(UI 상태만), shadcn/ui(Tailwind CSS v4 지원 버전), Lucide 아이콘, @xyflow/react 12(R2만, `reactflow` 금지), Node 22 워커, Sharp, FFmpeg(R2). `latest` 금지, lockfile 커밋 |
| Next 16 | 미들웨어는 `proxy.ts`. `cookies()`·`headers()`·`params`는 await |
| 데이터 | 서버 컴포넌트 우선, 쓰기는 Route Handler. 서버 데이터를 Zustand에 복제하지 않는다. 클라이언트 캐시 라이브러리 도입 여부는 02장을 따른다 |
| 검증 | 요청 바디, 외부 API 응답, AI 출력, env, 엑셀 행 전부 zod. 실패는 400 또는 잡 실패로 처리하고 `JSON.parse` 결과를 그대로 쓰지 않는다 |
| 타입·린트 | `any` 금지(`no-explicit-any`), `console` 금지(로거), DB 타입은 `supabase gen types` 생성물만 |
| 외부 호출 | `AbortSignal.timeout`, 재시도는 멱등한 호출만, 실패를 목 응답으로 숨기지 않는다 |
| 컴포넌트 | 300줄 이하(제안), 5,000행 이상 표는 가상 스크롤, 이미지는 `next/image`, 아이콘만 있는 버튼은 `aria-label` |
| 문구 | 버튼은 동사로 시작("생성 시작", "저장하기"), "확인"·"OK" 단독 금지, 오류는 해결책 포함, 금액은 `packages/domain`의 원화 포맷 함수(세 자리 콤마) |
| 접근성 | 진행 표시 `role="progressbar"`·`aria-valuenow`, 진행 상태 `aria-live="polite"`, `prefers-reduced-motion` 처리, 대비 4.5:1(흰 글자 위 민트 채움 금지, 버튼은 진한 포인트 토큰) |
| 폼 | `<form>` 사용 가능(v3의 금지 규칙 폐기). 제출은 Route Handler 호출 |

## 6. 반응형 규칙(GC-D-20)

| 구간 | 폭 | 셸 | 페이지 제목 | 핵심 숫자(Bebas Neue) |
|---|---|---|---|---|
| 모바일 | ~767px | 하단 탭 5개 | 20px | 44px |
| 태블릿 | 768~1199px | 아이콘 레일 64px + 햄버거 | 22px | 52px |
| 데스크탑 | 1200px~ | 사이드바 240px | 24px | 68px |

| 항목 | 규칙 |
|---|---|
| 공통 글자 | 본문 14px, 표 13px(세 구간 같음). 다른 크기는 `tokens.css`에 정의된 단계만 |
| 중단점 | `tokens.css` `@theme`에 768px·1200px 두 개만 정의(제안: `--breakpoint-tablet`, `--breakpoint-desktop`)하고 Tailwind CSS v4 기본 `sm`·`lg` 등을 화면 코드에서 섞어 쓰지 않는다 |
| 레이아웃 | 페이지 가로 스크롤 0. 넓은 표는 표 컨테이너 안에서만 가로 스크롤하거나 모바일에서 카드 목록 |
| 터치 | 터치 대상 44px 이상 |
| 기준 화면 | 데스크탑은 각 `.dc.html`, 태블릿은 `TabletDashboard`, 모바일은 `MobileDashboard`·`MobileUpload`. 디자인이 없는 구간은 같은 셸 규칙으로 03장이 정한다 |
| 검증 | GC-06-035가 390·834·1280px에서 계산된 글자 크기와 가로 스크롤을 검사 |

## 7. 테스트와 완료 조건

| 검사 | 명령(제안, GC-06-001이 스크립트 이름 확정) |
|---|---|
| 타입·린트·빌드 | `pnpm -r typecheck && pnpm -r lint && pnpm -r build` |
| 단위 | `pnpm --filter ./packages/<이름> test`, `pnpm --filter ./services/worker test` |
| DB | `supabase db reset`(2회), `pnpm test:rls`(`tests/rls/`) |
| E2E | `pnpm test:e2e`(Mock 페르소나 `storageState`), 결제 `tests/e2e/billing/`, 반응형 `tests/e2e/responsive/` |
| 보안 | `node scripts/security/check.mjs`(GC-06-034) |

작업 완료는 06장 2절 수용 기준 전부 통과 + 06장 1.1절 검증 에이전트 결과 + task `log.md` 기록이다. 제품 완료 정의는 06장 7절.

## 8. 금지 패턴

07장 5절 요약: 공개 AI 프록시와 CORS `*`, 클라이언트 한도 판단, 분리된 크레딧 차감과 비원자 차감, 바디의 plan·model, 무서명 웹훅, `USING(true)`·`FOR ALL` 정책, 쿠키·브라우저 저장소의 역할·플랜·키, 평문 키 응답, 사용자 URL 직접 fetch와 원문 HTML 저장, 요청의 테이블 이름, 한글에 `\b` 정규식, `globalThis` 잡, 엣지 무시 실행과 HTTP 자기 호출, SSE + 브라우저 큐, env 단일 마켓 키, LLM 추정 환율, AI 후기·평점, 반품 불가·건기식 부정 자동 문구, JSON-LD `brand` 하드코딩, 콜백 `next` 미검증, 0키 폴백, mock 응답으로 장애 숨기기, "Tailwind"만 적은 지시, 컴포넌트 hex.

## 9. 인증 단계 규칙(GC-D-07)

정본은 platform-docs `products/_platform-core/AUTH_ROADMAP.md`. 제품 적용값은 01장 GC-F-001, 06장 GC-06-006·036·044.

| 항목 | 규칙 |
|---|---|
| 지금 단계 | A(Mock). 로컬 `.env.local`은 `AUTH_MODE=mock`, `DEV_SEED_PASSWORD`. 실제 제공자 버튼은 B(GC-06-036)부터, 카카오·네이버는 C(GC-06-044) |
| 분기 위치 | `AUTH_MODE`·`AUTH_PROVIDERS`는 `apps/web/lib/auth/`, `app/(auth)/`, `app/auth/`, `app/api/dev/login/`에서만 읽는다. 기능 코드·워커에 `if (mock)`·페르소나 이메일 분기 금지 |
| 페르소나 | `supabase db reset` → `node scripts/dev/seed-users.mjs`(로컬 URL만, 원격이면 종료) → `/login` 개발용 패널. 키 `owner`, `admin`, `member`, `viewer`, `outsider`, `no_app`, `suspended`, `ops`, 제품 `pro`(제안) |
| 금지 | 쿠키·브라우저 저장소에 역할·플랜(`nomad_role`, `nomad_plan`, `mock-login`, `mock-auth`), 가짜 세션 쿠키, 원격 DB 시드 계정, `DEV_SEED_PASSWORD`를 `NEXT_PUBLIC_*`에, 가드 없는 `/api/dev/login`(판정 거짓이면 404). `AUTH_MODE=mock VERCEL_ENV=production` 빌드는 실패해야 한다 |
| 단계 전환 | 에이전트가 단계를 올리지 않는다. 대표님이 G1·G2를 판정해 task `log.md`에 `[DECISION] G1 통과`·`[DECISION] G2 통과`를 남긴 뒤에만 036·044를 시작한다(06장 3절) |

## 10. `docs/spec/CLAUDE.md`(v3.0.0)에서 넘어온 규칙과 대체된 규칙

| v3 규칙 | 처리 | 이 문서의 위치 |
|---|---|---|
| 노드 미연결 상태 실행 금지 | 유지(R2) | 06장 GC-06-037·038 |
| API 키 하드코딩 금지, 서버 인증 체크 필수 | 유지·강화(서버 판정만) | 2절 |
| 이미지 모델에 한글 글자 요청 금지 → Sharp 후합성 | 유지 | 2절 금지 AI 출력 |
| 버튼 배경 `#007A64`, 플레이스홀더 `#94A3B8` | 유지(hex가 아니라 토큰으로) | 2절 디자인 토큰, 5절 접근성 |
| 버튼 동사 시작, 금액 콤마, `role="progressbar"`, reduced-motion, 44px | 유지 | 5절, 6절 |
| 5,000행 이상 가상 스크롤, `next/image`, 서버 컴포넌트 우선 | 유지 | 5절 |
| 폴링 금지 → SSE 또는 Realtime | 대체: Realtime만, SSE 금지 | 4절 진행률 |
| localStorage·sessionStorage 전면 금지(아티팩트 규칙) | 대체: 비밀·권한 저장 금지, UI 상태는 허용 | 2절 브라우저 저장소 |
| `<form>` 태그 금지 | 폐기 | 5절 폼 |
| `@xyflow/react v11` | 대체: 12 | 5절 스택 |
| TanStack Query 필수, Zustand 생성 큐 | 대체: 서버 컴포넌트 + 워커 + Realtime, 캐시 라이브러리는 02장 | 5절 데이터 |
| `src/` 단일 앱 구조, `lib/supabase/middleware.ts` | 대체: pnpm 모노레포, `proxy.ts` | 3절, 5절 Next 16 |
| shadcn `latest`, `create-next-app@latest` | 대체: 버전 고정 | 5절 스택 |
| env 단일 마켓 키, 5개 통화 환율, 엑셀 5종, DALL-E 3 고정 | 대체: 조직별 암호화 키, USD·CAD(GC-F-101), 오너클랜·도매꾹(GC-F-105), 이미지 어댑터(GC-D-09) | 2절, 00장 |
| MVP 체크리스트(8마켓 일부, 카드뉴스, n8n·Make) | 대체: 릴리스 R1~R3(GC-D-02) | 06장 3절 |
