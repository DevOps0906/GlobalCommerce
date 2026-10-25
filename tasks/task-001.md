# GC-06-001 모노레포 · CI

- **웨이브 · 릴리스 · 규모**: W0 · R1 · M
- **선행 작업**: 없음
- **소유 경로**: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.config.mjs`, `.github/workflows/`, `apps/web/{package.json,next.config.ts,lib/env.ts}`, `services/worker/{package.json,src/env.ts}`, `.env.example`(앱·워커), `docker-compose.yml`, `.dockerignore`, `apps/web/Dockerfile.dev`, `scripts/dev/docker.mjs` — 이 밖의 파일은 고치지 않고 로그에 `[REQUEST]`
- **기능 ID**: 없음 (기반 작업)
- **화면 ID**: 없음
- **관련 결정**: GC-D-26 (Docker Desktop 기준 로컬 개발) · GC-D-20 (반응형 구간은 이 작업 범위 밖)
- **담당 (06장)**: Sonnet · `nextjs-expert` / 검증 `security-auditor`
- **실제 배치 (팀장)**: 구현 `nextjs-expert` / 호출 모델 sonnet / 하위 지시 없음
- **검증**: 착수 전 없음(M 규모, 결제·DB·키 계획 아님) · 변경 후 review-expert + `security-auditor`
- **확인 위치**: Docker Desktop(GC-D-26)에서 최종 기동 확인; 클라우드 작업 환경은 이미지 저장소 차단으로 PGlite·문법 검사까지
- **상태**: 진행

## 목표

pnpm 루트 모노레포와 Next.js 16 · 워커 골격, env 검증, CI를 만들어 이후 모든 작업이 같은 typecheck · lint · build · test 기준 위에서 돌게 한다.

## 참고 문서

- `products/06_AGENT_PLAN.md` 2장 GC-06-001 행 (소유 경로 · 수용 기준)
- `products/CLAUDE.md` 1절
- `products/00_DECISIONS.md` GC-D-26
- `products/00_DECISIONS.md` GC-D-20

## 할 것

- [ ] pnpm 워크스페이스(`apps/web`, `services/worker`, `packages/*`) 구성, `tsconfig.base.json` strict 기본 설정
- [ ] ESLint 설정: `no-explicit-any`·`no-console` 오류, `bg-[#` 금지 규칙 자리 마련
- [ ] `apps/web` 골격: Next.js 16 App Router, React 19, Tailwind CSS v4(`@import "tailwindcss"`), `tailwind.config.js` 없음
- [ ] `services/worker` 골격과 `src/env.ts`
- [ ] env zod 검증(앱·워커), `NEXT_PUBLIC_`에 `SERVICE_ROLE`·`OPENAI`·`ANTHROPIC`·`TOSS_SECRET` 이름 0
- [ ] `.env.example`에 이름만 기재 (값 없음)
- [ ] `docker-compose.yml`(web 3000, worker), `.dockerignore`, `apps/web/Dockerfile.dev`, `scripts/dev/docker.mjs`(`pnpm dev:docker`)
- [ ] `.github/workflows/` CI: PR마다 install · typecheck · lint · build · test, 실패 시 머지 차단
- [ ] 외부 API 기본값은 가짜 어댑터

## 안 할 것 (범위 밖)

- 소유 경로 밖 파일 (필요하면 `[REQUEST]`)
- 다음 작업의 범위: GC-06-002 DB 마이그레이션(`supabase/`), GC-06-004 디자인 토큰 · 공용 셸(`apps/web/styles/`, `apps/web/components/`), GC-06-005 도메인 패키지(`packages/domain/`), GC-06-007 워커 런타임(`services/worker/src/runtime/`, `services/worker/Dockerfile`)
- 현재 릴리스 밖(R2 · R3) 기능

## 완료 조건

- [ ] `pnpm install --frozen-lockfile`·typecheck·lint·build·test가 CI에서 PR마다 실행되고 실패 시 머지 차단 — 확인: CI 워크플로 파일 점검 + 실패 케이스 1회 확인
- [ ] 의존성에 `latest` 0건, lockfile 커밋 — 확인: `grep -rn '"latest"' package.json apps services packages` 결과 0건, `pnpm-lock.yaml` 추적 확인
- [ ] Next.js 16 App Router, React 19, Tailwind CSS v4 (`@import "tailwindcss"`), `tailwind.config.js` 0 — 확인: `ls apps/web/tailwind.config.js` 없음, `apps/web/app/globals.css` 첫 줄 확인
- [ ] 린트 `no-explicit-any`·`no-console` 오류 — 확인: `pnpm lint`에서 의도적 위반 샘플이 실패
- [ ] env zod 검증: 필수 키 누락 시 앱·워커 기동 실패 — 확인: 필수 키를 비우고 `apps/web`, `services/worker` 기동 시 종료 코드 non-zero
- [ ] `NEXT_PUBLIC_`에 `SERVICE_ROLE`·`OPENAI`·`ANTHROPIC`·`TOSS_SECRET` 이름 0 — 확인: `grep -rn "NEXT_PUBLIC_.*\(SERVICE_ROLE\|OPENAI\|ANTHROPIC\|TOSS_SECRET\)" .env.example apps/web` 결과 0건
- [ ] Docker Desktop 기준(GC-D-26): `pnpm dev:docker` 한 번으로 Supabase 로컬 스택 기동 · `db reset` · `docker compose up`(web 3000, worker)이 순서대로 실행되고, 웹·워커 컨테이너가 `host.docker.internal:54321`로 Supabase에 붙음 — 확인: Docker Desktop에서 `pnpm dev:docker` 실행 후 `http://localhost:3000` 응답 확인
- [ ] `docker compose config` 통과 — 확인: `docker compose config` 종료 코드 0
- [ ] 이미지에 비밀 값 0(빌드 인자·`COPY .env` 금지), `.env.local` 커밋 0 — 확인: `grep -n "COPY .env\|ARG .*KEY" apps/web/Dockerfile.dev services/worker/Dockerfile` 0건, `git ls-files | grep -x ".env.local"` 0건
- [ ] 외부 API 기본값은 가짜 어댑터 — 확인: 키 미설정 상태에서 어댑터 선택 결과가 가짜 어댑터
- [ ] `/check` 해당 영역 통과 (typecheck · lint · test · build)
- [ ] review-expert 판정 ACCEPT, `security-auditor` 판정 기록

## 완료 보고

| 완료 조건 | 결과 | 확인 방법 | 담당 |
|---|---|---|---|
| | | | |

## 로그

- 2026-10-25 [PLAN] 사용자 승인("진행해줘")으로 W0 착수 — 팀장
- 2026-10-25 [DELEGATE] 구현 nextjs-expert(sonnet) — 06장 GC-06-001 행 + GC-D-26 — 팀장
- 2026-10-25 [DECISION] 버전 고정: Next 16.2.7 · React 19.2.9 · Tailwind CSS 4.3.3 · TypeScript 5.9.3 · zod 4.6.7 · ESLint 9.39.5 · Vitest 5.0.5 · Supabase CLI 2.122.0(npx 폴백) — 팀장
- 2026-10-25 [DONE] 1차 커밋 195bf32 — web·worker typecheck·lint·build·test 19건, docker compose config 통과 — 팀장
- 2026-10-25 [REVIEW] security-auditor: Critical/High 0, Medium 3(빌드 단계 mock 가드 꺼짐, 3000 포트 0.0.0.0, NEXT_PUBLIC 금지 이름 누락), Low 3 — 팀장
- 2026-10-25 [REVIEW] review-expert: 수정 필요(Medium) — worker Dockerfile 부재로 compose up 실패(007 범위), 정본 밖 *_PROVIDER 이름, 컨테이너 설치가 호스트 node_modules 오염 가능 — 팀장
- 2026-10-25 [DECISION] 빌드 단계 mock 가드는 001이 넣고 /api/dev/login 404 가드는 006. `*_PROVIDER`는 02장 8절 이름(AMAZON_DATA·IMAGE_COMPOSE)만 두고 가짜/실제는 키 유무로 판단(GC-D-26). worker Dockerfile이 없으면 dev:docker는 web만 기동(007 이후 함께) — 팀장
- 2026-10-25 [DELEGATE] 리뷰 지적 반영 nextjs-expert(sonnet) — 팀장
- 2026-10-25 [DONE] 리뷰 지적 반영 — 빌드 단계 mock 가드(VERCEL_ENV·RAILWAY_ENVIRONMENT=production이면 빌드 실패 확인), 127.0.0.1:3000, NEXT_PUBLIC 금지 이름 확대, provider 이름 정본화, worker Dockerfile 없으면 web만 기동, db reset --local, .env.local 자동 생성(빈 Supabase 값만), 컨테이너 설치 범위 축소. web 26·worker 16 테스트 통과 — 팀장
