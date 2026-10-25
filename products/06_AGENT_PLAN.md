# 06 에이전트 작업 계획: GlobalCommerce

작성일 2026-10-25. 작업 ID는 `GC-06-###`이고 번호·이름·웨이브는 `00_DECISIONS.md` 5.6절이 정본이다. 이 문서는 그 47개 작업을 소유 경로, 의존, 담당, 수용 기준으로 풀어 쓴다. 벤치마크는 platform-docs `products/nomad-commerce/06_AGENT_PLAN.md`다. 원본·디자인·PRD에 근거가 없는 수치는 "제안", 외부 사실을 확인하지 않은 곳은 "미확인"으로 쓴다.

팀 운영(팀장 세션의 지시 방식, 에이전트 호출, 작업 기록, 보고 형식)은 루트 `CLAUDE.md`와 `develop/MULTI_AGENT.md`, 작업 기록 형식은 `tasks/README.md`·`tasks/TEMPLATE.md`를 따른다. 이 문서는 "무엇을 누가 어디까지"만 정한다.

## 1. 원칙과 소유 경계

| 원칙 | 내용 |
|---|---|
| 디렉토리 단위 소유 | 작업마다 디렉토리(또는 파일)를 하나 이상 소유하고 다른 작업의 소유 경로를 고치지 않는다. 필요한 변경은 소유 작업에 "1줄 요청"으로 남기고(task `log.md`), 소유 작업 담당이 반영한다 |
| 공유 등록 지점 없음 | 워커 핸들러는 `services/worker/src/<영역>/handler.ts`, 크론은 같은 폴더 `cron.ts` 규약으로 런타임(GC-06-007)이 자동 로드한다. AI 체인은 `packages/ai/chains/<기능>/`를 경로로 import한다(GC-06-020이 `exports` 와일드카드를 둔다). 메뉴는 `packages/domain/src/nav.ts`(GC-06-005) 한 곳. 공용 인덱스 파일을 여러 작업이 고치지 않는다 |
| 패키지 경계 | `apps/web`과 `services/worker`는 `packages/*`만 공유한다. 앱이 워커 코드를, 워커가 앱 코드를 import하지 않는다 |
| 코어 불변 | 코어 lite 마이그레이션(platform-docs `MONOLITH_CORE_LITE.sql` 복사본)은 고치지 않는다. 코어 함수·테이블이 부족하면 6절 외부 준비물이 아니라 task `log.md`에 `[REQUEST] core`로 남기고 팀장이 판단한다 |
| 마이그레이션 | R1 테이블은 GC-06-002가 만든다. R2·R3 테이블은 해당 작업이 새 마이그레이션 파일 1개씩을 소유하고(`supabase/migrations/<번호>_gc_<영역>.sql`) 기존 파일을 고치지 않는다. 모든 마이그레이션은 `contract-reviewer`와 `security-auditor`를 거친다 |
| 테스트 동반 | 수용 기준의 자동 테스트는 작업 안에서 만든다. 교차 검증은 GC-06-003(RLS), GC-06-009의 `tests/e2e/billing/`(결제), GC-06-033(핵심 흐름), GC-06-034(보안), GC-06-035(반응형)가 맡는다 |
| 화면 진입 조건 | 화면 작업(012, 016, 019, 022, 024, 026, 030, 032, 037, 041, 047)은 GC-06-004(토큰·공용 셸)가 끝난 뒤 시작한다 |
| 모델 배치 | 고문 Fable 5.1: 결제, 권한, RLS, 데이터 모델, 인증처럼 실수 비용이 큰 작업 / 주 Opus 5.5: 기능 설계, 외부 연동, 잡, 검증 / 대리 Sonnet 5.5: 화면, 컴포넌트, 셸 / 사원 Haiku 5.5: 보일러플레이트, 문구 상수, 점검 체크리스트(00장 5.6절) |
| 모델 표기 | 2장 "담당"의 모델이 그 작업의 구현 모델이다. 에이전트 파일에 기본 모델이 따로 적혀 있어도 팀장이 호출할 때 이 표의 모델로 지정한다(제안) |

### 1.1 에이전트 파일과 맡는 범위

| 에이전트 파일(`.claude/agents/`) | 맡는 범위 |
|---|---|
| `advisor` | 고문(Fable 5.1). Fable 작업의 설계 검토, 게이트 G1·G2·R1 판정 자료 검토, 열린 결정(O-xx) 선택지 정리. 코드를 직접 쓰지 않는다 |
| (팀장, 주 세션 Opus 5.5) | 작업 배정, 웨이브 진행, 1줄 요청 중재, 검증 결과 판정. 파일이 아니라 루트 `CLAUDE.md`가 규칙 |
| `nextjs-expert` | `apps/web`의 Route Handler, 인증, 결제, 서버 컴포넌트 |
| `supabase-expert` | `supabase/`(마이그레이션, seed, RPC, 트리거), `tests/rls/`, 검색 RPC |
| `worker-expert` | `services/worker`, `packages/*`(domain, compliance, ai, net, sourcing, markets, render) |
| `sub-agent-1` | 대리(Sonnet 5.5). 화면, 컴포넌트, 셸 |
| `sub-agent-2` | 사원(Haiku 5.5). 보일러플레이트, 문구 상수(`apps/web/lib/copy/`), 점검 스크립트, 체크리스트 |

| 검증 에이전트 | 실행 시점 |
|---|---|
| `review-expert` | 모든 작업의 완료 직전(2장에서는 생략하고 공통으로 적용) |
| `plan-challenger` | 규모 L 작업과 Fable 작업은 착수 전에 계획 반박 1회 |
| `contract-reviewer` | API·DB·잡 계약(00장 5.3~5.5절, 04·05장)을 만들거나 쓰는 작업 |
| `security-auditor` | 인증, 결제, 크레딧, 키·토큰, RLS, 외부 fetch, 파일 업로드를 다루는 작업 |
| `test-writer` | 수용 기준에 자동 테스트가 있는 작업에서 테스트 보강·누락 점검 |

## 2. 작업 목록

규모: S(반나절~1일), M(2~3일), L(4일 이상). 모두 제안. 경로는 저장소 루트 기준이고 `web/`은 `apps/web/`, `worker/`는 `services/worker/src/`의 줄임이다.

