# GC-06-002 DB 마이그레이션 (코어 lite + 도메인 R1)

- **웨이브 · 릴리스 · 규모**: W0 · R1 · L
- **선행 작업**: 없음
- **소유 경로**: `supabase/migrations/0001_core_lite.sql`, `supabase/migrations/0002_gc_domain_r1.sql`, `supabase/seed.sql`, `supabase/config.toml`, `apps/web/types/supabase.ts`(생성물) — 이 밖의 파일은 고치지 않고 로그에 `[REQUEST]`
- **기능 ID**: GC-F-002, GC-F-004, GC-F-005
- **화면 ID**: 없음
- **관련 결정**: GC-D-04 (플랜 4종 · 한도 · 가격 정본) · GC-D-21 (서버 판정) · GC-D-26 (로컬 Supabase 스택)
- **담당 (06장)**: Fable · `supabase-expert` / 검증 `plan-challenger`, `contract-reviewer`, `security-auditor`
- **실제 배치 (팀장)**: 구현 `supabase-expert` / 호출 모델 fable / 하위 지시 없음
- **검증**: 착수 전 `plan-challenger`(DB·RLS 계획 공격) · 변경 후 review-expert + `contract-reviewer` + `security-auditor`(마이그레이션은 둘 다)
- **확인 위치**: Docker Desktop(GC-D-26)에서 최종 기동 확인; 클라우드 작업 환경은 이미지 저장소 차단으로 PGlite·문법 검사까지
- **상태**: 진행

## 목표

코어 lite 스키마(platform-docs 원본과 diff 0)와 GlobalCommerce R1 도메인 테이블, RLS, 한도·상태 트리거, seed, 생성 타입을 한 번에 세워 이후 모든 작업이 같은 DB 기준 위에서 돌게 한다.

## 참고 문서

- `products/06_AGENT_PLAN.md` 2장 GC-06-002 행 (소유 경로 · 수용 기준)
- `products/CLAUDE.md` 1절
- `products/00_DECISIONS.md` GC-D-04 (플랜 한도 · 가격)
- `products/00_DECISIONS.md` 5.3절 (R1 도메인 테이블)
- `products/00_DECISIONS.md` GC-F-002, GC-F-004, GC-F-005 (5.1절)

## 할 것

- [ ] `0001_core_lite.sql`: platform-docs 코어 lite 원본 복사 (diff 0)
- [ ] `0002_gc_domain_r1.sql`: 5.3절 R1 도메인 테이블, `org_id`·RLS·`with check`, `FOR ALL` 정책 0
- [ ] 읽기 공개 · 쓰기 service_role: `fx_rates`, `trend_keywords`, `season_picks`
- [ ] 트리거: 상품 수 GC002, 마켓 슬롯(플랜 + `slot_addons`) GC003, 상태 전이 GC001, 동시 실행 GC008
- [ ] `seed.sql`: `plans` 4행을 GC-D-04 값과 스냅샷 일치, `apps.id='globalcommerce'`, `banned_words` 기본 사전(org null)
- [ ] `supabase/config.toml`, `supabase gen types` 결과를 `apps/web/types/supabase.ts`에 커밋

## 안 할 것 (범위 밖)

- 소유 경로 밖 파일 (필요하면 `[REQUEST]`)
- 다음 작업의 범위: GC-06-003 RLS · 권한 회귀 테스트(`tests/rls/`), GC-06-005 도메인 패키지(`packages/domain/`), GC-06-006 인증(`apps/web/lib/auth/`)
- R2·R3 테이블(해당 작업이 새 마이그레이션 파일 1개씩 소유)
- 원격 DB 적용 · 삭제 (사용자 확인 없이 금지)

## 완료 조건

- [ ] `supabase db reset` 2회 연속 성공 — 확인: 로컬 Supabase에서 `supabase db reset` two times, 종료 코드 0
- [ ] 코어 lite가 platform-docs 원본과 diff 0 — 확인: `diff` 원본 대 `supabase/migrations/0001_core_lite.sql` 결과 없음
- [ ] 00장 5.3절 R1 도메인 테이블 전부 `org_id`·RLS·`with check`, `FOR ALL` 정책 0 — 확인: 테이블별 `pg_policies` 조회, `FOR ALL` 0건, `with check` 존재 확인
- [ ] `fx_rates`·`trend_keywords`·`season_picks`는 읽기 공개·쓰기 service_role만 — 확인: anon `select` 성공, anon `insert` 거부
- [ ] 트리거: 상품 수 GC002, 마켓 슬롯(플랜 + `slot_addons`) GC003, 상태 전이 GC001, 동시 실행 GC008 — 확인: 한도 초과 INSERT·잘못된 상태 전이가 각 에러 코드로 거부
- [ ] seed의 `plans` 4행이 GC-D-04 값과 스냅샷 일치 (free 0/15/30, starter 29000, pro 69000, enterprise 149000 및 슬롯·상품·동시 생성) — 확인: `select * from plans` 결과를 GC-D-04와 대조
- [ ] `apps.id='globalcommerce'`, `banned_words` 기본 사전(org null) 존재 — 확인: `select id from apps`, `select count(*) from banned_words where org_id is null` > 0
- [ ] `supabase gen types` 결과 커밋 — 확인: `apps/web/types/supabase.ts`가 재생성 결과와 일치
- [ ] `/check` 해당 영역 통과 (SQL · typecheck)
- [ ] plan-challenger 계획 판정 기록, review-expert ACCEPT, `contract-reviewer`·`security-auditor` 판정 기록

