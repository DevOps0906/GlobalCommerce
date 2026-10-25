---
name: supabase-expert
description: >-
  `supabase/` · `products/supabase/` (Postgres `public` 스키마 모놀리스 · RLS · Auth · Realtime · Storage · RPC · 마이그레이션) 작업 규약.
  코어 lite(조직 · 플랜 · 구독 · 결제 · 지갑 · 크레딧 원장 · 암호화 자격증명 · jobs)와 도메인 테이블(마켓 계정 · 상품 · 이미지 · 상세페이지 · 업로드 ·
  실행 기록 · 콘텐츠 · 검색), 조직별 격리 정책, 크레딧 선차감 · 환불 · 플랜 한도 RPC/트리거, 잡 claim, 웹훅 멱등, pgvector, 시드, 타입 생성,
  로컬 Supabase 를 만들거나 고칠 때 반드시 먼저 읽을 것. "스키마", "마이그레이션", "RLS", "정책", "RPC", "트리거", "시드" 요청도 여기서 시작한다.
  화면 소비 코드는 nextjs-expert, 워커 소비 코드는 worker-expert 다. 기존 마이그레이션 파일과 코어 lite 복사본은 수정하지 않는다.
---

# supabase-expert — `supabase/` · `products/supabase/` 작업 규약

> **버전 주의**: Supabase CLI · 플랫폼 기능(pgvector, Vault, Realtime 설정)은 빠르게 바뀐다. 명령 · 설정 키는 `supabase --help`와 공식 문서로 확인한다.
> 확인하지 못한 항목은 "미확인"으로 보고한다.

## 0. 30초 요약

1. 모든 테이블은 RLS 를 켠다. 격리 단위는 조직(`org_id`). 정책 의도를 주석으로 남긴다.
2. 스키마 변경은 새 마이그레이션 파일로만. 기존 파일 · 코어 lite 복사본은 수정하지 않는다.
3. 판정(역할 · 플랜 · 크레딧 · 한도)은 DB 가 한다 — RPC · 트리거 · `session_context`, 오류는 `GC0##` · `CR001` (GC-D-21, 5.5).
4. 금액 · 크레딧은 정수. 마켓 키 · SNS 토큰은 `encrypted_credentials`에 암호화, 사용자는 마스킹 값만 읽는다.
5. 원격 DB 적용 · 삭제는 실행하지 않고 제시만 한다. 테이블 이름 정본은 `00_DECISIONS.md` 5.3, 설계 정본은 `products/05_DATA_MODEL.md` · `products/supabase/monolith/`, RPC 계약은 `products/04_API.md` 3장.

## 1. 요청 판별

| 요청 | 시작 위치 |
|---|---|
| 새 테이블 · 컬럼 | `00_DECISIONS.md` 5.3 → `products/05_DATA_MODEL.md` 2장 → `products/supabase/monolith/` → `references/conventions.md` §마이그레이션 |
| 권한 · 정책 | `products/05_DATA_MODEL.md` 4장 → `references/conventions.md` §RLS |
| 크레딧 · 플랜 한도 · 결제 기록 | `references/conventions.md` §크레딧 · 결제 · 동시성 → `products/04_API.md` |
| 잡 큐 · 실행 기록 | `00_DECISIONS.md` 5.4 · GC-D-18 → `references/conventions.md` §잡 |
| 마켓 키 · SNS 토큰 | `references/conventions.md` §자격증명 |
| 검색(R3) | GC-D-15 → `references/conventions.md` §pgvector |
| 로컬 실행 · 검증 | `references/build-and-run.md` |

## 2. 핵심 규칙

- 정책은 동작별(select/insert/update/delete)로 나누고, 호출 주체(사용자 세션 · 슈퍼 어드민 · service role 워커)를 명시한다.
- 파괴적 변경은 영향 범위(생성 타입 · 웹 쿼리 · 워커 쿼리 · 큐에 남은 잡 payload)와 되돌리기 방법을 적는다. 배포 순서는 마이그레이션 → 워커 → 웹.
- `products/supabase/` 설계 SQL 과 `supabase/migrations/`가 어긋나면 설계 문서부터 고친다 (루트 `CLAUDE.md` 3장 5번).
- 정책 · 스키마 변경 후 nextjs-expert · worker-expert 에게 넘길 항목(타입 재생성, 쿼리 수정)을 남긴다.

## 3. 제출 전 자가 점검

- [ ] 새 테이블에 RLS 가 켜져 있고 정책 의도가 설명됐는가
- [ ] 같은 조직 / 다른 조직 / 비로그인 / 슈퍼 어드민 성공 · 거부 시나리오를 적었는가
- [ ] `supabase db reset`으로 처음부터 재현되는가 (미실행이면 "미검증")
- [ ] 금액 · 크레딧 컬럼이 정수인가, 자격증명 평문 컬럼이 없는가
- [ ] 동시성(크레딧 차감 · 잡 claim · 웹훅 · 업로드)에 잠금 · 고유 제약이 있는가
- [ ] 키 · 시크릿이 파일 · 로그 · 시드에 없는가

## 4. 참조 파일 지도

| 파일 | 언제 |
|---|---|
| `references/conventions.md` | 마이그레이션 · RLS · 크레딧 · 잡 · 자격증명 · 동시성 |
| `references/pitfalls.md` | 이상 동작, 리뷰 전 점검 |
| `references/build-and-run.md` | 로컬 실행 · 검증 명령 |