| ID | 작업 | 웨이브 | 릴리스 | 규모 | 소유 경로 | 의존 | 담당 | 수용 기준 | 기능 ID |
|---|---|---|---|---|---|---|---|---|---|
| GC-06-001 | 모노레포·CI: pnpm 워크스페이스, TypeScript strict 기본 설정, ESLint, 앱·워커 골격, env 검증, CI | W0 | R1 | M | `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.config.mjs`, `.github/workflows/`, `web/{package.json,next.config.ts,lib/env.ts}`, `services/worker/{package.json,src/env.ts}`, `.env.example`(앱·워커), `docker-compose.yml`, `.dockerignore`, `apps/web/Dockerfile.dev`, `scripts/dev/docker.mjs` | 없음 | Sonnet · `nextjs-expert` / `security-auditor` | `pnpm install --frozen-lockfile`·typecheck·lint·build·test가 CI에서 PR마다 실행되고 실패 시 머지 차단. 의존성에 `latest` 0건, lockfile 커밋. Next.js 16 App Router, React 19, Tailwind CSS v4(`@import "tailwindcss"`), `tailwind.config.js` 0. 린트 `no-explicit-any`·`no-console` 오류. env zod 검증: 필수 키 누락 시 앱·워커 기동 실패, `NEXT_PUBLIC_`에 `SERVICE_ROLE`·`OPENAI`·`ANTHROPIC`·`TOSS_SECRET` 이름 0. Docker Desktop 기준(GC-D-26): `pnpm dev:docker` 한 번으로 Supabase 로컬 스택 기동·`db reset`·`docker compose up`(web 3000, worker)이 순서대로 실행되고, 웹·워커 컨테이너가 `host.docker.internal:54321`로 Supabase에 붙는다. `docker compose config` 통과, 이미지에 비밀 값 0(빌드 인자·COPY .env 금지), `.env.local` 커밋 0. 외부 API 기본값은 가짜 어댑터 | - |
| GC-06-002 | DB 마이그레이션: 코어 lite 복사 + 도메인 R1 테이블, RLS, 한도·상태 트리거, 오류 코드, seed, 타입 생성 | W0 | R1 | L | `supabase/migrations/20261025000001_core_lite.sql`, `20261025000002_gc_domain_r1.sql`, `supabase/seed.sql`, `supabase/config.toml`, `scripts/db/gen-types.mjs`, `web/types/supabase.ts`(생성물) | 없음 | Fable · `supabase-expert` / `plan-challenger`, `contract-reviewer`, `security-auditor` | `supabase db reset` 2회 연속 성공. 코어 lite가 platform-docs 원본과 diff 0. 00장 5.3절 R1 도메인 테이블 전부 `org_id`·RLS·`with check`, `FOR ALL` 정책 0. `fx_rates`·`trend_keywords`·`season_picks`는 로그인 사용자(authenticated) 읽기만(anon 0행), 쓰기 service_role만. 트리거: 상품 수 GC002, 마켓 슬롯(플랜 + `slot_addons`) GC003(생성 시 + 다운그레이드 뒤 전송 시), 상태 전이 GC001. GC008은 트리거가 아니라 디스패처(`gc_release_held_jobs`) 보류 · 202(00장 5.5). seed의 `plans` 4행이 GC-D-04 값과 스냅샷 일치, `apps.id='globalcommerce'`, `banned_words` 기본 사전(org null). `supabase gen types` 결과 커밋 | GC-F-002, 004, 005 |
| GC-06-003 | RLS·권한 회귀 테스트 | W0 | R1 | M | `tests/rls/` | 002 | Fable · `supabase-expert` / `security-auditor`, `test-writer` | 테이블 × 역할(owner, admin, member, viewer, outsider, anon) 매트릭스 전부 통과. 다른 조직 행 0, viewer 쓰기 거부, `profiles`의 역할·플랜 자기 수정 거부, `wallets`·`credit_ledger` 직접 쓰기 거부, `encrypted_credentials` 사용자 읽기 0행. CI 실패 시 머지 차단 | GC-F-002, 005 |
| GC-06-004 | 디자인 토큰과 공용 셸(사이드바, 상단 바, 모바일 하단 탭 5개, 태블릿 아이콘 레일) | W0 | R1 | M | `web/styles/tokens.css`, `web/app/{layout.tsx,globals.css}`, `web/app/(app)/layout.tsx`, `web/components/{ui,shell}/`, `web/app/dev/components/`, `web/lib/copy/errors.ts` | 001 | Sonnet · `sub-agent-1` / - | 토큰 값이 `docs/design/dashboard/README.md` 표와 스크립트 비교로 일치. 컴포넌트에 hex 0(`bg-[#` 린트 차단), 라이트 기본·다크 토큰 정의만(O-08). 셸 3구간이 GC-D-20 그대로(모바일 ~767 하단 탭 5, 태블릿 768~1199 레일 64px + 햄버거, 데스크탑 1200~ 사이드바 240px). 메뉴는 `packages/domain/src/nav.ts`만 읽고 R2·R3 메뉴는 렌더하지 않음. `/dev/components`는 프로덕션 빌드 제외 | - |
| GC-06-005 | 도메인 패키지: 상수, zod 스키마, 플랜 features 파서, 크레딧 단가, 마진 계산, 마켓 규격(쿠팡·스마트스토어), 단계 이름, nav | W0 | R1 | M | `packages/domain/`(`workflow/`, `jsonld/` 제외) | 없음 | Opus · `worker-expert` / `contract-reviewer`, `test-writer` | 단위 테스트: features 누락 키 기본값, 플랜 한도가 GC-D-04와 일치, 마진 공식(환율·관부가세·배송비) 경계값, 쿠팡 상세 1000px·분할 2,800px 규격, `workflow_run_steps` 단계 이름 상수가 01장과 일치. 요청 바디 스키마는 `plan`·`role`·`model` 필드를 받지 않음 | GC-F-004, 005, 101 |
| GC-06-006 | 인증 Stage A: Mock 로그인(로컬 시드 계정으로 실제 Supabase JWT), `proxy.ts`, `requireSession`, 시드 스크립트, 온보딩 기본 단계 | W0 | R1 | M | `web/lib/{auth,session}/`(`auth/naver/` 제외), `web/proxy.ts`, `web/app/(auth)/login/`, `web/app/api/dev/login/`, `web/app/onboarding/`(`terms/` 제외), `scripts/dev/` | 001, 002 | Fable · `nextjs-expert` / `plan-challenger`, `security-auditor`, `test-writer` | 페르소나 `owner`·`admin`·`member`·`viewer`·`outsider`·`no_app`·`suspended`·`ops` + 제품 `pro`(제안) 로그인. `owner` → `session_context('globalcommerce')` entitled·plan `free`, 재로그인 3회 뒤 크레딧 원장 행 수 같음. `outsider`로 다른 조직 0행, 쿠키 `nomad_role=SUPER_ADMIN` 위조 시 관리자 403, `next=//evil.com` → `/dashboard`, 요청당 `session_context` 1회. `AUTH_MODE=mock VERCEL_ENV=production` 빌드 실패, `AUTH_MODE=live`에서 `/api/dev/login` 404, 시드 스크립트는 원격 URL이면 exit 1 | GC-F-001(A), 002 |
| GC-06-007 | 워커 런타임: 잡 claim 루프, 핸들러·크론 자동 로드, 조직별 동시성, 하트비트·취소·재시도, 시스템 실행 기록 헬퍼, 안전 fetch 패키지, 워커 Docker 이미지 | W0 | R1 | L | `worker/runtime/`, `services/worker/Dockerfile`, `packages/net/` | 002, 005 | Opus · `worker-expert` / `plan-challenger`, `security-auditor`, `test-writer` | 코어 `claim_jobs`·`heartbeat_job`·`complete_job`·`fail_job`·`reap_stale_jobs` 사용. pro 조직 5건 요청 시 running 최대 2(GC-D-04), 초과분은 GC008 대기. 워커 재시작 후 잡 재개, 3회 실패 시 `refund_credits` 1행. `workflow_runs`(kind `system`)·`workflow_run_steps` 기록 헬퍼. `packages/net`: 허용 도메인, DNS 해석 후 사설 IP 차단(169.254.169.254, 10.0.0.0/8, IPv6 루프백), 리다이렉트 3회, 2MB, 10초, 리바인딩 테스트 차단. 이미지에 Node 22, Sharp, Noto Sans KR. 같은 Dockerfile이 `docker-compose.yml`의 `worker` 서비스(001)와 Railway 배포에 쓰이고, 컨테이너 안에서 `host.docker.internal:54321` Supabase에 붙어 잡을 처리한다(GC-D-26) | GC-F-401(기반) |
| GC-06-008 | 플랜·크레딧 API와 서버 헬퍼(`withCredits`, 플랜 판정) | W1 | R1 | M | `web/lib/{credits,plan}/`, `web/app/api/{plan,credits}/` | 005, 006 | Fable · `nextjs-expert` / `plan-challenger`, `contract-reviewer`, `security-auditor`, `test-writer` | 잔액 부족 402(CR001)이고 잡 0건. 같은 `request_id` 2회 → 원장 1행(멱등 키 `consume:globalcommerce:<request_id>`). 작업 실패 시 환불 1행. 바디의 `plan:'enterprise'` 무시(테스트). 플랜 밖 기능 GC007 403. 판정은 `entitled_plan_code` + `plans.features`만 | GC-F-002, 004, 005 |
| GC-06-009 | Toss 구독(빌링키)·크레딧팩, 웹훅, 플랜·결제 화면, 결제 E2E | W1 | R1 | L | `web/app/api/billing/`, `web/app/api/webhooks/toss/`, `web/app/(app)/billing/`, `web/components/billing/`(`addon/` 제외), `tests/e2e/billing/` | 008 | Fable · `nextjs-expert` / `plan-challenger`, `contract-reviewer`, `security-auditor`, `test-writer` | 금액은 DB(`plans`, `credit_packs`)에서만, customerKey `org_<id>`. 웹훅 서명 실패 401, 중복 수신 200·처리 1회. 금액 불일치 시 `fail_payment_order` + Toss 취소. E2E(Toss 테스트 키): 구독 → starter·150크레딧 1회, 크레딧팩 지급, 같은 confirm 재호출 멱등, 해지 예약. 화면 숫자는 GC-D-04(00장 7절 수정 반영) | GC-F-006 |
| GC-06-010 | 추가 슬롯 3단계 위저드(수량 → 결제 → 확인) | W1 | R1 | M | `web/app/api/addons/`, `web/components/billing/addon/` | 008, 009 | Fable · `nextjs-expert` / `security-auditor`, `test-writer` | 마켓 계정 등록이 GC003이면 위저드가 열림. 결제 성공 시 `slot_addons` 1행과 슬롯 한도 증가, 실패·취소 시 증가 0. 가격은 DB 값, 미정이면 `[추가 슬롯 가격]` 표시(O-03) | GC-F-007 |
| GC-06-011 | 마켓 계정 다계정 등록·암호화·마스킹·검증 상태·만료 표시와 설정의 마켓 섹션 | W1 | R1 | M | `web/app/api/market-accounts/`, `web/lib/credentials/`, `web/app/(app)/settings/markets/`, `web/components/settings/markets/` | 006, 008 | Fable · `nextjs-expert` / `plan-challenger`, `security-auditor`, `test-writer` | 키는 `encrypted_credentials`에만, 응답·로그·DB 평문 0(grep 테스트). 다른 조직 계정 접근 403. 해제는 `revoke_credential` + 감사 1행. 검증 호출은 GC-06-027·028의 `verifyCredentials()`를 쓰고, 그전에는 `unverified`로 저장(제안). 검증 실패·만료 GC009. 슬롯 표시 "4 / 10" 형식 | GC-F-008 |
| GC-06-012 | 설정: 일반, 배송 템플릿(해외 배송 On/Off·문구), 음원 라이브러리, 알림 | W1 | R1 | M | `web/app/(app)/settings/`(`markets/`, `login/` 제외), `web/components/settings/`(`markets/` 제외), `web/app/api/{shipping-templates,audio-tracks,notification-prefs}/` | 004, 006 | Sonnet · `sub-agent-1` / `security-auditor` | 청약철회 7일 미만 등 템플릿 규칙 위반 GC006. "단순 변심 반품 불가"·건기식 부정 문구 기본값 0. 음원 업로드는 mp3·wav, 용량 상한 20MB(제안), 경로 `<org_id>/globalcommerce/audio/`, 기본 제공 풀은 읽기 전용. 알림 설정 저장·복원 | GC-F-009, 010, 011 |
| GC-06-013 | 슈퍼 어드민(사용자 목록, 역할·플랜 조정, 감사 기록) | W1 | R1 | M | `web/app/admin/`, `web/app/api/admin/` | 006, 008 | Fable · `nextjs-expert` / `security-auditor`, `test-writer` | `is_platform_admin`만 접근, 그 외 404. 역할·플랜 변경마다 `audit_log` 1행. 쿠키·바디의 역할 값 무시. 일반 셸(`(app)`)에 넣지 않음 | GC-F-003 |
| GC-06-014 | 환율 크론(평일 11:30 KST)과 환율 위젯·마진 계산 | W2 | R1 | S | `worker/cron/fx/`, `web/app/api/fx/`, `web/components/dashboard/fx/` | 005, 007 | Opus · `worker-expert` / `contract-reviewer` | 수출입은행 API 실패 시 마지막 값 유지와 기준 시각 표시. LLM 추정 환율 0. 위젯 USD/KRW 크게, CAD/KRW 작게. 마진은 `packages/domain` 함수만 사용 | GC-F-101 |
| GC-06-015 | 데이터랩 검색어 추이와 시즌 추천 | W2 | R1 | S | `worker/cron/trend/`, `web/app/api/trends/`, `web/components/dashboard/trend/` | 005, 007 | Opus · `worker-expert` / `contract-reviewer` | 상대 지수 저장, 시즌 추천 = 4주 전 대비 증가율 상위 키워드(GC-D-17). 호출 실패 시 이전 값 유지. 일 호출 한도 안(미확인 수치는 env 설정) | GC-F-102 |
| GC-06-016 | 대시보드 화면(KPI 오늘 처리 대기, 최근 실행, 환율·트렌드 위젯 장착) | W2 | R1 | M | `web/app/(app)/dashboard/`, `web/components/dashboard/`(`fx/`, `trend/` 제외), `web/app/api/dashboard/` | 004, 008 | Sonnet · `sub-agent-1` / `contract-reviewer` | 목 상수·난수 0, 서버 컴포넌트에서 1회 조회, 데이터 없으면 빈 상태. `Main`·`TabletDashboard`·`MobileDashboard` 3구간 배치, 핵심 숫자 Bebas Neue 44/52/68 | GC-F-103 |
| GC-06-017 | 아마존 URL 수집 어댑터(ASIN 추출, 공급자 어댑터, 중복 시 갱신) | W2 | R1 | M | `packages/sourcing/amazon/`, `worker/import-amazon/`, `web/app/api/sourcing/amazon/` | 005, 007, 008 | Opus · `worker-expert` / `security-auditor`, `test-writer` | 허용 호스트 밖 URL GC010. 사용자 URL을 fetch하지 않고 ASIN만 추출(네트워크 목 테스트). 공급자는 O-02 어댑터(직접 스크래핑 0). 없는 ASIN 환불 1행, 같은 ASIN은 기존 상품 갱신. 원문 HTML 저장 0 | GC-F-104 |
| GC-06-018 | 위탁 엑셀 파서(오너클랜·도매꾹, 열 매핑, 오류 셀) | W2 | R1 | M | `packages/sourcing/excel/`, `worker/import-excel/`, `web/app/api/sourcing/excel/` | 005, 007, 008 | Opus · `worker-expert` / `security-auditor`, `test-writer` | 500행 2분 이내(제안), 행별 오류를 `import_rows`에 기록, 상품 수 한도 초과 행은 skipped(GC002). 파일 형식·크기 검증, 매크로·수식 결과만 읽음 | GC-F-105 |
| GC-06-019 | 소싱·수집 화면과 상품 목록 API(필터, 저장한 보기, 일괄 선택) | W2 | R1 | M | `web/app/(app)/sourcing/`, `web/components/sourcing/`, `web/app/api/products/`(`titles/`, `[id]/` 제외) | 004, 017, 018 | Sonnet · `sub-agent-1` / `contract-reviewer` | URL 입력, 엑셀 업로드·열 매핑, 오류 셀 표시. 2,000행 가상 스크롤, 키보드 선택, 빈 상태 문구. 요청에서 테이블·컬럼 이름을 받지 않음. 컴포넌트 300줄 이하 | GC-F-104, 105, 106 |
| GC-06-020 | AI 라우터 `packages/ai`(제공자 어댑터, 기능별 체인 규약, 사용량 기록) | W3 | R1 | M | `packages/ai/`(`chains/*/` 제외) | 005, 007 | Opus · `worker-expert` / `plan-challenger`, `security-auditor` | 기본 OpenAI GPT-4o, 대체 Anthropic(GC-D-08). 모델·제공자는 서버 설정만, 바디 값 무시. 출력 zod 검증, 타임아웃 60초(제안)·대체 1회, `ai_usage` 기록. 패키지에 `server-only`, 클라이언트 번들에 키 이름 0(빌드 산출물 grep). FastAPI·Dify·LangGraph 의존성 0 | GC-F-201, 205(기반) |
| GC-06-021 | 금지어 매처(한글 경계, escape, 치환, FAIL/WARN 판정, 생성 금지 문형) | W3 | R1 | S | `packages/compliance/` | 005 | Opus · `worker-expert` / `test-writer` | "화장품" 등 한글 매칭 테스트, 정규식 `\b` 0, 특수문자 금지어 RegExp 오류 0, 하이라이트 출력 escape. 사전은 `banned_words`(기본 + 조직) 하나. 후기·평점·"전문가 추천"·"단순 변심 반품 불가"·건기식 부정 문구를 FAIL로 판정 | GC-F-202 |
| GC-06-022 | 상품명 생성 잡(`title.generate`)과 상품 관리 화면(셀 편집, 바뀐 셀 표시, 한 번에 저장·되돌리기) | W3 | R1 | L | `packages/ai/chains/title/`, `worker/title/`, `web/app/api/products/titles/`, `web/app/(app)/products/`(`[id]/` 제외), `web/components/products/` | 008, 019, 020, 021 | Opus · `nextjs-expert` / `plan-challenger`, `contract-reviewer`, `test-writer` | 크레딧 선차감 후 잡, 실패 환불. 결과는 금지어 치환을 거쳐 `title_revisions`에 저장. 저장·되돌리기는 한 요청으로 원자 처리. 바뀐 셀 표시, 2,000행 스크롤. Route Handler 밖 AI 호출 0 | GC-F-201, 203, 106 |
| GC-06-023 | 누끼(`image.cutout`)·대표 이미지 합성(`image.compose`) 잡 | W3 | R1 | M | `packages/ai/chains/image/`, `packages/render/image/`, `worker/image/`, `web/app/api/products/[id]/images/` | 007, 008, 020 | Opus · `worker-expert` / `security-auditor`, `test-writer` | 결과 1080×1080, 한글 글자는 Sharp 후합성(이미지 모델에 한글 요청 0). 제공자는 어댑터(O-04). 30분 미도착 시 실패·환불. 결과를 Storage로 복사(`<org_id>/globalcommerce/images/`). 제공자 URL을 DB 정본으로 쓰지 않음 | GC-F-204, 205 |
| GC-06-024 | 상품 이미지 화면과 활동 타임라인·메모 | W3 | R1 | M | `web/app/(app)/products/[id]/images/`, `web/components/images/`, `web/app/api/products/[id]/activities/` | 004, 023 | Sonnet · `sub-agent-1` / - | 배경 설명 입력, 다시 만들기, 진행 상태 Realtime. 타임라인은 `product_activities`, 메모 저장. 이미지 실패 시 대체 아이콘 | GC-F-204, 205, 206 |
| GC-06-025 | 상세페이지 4단 블록 조립(`detail.assemble`), 배송 템플릿 조건부 결합, 확정과 마켓 규격 이미지 변환(`detail.render_market`) | W3 | R1 | L | `packages/ai/chains/detail/`, `packages/render/market/`, `worker/detail/`, `web/app/api/detail-pages/`, `web/app/api/products/[id]/detail-page/` | 007, 008, 012, 020, 021 | Opus · `worker-expert` / `plan-challenger`, `contract-reviewer`, `test-writer` | 블록 4개(후킹 헤드라인, 핵심 특징 3가지, 상세 스펙, 배송·교환 안내). 4번 블록의 해외 배송 템플릿은 해외 소싱 + 설정 On일 때만. 판정 FAIL·WARN 저장, WARN 확인은 RPC(감사 1행). 상품 행에 없는 수치·후기·평점 생성 0. 마켓 이미지는 마스터에서만 파생, 쿠팡·스마트스토어 규격·분할 경계 테스트 | GC-F-207, 208, 209 |
| GC-06-026 | 상세페이지 에디터 화면(블록 편집, 실행 취소, 자동 저장, 기기 폭 미리보기, WARN 확인) | W3 | R1 | L | `web/app/(app)/products/[id]/detail-page/`, `web/components/detail/` | 004, 025 | Sonnet · `sub-agent-1` / `test-writer` | FAIL이면 확정 버튼 비활성, WARN은 확인 후에만 확정. 자동 저장 충돌 시 마지막 서버 버전 표시. 미리보기 375/834/1280px(제안). 컴포넌트 300줄 이하 | GC-F-207 |
| GC-06-027 | 쿠팡 Wing 어댑터(서명, 카테고리, 등록, 상태 조회, 키 검증, 오류 정규화) | W4 | R1 | L | `packages/markets/coupang/` | 005, 007 | Opus · `worker-expert` / `plan-challenger`, `contract-reviewer`, `security-auditor`, `test-writer` | 공식 문서 예제로 HMAC 서명 테스트(미확인: 예제 제공 여부), 4xx 필드 오류 → 폼 필드 매핑, `verifyCredentials()` 제공, 목 서버 계약 테스트, 키는 인자로만 받고 로그 0 | GC-F-301 |
| GC-06-028 | 네이버 커머스(스마트스토어) 어댑터 | W4 | R1 | L | `packages/markets/smartstore/` | 005, 007 | Opus · `worker-expert` / `plan-challenger`, `contract-reviewer`, `security-auditor`, `test-writer` | 토큰 발급·캐시(서명 방식 미확인, 착수 시 문서 확인), 이미지 업로드, 등록, 상태 조회, `verifyCredentials()`, 오류 정규화, 목 서버 계약 테스트 | GC-F-301 |
| GC-06-029 | 업로드 배치·진행률 API와 `upload.*` 핸들러(멱등, 상태 폴링, 실패 건 재전송, URL 저장) | W4 | R1 | M | `web/app/api/uploads/`, `worker/upload/` | 011, 025, 027, 028 | Opus · `nextjs-expert` / `contract-reviewer`, `security-auditor`, `test-writer` | 같은 `request_id` → 배치 1개. FAIL 상세페이지 GC004, 미확인 WARN GC005, 계정 검증 실패 GC009. 복호화는 워커 `upload/`에서만. 진행률은 `market_listings` Realtime, 실패 사유 한 줄, 실패 건만 재전송. 등록 완료 URL 저장 | GC-F-301, 302, 304(저장) |
| GC-06-030 | 마켓 업로드 화면(상품 × 계정 선택, 진행률, 실패만 재전송, 모바일 업로드) | W4 | R1 | M | `web/app/(app)/upload/`, `web/components/upload/` | 004, 029 | Sonnet · `sub-agent-1` / - | `Upload`·`MobileUpload` 디자인 구성, 진행률 바 `role="progressbar"`, 새로고침 후 진행률 복원, FAIL·WARN 상품은 선택 불가 표시 | GC-F-301, 302 |
| GC-06-031 | 엑셀(플레이오토 호환)·ZIP 내보내기와 만료 크론 | W4 | R1 | M | `packages/markets/export/`, `worker/export/`, `web/app/api/exports/` | 007, 025 | Opus · `worker-expert` / `contract-reviewer`, `test-writer` | FAIL 상품 내보내기 GC004. ZIP은 마켓별 폴더, 서명 URL 7일, `export.expire`가 만료 파일 정리. 플레이오토 양식 버전은 미확인(착수 시 확인). 플랜 제한은 `plans.features`대로 | GC-F-303 |
| GC-06-032 | 실행 기록 화면(시스템 파이프라인 진행률, 단계별 로그, 실패 단계부터 재실행) | W4 | R1 | M | `web/app/(app)/runs/`, `web/components/runs/`, `web/app/api/runs/` | 004, 007 | Sonnet · `sub-agent-1` / `contract-reviewer` | 목록·상세가 `workflow_runs`·`workflow_run_steps` 실데이터, 실패 단계부터 재실행 시 앞 단계 결과 재사용, 진행 중 Realtime 갱신 | GC-F-401 |
| GC-06-033 | E2E 핵심 흐름(Mock 페르소나) | W5 | R1 | M | `tests/e2e/`(`billing/`, `responsive/` 제외) | W0~W4 전부 | Opus · `test-writer` / `contract-reviewer` | 로그인 → 아마존 수집(목 공급자) → 상품명 → 이미지(목 제공자) → 상세페이지 → WARN 확인 → 업로드(목 마켓) → 엑셀·ZIP. Playwright `globalSetup`이 `/api/dev/login`으로 페르소나별 `storageState` 저장. viewer 쓰기 거부, outsider 조회 0 | R1 전체 |
| GC-06-034 | 보안 점검(v1 결함 grep, 키 노출, 아카이브 체크) | W5 | R1 | S | `scripts/security/` | W0~W4 전부 | Fable · `security-auditor` / `test-writer` | 5.1절 v1 결함 grep 0건(CORS `*`, localStorage 키·역할, `nomad_role`·`nomad_plan`, `USING (true)`, 한글 `\b`, 요청 바디 테이블 이름), 클라이언트 번들 키 스캔 0, CSP에 `unsafe-eval` 0, 07장 5절 패턴 grep과 7절 아카이브 체크 완료. CI 추가는 GC-06-001에 1줄 요청 | GC-D-21 |
| GC-06-035 | 반응형 3구간 점검 | W5 | R1 | S | `tests/e2e/responsive/` | W0~W4 화면 | Haiku · `sub-agent-2` / - | R1 화면 전부 390·834·1280px 스크린샷, 가로 스크롤 0, 계산된 글자 크기(본문 14, 표 13, 제목 20/22/24, 핵심 숫자 44/52/68)가 GC-D-20과 일치, 터치 대상 44px 이상 | GC-D-20 |
| GC-06-036 | 인증 Stage B(Google + 이메일, 콜백, 약관 동의 단계) | W5(G1 후) | R1 | M | `web/components/auth/`(`kakao/`, `naver/` 제외), `web/app/auth/callback/`, `web/app/(auth)/{signup,reset-password}/`, `web/app/onboarding/terms/` | G1, 006, 009, 048 | Fable · `nextjs-expert` / `plan-challenger`, `security-auditor`, `test-writer` | B-1 새 Google 계정 첫 로그인 → entitled·plan `free`·가입 크레딧 30 1회. B-2 `next=//evil.com`·`https://evil.com`·`/\evil.com` → `/dashboard`. B-3 code 없음·재사용·만료 → `/login?error=callback`, 로그에 코드 0. B-4 배포 빌드에서 `/api/dev/login` 404·개발 패널 0. B-5 033 계속 녹색. B-6 배포 체크리스트 일치. 약관 동의 전 `/dashboard` 진입 0 | GC-F-001(B) |
| GC-06-037 | 노드 캔버스(팔레트, 미니맵, 노드 설정 패널, 버전 기록) | W6 | R2 | L | `web/app/(app)/workflows/`, `web/components/workflow/`, `web/app/api/workflows/`, `packages/domain/workflow/`, `supabase/migrations/<번호>_gc_workflows.sql` | R1 출시, 004 | Sonnet · `nextjs-expert` / `plan-challenger`, `contract-reviewer` | @xyflow/react 12만 사용(`reactflow` 0), 그래프는 `workflow_versions.graph`(jsonb), 엣지 없는 노드·고립 노드가 있으면 실행 버튼 비활성, 노드 data에 키 0, 저장마다 버전 1행 | GC-F-402 |
| GC-06-038 | 워크플로우 실행 엔진(위상 정렬, 노드별 재시도, 취소, 노드 단위 크레딧) | W6 | R2 | L | `worker/workflow/` | 037, 007 | Opus · `worker-expert` / `plan-challenger`, `contract-reviewer`, `security-auditor`, `test-writer` | 순환 그래프 거부, 엣지 순서대로 실행(배열 순서 0), 노드별 재시도 3회, 취소 시 대기 노드 미실행·선차감 환불, `workflow_runs.kind='workflow'`, HTTP 자기 호출 0 | GC-F-403 |
| GC-06-039 | 블로그 원고 생성·발행(자체 블로그 `/b/[slug]`, WordPress REST, 예약) | W6 | R2 | L | `packages/ai/chains/blog/`, `worker/blog/`, `web/app/(app)/content/blog/`, `web/components/blog/`, `web/app/api/blog/`, `web/app/b/`, `supabase/migrations/<번호>_gc_posts.sql` | R1 출시, 025 | Opus · `nextjs-expert` / `contract-reviewer`, `security-auditor` | 원고는 상세페이지 기반·금지어 통과분만 발행, WordPress 자격증명은 `encrypted_credentials`, 예약 발행 잡, 공개 글은 `published`만 서버에서 읽음, 테이블 이름을 요청에서 받지 않음 | GC-F-501, 502 |
| GC-06-040 | 숏폼 렌더 워커(FFmpeg 15/30/50초, 9:16 1080×1920, 모션 템플릿 3종, TTS 자막, 음원 반복) | W6 | R2 | L | `packages/render/video/`, `packages/ai/chains/shorts/`, `worker/shorts/`, `supabase/migrations/<번호>_gc_videos.sql` | R1 출시, 012, 023 | Opus · `worker-expert` / `plan-challenger`, `contract-reviewer`, `test-writer` | 출력 mp4 길이 오차 0.5초 이내(제안), 음원이 짧으면 반복 옵션, 렌더 한도는 플랜 값(O-05), 실패 시 파일 0·환불 1행. FFmpeg 설치는 GC-06-007 Dockerfile에 1줄 요청 | GC-F-503, 504 |
| GC-06-041 | 숏폼 영상 화면 | W6 | R2 | M | `web/app/(app)/content/shorts/`, `web/components/shorts/`, `web/app/api/shorts/` | 040 | Sonnet · `sub-agent-1` / `contract-reviewer` | 길이·템플릿·음원 선택, 렌더 진행률, 미리보기, 플랜 한도 표시 | GC-F-503, 504 |
| GC-06-042 | SNS 채널 연결과 업로드 예약(유튜브 쇼츠, 인스타 릴스) | W6 | R2 | L | `worker/sns/`, `web/app/(app)/content/sns/`, `web/components/sns/`, `web/app/api/sns/`, `supabase/migrations/<번호>_gc_sns.sql` | 040 | Opus · `worker-expert` / `plan-challenger`, `security-auditor`, `test-writer` | OAuth 토큰은 `encrypted_credentials`, state 검증, 토큰 갱신 실패 시 재연결 안내, 예약 업로드 잡, 댓글 고정은 수동 안내(O-06) | GC-F-505 |
| GC-06-043 | 상품 URL 자동 삽입(설명란, 댓글) | W6 | R2 | S | `worker/sns-link/` | 029, 042 | Opus · `worker-expert` / `contract-reviewer` | 마켓 등록 전에는 "링크 대기", 등록 완료 URL이 생기면 설명란·댓글 갱신 1회(멱등). 029에 완료 이벤트 1줄 요청 | GC-F-506, 304(전달) |
| GC-06-044 | 인증 Stage C(카카오, 네이버)와 설정의 로그인 방법 | W6(G2 후) | R2 | M | `web/components/auth/{kakao,naver}/`, `web/lib/auth/naver/`, `web/app/auth/naver/`, `web/app/(app)/settings/login/` | G2, 036 | Fable · `nextjs-expert` / `plan-challenger`, `security-auditor`, `test-writer` | 첫 로그인 결과가 B-1과 같음, 같은 계정 재로그인 5회 사용자 수 증가 0, 네이버 브리지면 state 변조·재사용 거부, 로그인 수단 1개 남으면 해제 거부, 네이버 검수 전 운영 `AUTH_PROVIDERS`에 `naver` 없음 | GC-F-001(C) |
| GC-06-045 | 상품 임베딩과 하이브리드 검색(가중치, 필터, CSV) | W7 | R3 | M | `packages/ai/chains/embed/`, `worker/search/`, `web/app/api/search/`, `supabase/migrations/<번호>_gc_search.sql` | R2 출시 | Opus · `supabase-expert` / `contract-reviewer`, `security-auditor`, `test-writer` | `vector(1536)`, `text-embedding-3-small`, 전문 검색 + 벡터 가중치 RPC, 다른 조직 결과 0, 상품 삭제 시 임베딩 삭제, CSV 내보내기 | GC-F-601, 602 |
| GC-06-046 | JSON-LD(schema.org Product) 생성과 자체 블로그·상세페이지 반영 | W7 | R3 | S | `packages/domain/jsonld/`, `worker/jsonld/` | 045, 039 | Haiku · `sub-agent-2` / `test-writer` | `brand`는 상품 브랜드(제품명 하드코딩 0), 값 없는 필드는 생략, `jsonld_snapshots` 저장, 스키마 검증 테스트. 쿠팡·스마트스토어 HTML에는 넣지 않음 | GC-F-603 |
| GC-06-047 | 상품 검색·GEO 화면 | W7 | R3 | M | `web/app/(app)/insights/search/`, `web/components/search/` | 045, 046 | Sonnet · `sub-agent-1` / - | 키워드/의미 가중치 슬라이더, 필터, CSV, JSON-LD 미리보기 | GC-F-602, 603 |
| GC-06-048 | 랜딩(GC-S-17)과 약관·개인정보처리방침 페이지 | W5 | R1 | M | `web/app/(marketing)/` | 004, 005 | Sonnet · `nextjs-expert` / `review-expert` | `docs/spec/LANDING_PAGE_STITCH_PROMPT.md` 구성(히어로, 페인포인트, 작동 방식, 가격, FAQ 5개 아코디언, 문의 폼, 푸터)을 토큰으로 구현. 가격표는 00장 GC-D-04 값과 일치. 허위 수치·가상 후기 0. 반응형 3구간(GC-D-20). 문의 폼은 서버 저장(외부 메일 직접 전송 없음). G1 없이 착수 가능 | GC-S-17 |
| GC-06-049 | 18슬롯 이미지형 상세페이지(유형 3종, 10/15슬롯, 마켓 규격 분할) | W6 | R2 | L | `packages/render/slots/`, `packages/ai/chains/slots/`, `worker/detail-slots/`, `web/components/detail/slots/` | R1 출시, 025, 026 | Opus · `worker-expert` / `plan-challenger`, `contract-reviewer`, `test-writer` | `docs/spec/DETAIL_PAGE_SYSTEM.md`·`MARKET_IMAGE_SPEC.md` 슬롯 정의를 `packages/domain` 단일 상수로. 필수 슬롯 누락은 DB CHECK. 쿠팡 2,800px·스마트스토어 분할 단위 테스트. 한글 카피는 Sharp 후합성. 4단 블록(025)과 같은 상세페이지에서 유형 선택으로 전환 | GC-D-10(R2) |

