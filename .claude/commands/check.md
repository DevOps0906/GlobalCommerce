---
description: 타입체크 · 린트 · 테스트 · 빌드 · SQL · 금지 패턴 점검 후 결과 요약
---
존재하는 프로젝트 · 스크립트만 실행하고, 결과를 표(항목 / 결과 / 실패 내용)로 요약한다. 없는 스크립트는 "스크립트 없음", 실행하지 못한 것은 "미검증"으로 쓰고 통과로 세지 않는다.
실패는 원인과 고칠 방법을 제안하되 사용자가 요청하기 전에는 고치지 않는다. `$ARGUMENTS`에 영역(`web` · `worker` · `packages` · `db` · `grep`)이 있으면 그 영역만 실행한다.

## 1. 코드 (pnpm 모노레포)

- 루트: `pnpm install --frozen-lockfile`(잠금 파일이 바뀌지 않는지만 확인), 루트 스크립트가 있으면 `pnpm typecheck` · `pnpm lint` · `pnpm test`
- apps/web: `pnpm --filter ./apps/web typecheck`, `lint`, `test`, `build`
- services/worker: `pnpm --filter ./services/worker typecheck`, `lint`, `test` (렌더 테스트는 `ffmpeg -version`이 될 때만)
- packages/*: `pnpm --filter "./packages/*" typecheck`, `test`

## 2. DB · SQL

- 로컬 Supabase 가 켜져 있으면: `supabase db reset` 후 `supabase test db`
- 켜져 있지 않아도 정적 점검(`supabase/migrations/*.sql`, `products/supabase/**/*.sql`):
  - `create table` 된 테이블 목록과 `enable row level security` 된 테이블 목록을 대조해 RLS 빠진 테이블을 보고
  - `using (true)` · `with check (true)` 정책
  - 금액 · 크레딧으로 보이는 컬럼(`price`, `amount`, `credit`, `balance`, `cost`)의 `float` · `double precision` · `real` 타입
  - `security definer` 함수에 `set search_path`가 없는 경우
  - 기존 마이그레이션 파일이 바뀌었는지: `git diff --name-status <기준 브랜치>...HEAD -- supabase/migrations/` 에서 `M` · `D` (기준 브랜치는 사용자에게 확인, 기본 `main`)

## 3. 금지 패턴 grep (`products/00_DECISIONS.md` GC-D-19 · GC-D-21, v1 리뷰 결함)

| 점검 | 명령 예 | 기대 |
|---|---|---|
| 브라우저 저장소에 키 · 토큰 | `grep -rnE "(localStorage|sessionStorage)" apps/web packages --include=*.ts --include=*.tsx` | 0건, 있으면 저장 키 이름에 `key` · `token` · `secret` 포함 여부 표시 |
| `NEXT_PUBLIC_` 비밀 | `grep -rnE "NEXT_PUBLIC_[A-Z0-9_]*(SERVICE_ROLE|SECRET|PRIVATE|API_KEY|TOSS_SECRET|OPENAI|ANTHROPIC)" .` (`node_modules` 제외) | 0건 |
| 클라이언트의 service role | `"use client"` 파일 안 `service_role` · `SUPABASE_SERVICE_ROLE` | 0건 |
| 서버 전용 패키지의 클라이언트 import | `"use client"` 파일 안 `@*/ai` · `@*/markets` · `@*/net` · `@*/sourcing` import | 0건 |
| Tailwind v3 설정 | `ls apps/web/tailwind.config.* 2>/dev/null` | 없음 (토큰은 `apps/web/styles/tokens.css` `@theme`) |
| 하드코딩 색 | `grep -rnE "#[0-9A-Fa-f]{6}\b" apps/web --include=*.tsx` (tokens.css 제외) | 0건 |
| CORS 전체 허용 | `grep -rn "Access-Control-Allow-Origin" apps services packages` 값이 `*` | 0건 |
| 금지어 정규식 `\b` | `grep -rn '\\b' packages/compliance` | 0건 (한글 경계 매칭, GC-D-11) |
| 셸 문자열 실행 | `grep -rnE "child_process.*exec\(|execSync\(" services packages` | 0건 (`spawn`/`execFile` + 인자 배열) |
| 추적되는 `.env` | `git ls-files | grep -E "(^|/)\.env" | grep -v "\.env\.example$"` | 0건 |

검색 결과는 파일:줄만 보고하고, `.env*` 값은 출력하지 않는다.
