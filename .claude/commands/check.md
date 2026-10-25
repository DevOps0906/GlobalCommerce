---
description: 타입체크 · 린트 · 테스트 · 빌드 · SQL · 금지 패턴 점검 후 결과 요약
---
존재하는 프로젝트 · 스크립트만 실행하고, 결과를 표(항목 / 결과 / 실패 내용)로 요약한다. 없는 스크립트는 "스크립트 없음", 실행하지 못한 것은 "미검증"으로 쓰고 통과로 세지 않는다.
실패는 원인과 고칠 방법을 제안하되 사용자가 요청하기 전에는 고치지 않는다. `$ARGUMENTS`에 영역(`web` · `worker` · `packages` · `db` · `e2e` · `grep`)이 있으면 그 영역만 실행한다.
명령 이름은 `products/CLAUDE.md` 7장(제안)이 기준이고, 스크립트 이름은 GC-06-001 이 확정한다. 루트 `package.json` `scripts`를 먼저 확인한다.

## 1. 코드 (pnpm 모노레포)

- 루트: `pnpm install --frozen-lockfile`(잠금 파일이 바뀌지 않는지만 확인), `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build`
- apps/web: `pnpm --filter ./apps/web test`
- services/worker: `pnpm --filter ./services/worker test` (렌더 테스트는 `ffmpeg -version`이 될 때만)
- packages/*: `pnpm --filter "./packages/*" test`

## 2. DB · SQL

- 로컬 Supabase 가 켜져 있으면: `supabase db reset`(2회 연속 성공 확인), `pnpm test:rls`(`tests/rls/`), `supabase test db`(pgTAP 이 있으면)
- 생성 타입 최신 여부: `supabase gen types typescript --local` 결과와 커밋된 `apps/web/types/supabase.ts` 비교 (파일을 덮어쓰지 말고 임시 경로에 받아 diff)
- 켜져 있지 않아도 정적 점검(`supabase/migrations/*.sql`, `products/supabase/**/*.sql`):
  - `create table` 된 테이블 목록과 `enable row level security` 된 테이블 목록을 대조해 RLS 빠진 테이블을 보고
  - `using (true)` · `with check (true)` · `for all` 정책
  - 금액 · 크레딧으로 보이는 컬럼(`price`, `amount`, `credit`, `balance`, `cost`)의 `float` · `double precision` · `real` 타입
  - `security definer` 함수에 `set search_path`가 없는 경우, `gc_` 접두사가 없는 제품 함수
  - 기존 마이그레이션 파일이 바뀌었는지: `git diff --name-status <기준 브랜치>...HEAD -- supabase/migrations/` 에서 `M` · `D` (기준 브랜치는 사용자에게 확인, 기본 `main`)

## 3. E2E (`$ARGUMENTS`에 `e2e`가 있을 때만 — 시간이 걸림)

- `pnpm test:e2e`(Mock 페르소나), 결제 `tests/e2e/billing/`, 반응형 `tests/e2e/responsive/`. 외부 실 계정 · 라이브 키로 돌리지 않는다.

## 4. 금지 패턴 grep (`products/CLAUDE.md` 2장 · 8장, `00_DECISIONS.md` GC-D-19 · GC-D-21)

GC-06-034 이후 `node scripts/security/check.mjs`가 있으면 그것을 먼저 실행하고, 아래는 그 스크립트가 없을 때의 대체 점검이다.

| 점검 | 명령 예 | 기대 |
|---|---|---|
| 브라우저 저장소에 키 · 토큰 · 역할 · 플랜 · 크레딧 | `grep -rnE "(localStorage|sessionStorage|indexedDB)" apps/web packages --include=*.ts --include=*.tsx` | 0건, 있으면 저장 값이 UI 편의 상태인지 표시 |
| `NEXT_PUBLIC_` 비밀 | `grep -rnE "NEXT_PUBLIC_[A-Z0-9_]*(SERVICE_ROLE|SECRET|PRIVATE|API_KEY|TOSS_SECRET|OPENAI|ANTHROPIC)" . --exclude-dir=node_modules` | 0건 |
| 클라이언트의 service role | `"use client"` 파일 안 `service_role` · `SUPABASE_SERVICE_ROLE` | 0건 |
| 서버 전용 패키지의 클라이언트 import | `"use client"` 파일 안 `packages/{ai,markets,net,sourcing}` import, `packages/ai`에 `server-only` import 존재 | 0건 / 있음 |
| 요청 바디의 plan · role · model · provider | `grep -rnE "body\.(plan|role|model|provider)" apps/web/app/api` | 0건 |
| Tailwind v3 | `ls apps/web/tailwind.config.* 2>/dev/null`, `grep -rn "@tailwind base" apps/web` | 없음 (토큰은 `apps/web/styles/tokens.css` `@theme`) |
| 하드코딩 색 | `grep -rnE "#[0-9A-Fa-f]{6}\b|bg-\[#" apps/web --include=*.tsx` (tokens.css 제외) | 0건 |
| CORS 전체 허용 | `grep -rn "Access-Control-Allow-Origin" apps services packages` 값이 `*` | 0건 |
| 금지어 정규식 `\b` | `grep -rn '\\b' packages/compliance` | 0건 (한글 경계 매칭, GC-D-11) |
| 사용자 URL 직접 fetch | `packages/net` 밖의 `fetch(` 중 사용자 입력 URL | 0건 |
| `globalThis` 잡 · 브라우저 큐 | `grep -rn "globalThis" apps/web services` | 0건 |
| 셸 문자열 실행 | `grep -rnE "child_process.*exec\(|execSync\(" services packages` | 0건 (`spawn`/`execFile` + 인자 배열) |
| 추적되는 `.env` | `git ls-files | grep -E "(^|/)\.env" | grep -v "\.env\.example$"` | 0건 |

검색 결과는 파일:줄만 보고하고, `.env*` 값은 출력하지 않는다.