### 2.1 미리 정한 1줄 요청

소유 경계 때문에 다른 작업 파일에 반영해야 하는 변경을 미리 적는다. 요청 작업이 task `log.md`에 `[REQUEST] GC-06-### 파일: 내용`으로 남기고 소유 작업이 반영한다.

| 요청 작업 | 대상 파일(소유 작업) | 내용 |
|---|---|---|
| 034 | `.github/workflows/`(001) | `scripts/security/` 검사 단계 추가 |
| 035 | `.github/workflows/`(001) | 반응형 스크린샷 단계(수동 실행 또는 야간) |
| 036 | `web/lib/auth/`(006) | `finishLogin`에 약관 동의 단계 연결 |
| 036, 044 | `supabase/config.toml`(002) | Google·카카오 제공자 블록, `additional_redirect_urls` |
| 040 | `services/worker/Dockerfile`(007) | FFmpeg 설치 |
| 043 | `worker/upload/`(029) | 등록 완료 URL 저장 뒤 `sns.link_insert` 잡 enqueue |
| 039, 046 | `web/components/detail/`(026) | JSON-LD 미리보기 자리(R3) |
| 037~047 | `packages/domain/src/nav.ts`(005) | R2·R3 메뉴 노출 플래그를 릴리스에 맞춰 켬 |
| 화면 작업 전부 | `web/lib/copy/`(004가 폴더와 `errors.ts` 소유) | 오류 코드(00장 5.5절) → 사용자 문구는 `errors.ts` 한 곳. 화면별 문구는 각 화면 작업이 `<화면>.ts` 파일 1개씩 소유 |

