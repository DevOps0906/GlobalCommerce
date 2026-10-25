# GC-06-003 RLS · 권한 회귀 테스트

- **웨이브 · 릴리스 · 규모**: W0 · R1 · M
- **선행 작업**: GC-06-002
- **소유 경로**: `tests/rls/` — 이 밖의 파일은 고치지 않고 로그에 `[REQUEST]`
- **기능 ID**: GC-F-002, GC-F-005
- **화면 ID**: 없음
- **관련 결정**: GC-D-21 (판정은 전부 서버) · GC-D-04
- **담당 (06장)**: Fable · `supabase-expert` / 검증 `security-auditor`, `test-writer`
- **실제 배치 (팀장)**: 구현 `supabase-expert` / 호출 모델 frontmatter(fable) / 하위 지시 없음
- **검증**: 착수 전 없음(GC-06-002 계획 검토로 갈음) · 변경 후 review-expert + `security-auditor`, `test-writer`
- **확인 위치**: Docker Desktop(GC-D-26)에서 최종 기동 확인; 클라우드 작업 환경은 이미지 저장소 차단으로 PGlite·문법 검사까지
- **상태**: 진행

## 목표

테이블 × 역할 매트릭스 전체를 자동 테스트로 고정해, RLS 회귀가 생기면 CI에서 머지가 막히게 한다.

## 참고 문서

- `products/06_AGENT_PLAN.md` 2장 GC-06-003 행 (소유 경로 · 수용 기준)
- `products/CLAUDE.md` 1절
- `products/00_DECISIONS.md` GC-D-21
- `products/00_DECISIONS.md` GC-F-002, GC-F-005 (5.1절)

## 할 것

- [ ] 테이블 × 역할(owner, admin, member, viewer, outsider, anon) 매트릭스 테스트 작성
- [ ] 다른 조직 행 0 확인, viewer 쓰기 거부 확인
- [ ] `profiles`의 역할·플랜 자기 수정 거부, `wallets`·`credit_ledger` 직접 쓰기 거부, `encrypted_credentials` 사용자 읽기 0행 확인
- [ ] CI 연결: 실패 시 머지 차단

## 안 할 것 (범위 밖)

- 소유 경로 밖 파일 (필요하면 `[REQUEST]`)
- 다음 작업의 범위: GC-06-004 디자인 토큰 · 공용 셸, GC-06-006 인증 Stage A(`apps/web/lib/auth/`), GC-06-011 마켓 계정(`encrypted_credentials` 쓰기 경로)
- 마이그레이션 수정 (GC-06-002 소유)
- 현재 릴리스 밖(R2 · R3) 테이블 테스트

## 완료 조건

- [ ] 테이블 × 역할(owner, admin, member, viewer, outsider, anon) 매트릭스 전부 통과 — 확인: 로컬 Supabase에서 `tests/rls/` 실행 결과 전체 pass
- [ ] 다른 조직 행 0 — 확인: outsider 계정으로 타 조직 행 select 결과 0행 assert
- [ ] viewer 쓰기 거부 — 확인: viewer 계정 insert·update·delete가 거부(권한 오류) assert
- [ ] `profiles`의 역할·플랜 자기 수정 거부 — 확인: member가 자기 `profiles.role`·`plan` update 시 거부 assert
- [ ] `wallets`·`credit_ledger` 직접 쓰기 거부 — 확인: owner 계정 직접 insert·update 거부 assert
- [ ] `encrypted_credentials` 사용자 읽기 0행 — 확인: owner 계정 select 결과 0행 assert
- [ ] CI 실패 시 머지 차단 — 확인: 일부러 깨뜨린 정책 1건으로 CI 실패 확인 후 원복
- [ ] `/check` 해당 영역 통과 (SQL · test)
- [ ] review-expert ACCEPT, `security-auditor`·`test-writer` 판정 기록

## 완료 보고

| 완료 조건 | 결과 | 확인 방법 | 담당 |
|---|---|---|---|
| | | | |

## 로그

- 2026-10-25 [PLAN] 002 커밋으로 착수. Docker 없이 여기와 CI에서 돌도록 PGlite + vitest 역할 매트릭스로 작성, pgTAP(supabase test db)은 Docker Desktop용 선택 — 팀장
- 2026-10-25 [DELEGATE] 구현 supabase-expert(fable) — 팀장