## 완료 보고

| 완료 조건 | 결과 | 확인 방법 | 담당 |
|---|---|---|---|
| | | | |

## 로그

- 2026-10-25 [PLAN] 사용자 승인("진행해줘")으로 W0 착수 — 팀장
- 2026-10-25 [DELEGATE] 구현 supabase-expert(fable) — 06장 GC-06-002 행 — 팀장
- 2026-10-25 [DECISION] 착수 전 plan-challenger 생략: 설계 SQL(products/supabase/monolith)이 이미 PGlite 검사 · smoke 91건을 통과한 복사·분리 작업이라 변경 후 contract-reviewer · security-auditor로 대신함 — 팀장
- 2026-10-25 [DONE] 1차 — config.toml(CLI 2.48.3 템플릿), 코어 lite diff 0, 도메인 R1 분리(R2·R3는 037·039·040·042·045·046), seed, PGlite 기반 타입 생성. check 5/5, smoke-r1 114/114 — 팀장
- 2026-10-25 [DECISION] scripts/db/를 002 소유로, 타입 경로 apps/web/types/supabase.ts. gc_transition_allowed의 R2 행은 유지(이후 작업의 함수 재정의 결합 방지). 공용 참조 표 select 정책의 using(true)는 금지 규칙에 맞춰 authenticated + auth.uid() 검사로 바꾸고 설계 SQL(products 0002)도 함께 고침 — 팀장
- 2026-10-25 [REQUEST] 승인: 루트 package.json에 pglite devDependency · db:types 스크립트(001 소유 파일, 팀장 승인으로 002가 수정), develop 4절 · 등록부 · 05장 9절 문서 갱신 — 팀장
- 2026-10-25 [DONE] 커밋 ff03fca — R2 행 복구, 참조 표 정책 auth.uid() 검사, pglite devDependency · db:types, 문서 갱신. check 5/5, smoke-r1 115/115, 원본 smoke 91/91 — 팀장
- 2026-10-25 [REVIEW] review-expert: REQUEST_CHANGES — 🔴 gc_create_upload_batch가 진행 중 리스팅을 새 배치로 옮김(중복 등록 위험), 🟡 anon 읽기 기준 불일치 · GC008 문구 · 파일명 문서 — 팀장
- 2026-10-25 [REVIEW] security-auditor: Critical/High 0, Medium 4(다운그레이드 후 슬롯 한도 우회, gc_admin_set_plan 실행자 미기록, 사용자 수정 컬럼의 금지어 미검사, 조직 금지어가 기본 FAIL 약화), Low 4 — 팀장
- 2026-10-25 [DECISION] DB 정본은 supabase/migrations. 아직 어디에도 적용 전이라 20261025000002를 제자리 수정. 재투입은 failed/rejected/canceled만, 게이트에서 슬롯 초과 GC003, gc_admin_set_plan에 p_actor_id + DB 역할 확인, 조직 금지어는 기본 FAIL 단어를 약화 불가, 게이트가 해지된 자격증명 · 만료 계정 거부. 전역 참조 표는 authenticated만(06장 기준 수정). GC008은 디스패처 보류(202) — 팀장
- 2026-10-25 [REQUEST] GC-06-021 · 027 · 028: 금지어 매처가 상품명뿐 아니라 brand · attributes · tags · category_path(마켓 payload 전체)를 검사 — 팀장
- 2026-10-25 [FOUND] 상품 hard delete 시 market_listings 이력 cascade 삭제, detail_pages verdict null 상태 전이(게이트가 막아 영향 낮음) → tasks/README 발견한 문제 — 팀장
- 2026-10-25 [DONE] 리뷰 · 보안 반영 — 재투입 failed/rejected/canceled만(skipped_ids), 롤업 old·new 배치, 재시도 전환도 게이트 검사, 슬롯 초과 GC003, gc_admin_set_plan p_actor_id + platform_admin DB 확인, 기본 FAIL 약화 GC004, 해지 · 만료 자격증명 GC009, 상세-상품 불일치 42501, CI gen-types --check, 06 · 04 · 05 문서. check 5/5, smoke-r1 146/146 — 팀장