## 3. 웨이브(병렬 실행 순서)

| 웨이브 | 작업 ID(→는 같은 웨이브 안 순서) | 병렬 수 | 진입 조건 | 산출물 |
|---|---|---|---|---|
| W0 | 001, 002, 005 → 003, 004, 006, 007 | 3 → 4 | 없음 | 모노레포·CI, DB·타입, 도메인 상수, RLS 테스트, 토큰·셸, 인증 A, 워커 런타임·안전 fetch |
| W1 | 008 → 009, 011, 012, 013 → 010 | 1 → 4 → 1 | W0 | 크레딧·플랜 판정, 결제, 마켓 계정, 설정, 어드민, 추가 슬롯 |
| W2 | 014, 015, 017, 018 → 016, 019 | 4 → 2 | W1(008) | 환율, 트렌드, 수집 2종, 대시보드, 소싱 화면 |
| W3 | 020, 021 → 022, 023, 025 → 024, 026 | 2 → 3 → 2 | W2(019), W1(012) | AI 라우터, 금지어, 상품명, 이미지, 상세페이지 |
| W4 | 027, 028, 031, 032 → 029 → 030 | 4 → 1 → 1 | W3(025), W1(011) | 마켓 어댑터 2종, 내보내기, 실행 기록, 업로드 |
| W5 | 033, 034, 035, 048 → G1 → 036 | 4 → 1 | W4(048은 W0 뒤 언제든) | E2E, 보안·반응형 점검, 랜딩·약관, Stage B |
| R1 게이트 | - | - | W5 | R1 출시(공개 베타 겸 유료 판매) 판정 |
| W6 | 037, 039, 040, 049 → 038, 041, 042 → 043 / 044(G2 후) | 4 → 3 → 2 | R1 출시와 매출 검증(GC-D-02) | 캔버스·엔진, 블로그, 숏폼, 18슬롯 상세페이지, SNS, 링크 삽입, Stage C |
| W7 | 045 → 046 → 047 | 1 → 1 → 1 | R2 출시 | 임베딩·검색, JSON-LD, 검색 화면 |

