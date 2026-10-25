# supabase-expert — conventions

> 프로젝트의 실제 설정 · 기존 마이그레이션 · `products/05_DATA_MODEL.md` · `products/supabase/monolith/` 설계가 우선한다. 불일치는 보고한다.

## 마이그레이션

- 위치 `supabase/migrations/`. R1 은 `0001_core_lite.sql` · `0002_gc_domain_r1.sql`(GC-06-002), R2 · R3 는 작업마다 새 파일 1개 `<번호>_gc_<영역>.sql` (06장 1절). 설계 원본은 `products/supabase/monolith/`(0001 · 0002 · seed).
- 한 마이그레이션 = 하나의 의도 (테이블 생성 / 정책 추가 / 인덱스 추가 / RPC 추가). 섞지 않는다.
- 이미 있는 파일은 수정하지 않는다. 고칠 때는 새 마이그레이션으로.
- 스키마는 `public` 하나(모놀리스, 00 2절). 테이블 이름은 `00_DECISIONS.md` 5.3 과 같게 쓴다. 새 이름이 필요하면 결정 문서 변경부터 제안한다.
- 코어 lite 는 platform-docs `products/_platform-core/MONOLITH_CORE_LITE.sql`에서 그대로 복사한다 (affiliate · AI 지식 · 위키 절 제외). 복사본은 고치지 않고, 바꿔야 하면 도메인 마이그레이션에서 확장한다.
- 릴리스 밖 테이블(R2 콘텐츠 · 워크플로우 정의, R3 검색)은 해당 릴리스 task 에서 만든다.

## RLS

- 테이블 생성과 같은 마이그레이션에서 RLS 를 켠다.
- 기본 정책: 행의 `org_id`가 현재 사용자가 속한 조직(`org_members`)인 경우만. 판정 함수 이름 · 형태는 코어 lite 정본을 따른다. 정책 조건 컬럼(`org_id`)에는 인덱스.
- update 정책은 using 과 with check 를 모두 쓴다 (다른 조직으로 옮기기 방지).
- 사용자가 고칠 수 있는 값(`user_metadata`, 쿠키, `profiles`의 역할 · 플랜 자기 수정)을 권한 근거로 쓰지 않는다. 역할 · 플랜은 `session_context` · `entitled_plan_code` · `plans.features`(`gc_features`)에서.
- 조직 역할은 owner · admin · member · viewer, 테스트 매트릭스는 여기에 outsider · anon 을 더한다 (GC-06-003). viewer 는 쓰기 거부.
- `using (true)` · `FOR ALL` 정책을 쓰지 않는다.
- 슈퍼 어드민(`is_platform_admin`)은 별도 경로 + `audit_log` 기록. 일반 정책에 예외 분기를 섞지 않는다.
- 제품 함수는 `public`에 `gc_` 접두사, `set search_path = ''`, PUBLIC EXECUTE 회수, 호출자 판정 `is_service_caller()` (`products/04_API.md` 3장).
- 조직 없는 공용 테이블(`fx_rates` · `trend_keywords` · `season_picks`)은 인증 사용자 읽기만, 쓰기는 service role(워커 크론).
- `banned_words`는 `org_id is null`(기본 사전) 읽기 + 자기 조직 사전 읽기/쓰기.
- service role 은 RLS 를 우회한다 — 워커 · 웹훅 같은 서버 경로에서만, 사용 이유를 주석으로.

## 크레딧 · 플랜 한도 · 결제

- 크레딧은 `wallets` 잔액 + `credit_ledger` 원장. 차감 · 환불은 코어 `consume_credits` · `refund_credits`만 쓰고 새 차감 함수를 만들지 않는다 (`products/CLAUDE.md` 2장). 부족하면 `CR001`.
- 같은 `request_id` 재요청은 원장 1행(멱등 키), 환불은 원 차감 원장 행을 참조해 한 번만. `wallets` · `credit_ledger`는 사용자가 직접 쓸 수 없다.
- 플랜 한도(상품 수 GC002 · 마켓 슬롯 GC003 · 기능 GC007 · 동시 실행 GC008)는 트리거 · RPC 에서 집행한다. 앱 검사는 UX 보조일 뿐이다. 한도 값은 `plans` · `app_entitlements` (GC-D-04 값과 `packages/domain` 일치).
- Toss: `payment_orders`(서버가 만든 주문 · 금액) → `payments`(승인 결과) · `subscriptions` · `billing_keys`. 웹훅은 `webhook_events`에 이벤트 id 고유 제약으로 한 번만 처리.

## 잡 · 실행 기록

- 모든 비동기 작업은 코어 `jobs` (큐 `gc.*` · `job_type`은 5.4 정본). 등록은 `enqueue_job`, 워커는 코어 `claim_jobs` · `heartbeat_job` · `complete_job` · `fail_job` · `reap_stale_jobs`를 쓴다 (GC-06-007). 코어 함수가 부족하면 고치지 말고 `[REQUEST] core`.
- 사용자에게 보이는 단위는 `workflow_runs`(종류 `system` | `workflow`) · `workflow_run_steps`. R1 은 `system`만 (GC-D-18).
- Realtime 으로 내보낼 테이블은 필요한 것만 publication 에 넣고, RLS 가 Realtime 에도 적용되는지 확인한다.

## 자격증명

- 마켓 API 키 · SNS 토큰 · WordPress 자격증명은 `encrypted_credentials`에 암호화 저장. 암호화 방식(Vault · pgsodium · 앱 계층 키)은 데이터 모델 정본을 따르고, 정해지지 않았으면 plan-challenger 대상이다.
- 사용자 세션은 자격증명 원문 · 암호문을 select 할 수 없다. 화면에는 마스킹 값 · 검증 상태 · 만료일만 담은 뷰/컬럼을 준다.
- 복호화는 서버(워커) 실행 시점에만.

## 업로드 · 멱등

- `market_listings`는 (상품, 마켓 계정) 고유 — 재전송이 새 행을 만들지 않는다. 외부 등록 id · URL 을 저장한다 (GC-F-304).
- `upload_batches`의 진행률은 항목 상태에서 계산하고, 실패 항목만 다시 큐에 넣을 수 있게 항목 단위 상태를 둔다.

## pgvector (R3)

- `product_embeddings`는 `vector(1536)`(`text-embedding-3-small`, GC-D-15). 인덱스 종류는 착수 시 데이터 크기로 정한다. 하이브리드 검색 RPC 는 전문 검색 + 벡터 가중치.

## 타입 · 시드

- DB 변경 후 생성 타입 `apps/web/types/supabase.ts`를 재생성해 커밋한다 (GC-06-002). 생성 파일은 직접 수정하지 않는다.
- 시드는 로컬 개발용(인증 단계 A 시드 계정, 플랜 · 크레딧팩 값, 기본 금지어 사전). 실제 개인정보 · 키 · 마켓 계정을 넣지 않는다.
