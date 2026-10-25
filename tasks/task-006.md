# GC-06-006 인증 Stage A · `proxy.ts` · 세션

- **웨이브 · 릴리스 · 규모**: W0 · R1 · M
- **선행 작업**: GC-06-001, GC-06-002
- **소유 경로**: `apps/web/lib/{auth,session}/`(`auth/naver/` 제외), `apps/web/proxy.ts`, `apps/web/app/(auth)/login/`, `apps/web/app/api/dev/login/`, `apps/web/app/onboarding/`(`terms/` 제외), `scripts/dev/` — 이 밖의 파일은 고치지 않고 로그에 `[REQUEST]`
- **기능 ID**: GC-F-001 (단계 A), GC-F-002
- **화면 ID**: 없음 (로그인 · 온보딩 기본 단계 포함)
- **관련 결정**: GC-D-07 (로그인 단계 A → B → C) · GC-D-21 (판정은 서버)
- **담당 (06장)**: Fable · `nextjs-expert` / 검증 `plan-challenger`, `security-auditor`, `test-writer`
- **실제 배치 (팀장)**: 구현 `nextjs-expert` / 호출 모델 frontmatter(fable) / 하위 지시 없음
- **검증**: 착수 전 `plan-challenger`(인증·권한 계획 공격) · 변경 후 review-expert + `security-auditor`, `test-writer`
- **확인 위치**: Docker Desktop(GC-D-26)에서 최종 기동 확인; 클라우드 작업 환경은 이미지 저장소 차단으로 PGlite·문법 검사까지
- **상태**: 대기

## 목표

Mock 로그인(로컬 시드 계정으로 실제 Supabase JWT 발급)과 `proxy.ts` · `requireSession`을 만들어 역할·조직 판정이 서버에서만 일어나게 한다.

## 참고 문서

- `products/06_AGENT_PLAN.md` 2장 GC-06-006 행 (소유 경로 · 수용 기준)
- `products/CLAUDE.md` 1절, 9절 (인증 단계 규칙)
- `products/00_DECISIONS.md` GC-D-07
- `products/00_DECISIONS.md` GC-D-21
- `products/00_DECISIONS.md` GC-F-001, GC-F-002 (5.1절)

## 할 것

- [ ] `apps/web/lib/{auth,session}/`: Mock 로그인, `requireSession`, `session_context('globalcommerce')` 호출
- [ ] 페르소나 로그인: owner, admin, member, viewer, outsider, no_app, suspended, ops, pro(제안)
- [ ] `apps/web/proxy.ts`: 관리자 경로 보호, `next` 파라미터 검증
- [ ] `apps/web/app/api/dev/login/`: `AUTH_MODE=mock`에서만 활성
- [ ] 온보딩 기본 단계(`terms/` 제외)
- [ ] `scripts/dev/` 시드 스크립트: 원격 URL이면 exit 1

## 안 할 것 (범위 밖)

- 소유 경로 밖 파일 (필요하면 `[REQUEST]`)
- 다음 작업의 범위: GC-06-036 인증 Stage B(Google · 이메일 제공자 버튼), GC-06-044 인증 Stage C(카카오 · 네이버), GC-06-008 플랜 · 크레딧 API, GC-06-013 슈퍼 어드민 화면
- `apps/web/lib/auth/naver/`, `apps/web/app/onboarding/terms/` (다른 단계)
- 실제 제공자 버튼 노출 (B 단계부터)

## 완료 조건

- [ ] 페르소나 `owner`·`admin`·`member`·`viewer`·`outsider`·`no_app`·`suspended`·`ops` + 제품 `pro`(제안) 로그인 — 확인: 각 페르소나 로그인 e2e 또는 테스트 pass
- [ ] `owner` → `session_context('globalcommerce')` entitled·plan `free` — 확인: owner 로그인 후 `session_context` 응답 assert
- [ ] 재로그인 3회 뒤 크레딧 원장 행 수 같음 — 확인: owner 3회 재로그인 전후 `credit_ledger` count 비교
- [ ] `outsider`로 다른 조직 0행 — 확인: outsider 계정 조직 데이터 조회 0행 assert
- [ ] 쿠키 `nomad_role=SUPER_ADMIN` 위조 시 관리자 403 — 확인: 위조 쿠키로 관리자 경로 요청 → 403
- [ ] `next=//evil.com` → `/dashboard` — 확인: 로그인 후 리다이렉트 결과 `/dashboard`
- [ ] 요청당 `session_context` 1회 — 확인: 요청 1건에 대한 호출 카운트 1 assert
- [ ] `AUTH_MODE=mock VERCEL_ENV=production` 빌드 실패 — 확인: 해당 env로 `pnpm build` 종료 코드 non-zero
- [ ] `AUTH_MODE=live`에서 `/api/dev/login` 404 — 확인: live 모드 기동 후 `/api/dev/login` 요청 404
- [ ] 시드 스크립트는 원격 URL이면 exit 1 — 확인: 원격 URL로 스크립트 실행 시 종료 코드 1
- [ ] `/check` 해당 영역 통과 (typecheck · lint · test · build)
- [ ] review-expert ACCEPT, `security-auditor`·`test-writer` 판정 기록

## 완료 보고

| 완료 조건 | 결과 | 확인 방법 | 담당 |
|---|---|---|---|
| | | | |

## 로그