게이트(사람 판정, task `log.md`에 `[DECISION]`으로 기록, 에이전트가 스스로 넘기지 않는다):

| 게이트 | 위치 | 통과 조건 | 판정 |
|---|---|---|---|
| G1(인증 A→B) | GC-06-036 앞 | 001~035 완료, 033 E2E·003 RLS·009 결제 E2E가 Mock 페르소나로 녹색, 034 높음 결함 0, 인증 모듈 밖 `AUTH_MODE` 분기 0, Google OAuth 클라이언트·운영 Supabase 준비 | 대표님. `advisor`가 판정 자료 검토 |
| R1 출시 | W5 뒤, W6 앞 | 036 B-1~B-6 통과, 035 녹색, 약관·처리방침·구매대행 고지·배송 템플릿 문안 법률 검토 완료, Toss 라이브 키 전환, 쿠팡·네이버 API 승인 또는 엑셀·ZIP만으로 출시 결정(GC-D-03) | 대표님 |
| G2(인증 B→C) | GC-06-044 앞 | 공개 베타 2주 안정(제안), 인증 P0 장애 0, `/auth/callback` 오류율 1% 미만(제안), 카카오 앱·네이버 애플리케이션 준비 | 대표님 |

## 4. 모델별 비율

| 모델 | 작업 수 | 비율 | 규모 가중(S=1, M=2, L=3) | 가중 비율 |
|---|---|---|---|---|
| Fable 5.1 | 11 | 23.4% | 23 | 23.0% |
| Opus 5.5 | 22 | 46.8% | 49 | 49.0% |
| Sonnet 5.5 | 12 | 25.5% | 26 | 26.0% |
| Haiku 5.5 | 2 | 4.3% | 2 | 2.0% |
| 합계 | 47 | 100% | 100 | 100% |

릴리스별: R1 36개(001~036), R2 8개(037~044), R3 3개(045~047). Fable 11개는 DB·RLS(002, 003), 인증(006, 036, 044), 크레딧·결제(008, 009, 010), 키·권한(011, 013), 보안 점검(034)이다. Haiku는 단독 작업이 2개뿐이지만 다른 작업 안에서 문구 상수(`web/lib/copy/`, 소유는 해당 화면 작업), 점검 체크리스트, `.env.example` 갱신 같은 하위 지시를 `sub-agent-2`로 받는다. 이 하위 지시는 비율에 넣지 않았다.

## 5. v1 리뷰 결함 흡수표

### 5.1 platform-docs `reviews/nomad-ai-factory.md` 3장 발견 문제(16)

| # | 결함 | 흡수 작업 |
|---|---|---|
| 1 | 공개 AI 프록시(CORS `*`, 인증 없음) | 020(서버 전용 패키지), 022·023·025(인증된 Route Handler·워커만), 034(grep) |
| 2 | 클라이언트 한도 판단·사용량 기록 | 008(`withCredits` 선차감), 002(한도 트리거), 034 |
| 3 | 외부 API 키 localStorage 평문 | 011(`encrypted_credentials`), 042(SNS 토큰), 039(WordPress), 034(grep) |
| 4 | 스키마·RLS 부재 | 002, 003 |
| 5 | 의존성 `latest` | 001(lockfile, `latest` 0 검사) |
| 6 | AI Studio 템플릿 잔재(전역 fetch 패치) | 해당 없음: 이식하지 않음(07장 4절), 034가 `window.fetch =` grep |
| 7 | 미사용 코드 40%, 인증 3벌 | 해당 없음: v1 코드를 이식하지 않음(07장 4절). 인증은 006 한 경계 |
| 8 | `as any` 37건 | 001(`no-explicit-any` 오류) |
| 9 | `reactflow` v11과 문서 v12 불일치 | 037(@xyflow/react 12), 001(의존성 검사) |
| 10 | 대시보드 목 데이터, `setTimeout` 엔진 | 016(실데이터), 032(실행 기록), 038(실제 엔진) |
| 11 | 로그인마다 순차 5쿼리 | 006(`session_context` 1회), 016(서버 1회 조회) |
| 12 | 400~770줄 페이지 | 화면 작업 전부(컴포넌트 300줄 이하, 제안), 019·022·026 |
| 13 | `console.log` 36건 | 001(`no-console`, 로거) |
| 14 | env 이중 로딩 | 001(`lib/env.ts` zod 한 곳, `.env.example`) |
| 15 | 시안·구 문서·zip 잔재 | 07장 7절 아카이브, 034 확인 |
| 16 | LLM 추정 환율, temperature 0.7 수치 | 014(수출입은행), 005(마진 공식), 020(수치 생성 금지·JSON 모드) |

### 5.2 같은 리뷰 5장 수정 작업(13)

| # | 리뷰 작업 | 흡수 작업 |
|---|---|---|
| 1 | Next 골격·초기 마이그레이션·멀티테넌트 역할 | 001, 002, 006 |
| 2 | AI 호출 경계(인증 → 한도 → 호출 → 기록) | 020, 008 |
| 3 | 사용자 키 서버 암호화 | 011 |
| 4 | v1 유지 시 JWT 검증 | 해당 없음: v1을 운영하지 않음 |
| 5 | v1 저장소 정리 | 07장 7절, 034 |
| 6 | 버전 고정·@xyflow v12 | 001, 037 |
| 7 | `as any`·`console.log` | 001 |
| 8 | 대시보드 목 데이터 → 집계 | 016 |
| 9 | 자동화 엔진(위상 정렬, 미연결 노드 차단) | 037, 038 |
| 10 | 환율 API·마진 | 014, 005 |
| 11 | 대형 페이지 분해 | 016, 019, 022, 026 |
| 12 | CLAUDE.md·`.env.example` | `products/CLAUDE.md`, 001 |
| 13 | 주문 CRUD | 범위 밖: 15단계에 없음(GC-D-01) |

### 5.3 `reviews/Nomad-AI-Factory_V.2.md` 3장 기획 문제(18)

| # | 문제 | 흡수 |
|---|---|---|
| 1 | SSE + 브라우저 큐 | 007(잡 + 워커), 029·032(Realtime) |
| 2 | 서버 한도 집행 없음 | 008, 002 |
| 3 | 단일 env 마켓 키 | 011, 027, 028 |
| 4 | `USING (user_id = auth.uid())` 공통 정책 | 002, 003 |
| 5 | AI 후기·평점, 랜딩 허위 수치 | 021, 025, 036(랜딩) |
| 6 | 반품 불가·건기식 부정 자동 문구 | 012, 021, 025 |
| 7 | 슬롯 정의 불일치 | R1은 4단 블록(GC-D-10). 18슬롯은 R2 이후, 작업 미배정 |
| 8 | 파이프라인 단계 이름 불일치 | 005(단계 이름 상수), 032 |
| 9 | 엔터 가격 불일치 | 005, 009(GC-D-04) |
| 10 | 로드맵 우선순위 반대 | GC-D-02 |
| 11 | @xyflow v11 표기, `<form>` 금지, `middleware.ts` | 001, 006(`proxy.ts`), 037, `CLAUDE.md` 5절 |
| 12 | SSE 청크 버퍼 버그 | 007·029(SSE 미사용) |
| 13 | 아마존 수집 방식·SSRF | 017(O-02), 007(`packages/net`) |
| 14 | 범위 과다 | GC-D-02, GC-D-03 |
| 15 | Toss 상세 누락 | 009, 010 |
| 16 | JSON-LD `brand` 하드코딩, 금지어 출처 2개 | 046, 021 |
| 17 | TOP10/TOP100, 토큰 중복 | 015, 004 |
| 18 | DALL-E 3 구세대 | 020, 023(O-04) |

## 6. 외부 준비물

담당은 모두 대표님이다. 대기 기간은 확인하지 않았으므로 필요 웨이브보다 한 웨이브 먼저 신청한다(제안). 없을 때의 우회는 목 서버·목 공급자로 작업을 끝내고 실제 키 연결은 R1 게이트에서 확인한다.

| 준비물 | 필요 웨이브·작업 | 내용 | 없을 때 |
|---|---|---|---|
| Supabase | W0 001·002(로컬 CLI), G1 전 운영 프로젝트 | 로컬은 CLI, 운영은 프로젝트·service_role 키 | 로컬만으로 W0~W5 |
| Vercel·워커 호스팅 | W0 001·007 | Vercel 프로젝트, 워커 컨테이너 호스팅(Railway·Fly 등, 제안) | 로컬 실행 |
| Toss Payments | W1 009·010 | 테스트 클라이언트·시크릿 키, 빌링(자동결제) 계약·심사(미확인), 라이브 키는 R1 게이트 | 테스트 키로 E2E |
| 암호화 키 | W1 011 | `CREDENTIALS_KEY`(32바이트), 0키 폴백 금지 | 기동 실패가 정상 |
| 한국수출입은행 환율 API | W2 014 | 인증키, 일 호출 한도(미확인) | 목 응답 |
| 네이버 데이터랩 | W2 015 | 네이버 개발자센터 애플리케이션(client id·secret), 일 한도 미확인 | 목 응답 |
| 아마존 상품 데이터 공급자 | W2 017 | O-02 결정, 공급자 API 키(Rainforest·Keepa 등, 미확인) | 목 공급자 |
| OpenAI | W3 020·022·025, R3 045 | GPT-4o, 이미지 모델 제공 여부 확인(GC-D-09, 미확인), `text-embedding-3-small`, TTS(R2, 미확인) | 목 제공자. 대체 Anthropic 키는 선택 |
| 이미지 제공자 | W3 023 | O-04: fal(birefnet, flux) 또는 OpenAI 이미지 | 목 제공자 |
| 쿠팡 Wing Open API | W4 027 | 판매자 계정, access·secret key, vendorId, 승인(미확인) | 목 서버 + 엑셀·ZIP |
| 네이버 커머스 API | W4 028 | 커머스API센터 애플리케이션, 스마트스토어 판매자 계정 | 목 서버 + 엑셀·ZIP |
| 법률 검토 | R1 게이트 | 약관, 처리방침, 구매대행 고지, 배송·반품 템플릿 문안 | 유료 판매 금지 |
| Google OAuth | G1 직후 036 | Google Cloud OAuth 클라이언트, 동의 화면, Redirect URL | B단계 보류 |
| 카카오·네이버 로그인 | G2 직후 044 | 카카오 앱(비즈 앱 여부), 네이버 애플리케이션 검수 | C단계 보류 |
| YouTube Data API v3 | W6 042 | Google Cloud 프로젝트, OAuth 동의 화면 검증, 업로드 할당량(미확인) | 목 업로더 |
| Instagram Graph API | W6 042 | Meta 앱, 비즈니스 계정, 콘텐츠 게시 권한 앱 검수(미확인) | 목 업로더 |
| WordPress | W6 039 | 사용자 사이트의 Application Password(사용자 준비) | 자체 블로그만 |
| 기본 음원 풀 | W1 012(목록), W6 040(렌더) | 상업 이용 가능한 라이선스 확인 | 사용자 음원만 |

## 7. 완료 정의

| 조건 | 확인 |
|---|---|
| 빌드·타입·린트 | `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build` 오류 0(앱·워커·패키지) |
| DB | `supabase db reset` 2회 성공, 타입 생성 결과와 커밋본 diff 0 |
| RLS | GC-06-003 전 항목 통과 |
| 결제 | `tests/e2e/billing/`(GC-06-009) 통과 |
| 핵심 흐름 | GC-06-033 통과(Mock 페르소나) |
| 보안 | GC-06-034 높음 결함 0, 클라이언트 번들 키 0, CI 금지 문자열 검사 녹색 |
| 반응형 | GC-06-035 통과(3구간, GC-D-20 글자 크기) |
| 작업 기록 | 작업마다 task `log.md`에 수용 기준별 결과, 검증 에이전트 결과, 1줄 요청 처리 여부 |
| R1 완료 | 001~036 완료, G1·R1 게이트 `[DECISION]` 기록 |
| R2 완료 | 037~044 완료(044는 G2 후), 033에 캔버스·블로그·숏폼·SNS 흐름 추가 녹색 |
| R3 완료 | 045~047 완료, 검색 결과 조직 격리 테스트 녹색 |

P0 작업과 검증 작업 대응: DB·권한(002, 006, 008, 011, 013) → 003 / 인증 A(006) → 006 자체 테스트 + 033 / 인증 B(036) → B-1~B-6 + 033 + 034 / 결제(009, 010) → `tests/e2e/billing/` / 수집·가공·업로드·내보내기(014~031) → 각 작업 단위 테스트 + 033 / 화면 전체 → 035 / v1 결함 → 034.

## 변경 이력

| 날짜 | 변경 |
|---|---|
| 2026-10-25 | 최초 작성. 00장 5.6절의 47개 작업을 상세화 |
| 2026-10-25 | 교차 검토: 랜딩·약관을 GC-06-036에서 분리해 GC-06-048로, 18슬롯 상세페이지(R2)를 GC-06-049로 추가(00장 5.6절과 일치) |
