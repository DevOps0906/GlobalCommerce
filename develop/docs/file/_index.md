# 산출물 등록부 (develop/docs/file/_index.md) — GlobalCommerce

> 개발·리뷰의 근거 산출물 목록입니다. task 파일의 "참고 문서"와 review-expert의 추적성 확인은 이 표의 ID와 경로만 씁니다.
> 형식은 platform-docs `develop/nomad-commerce/nomad-commerce-root/docs/file/_index.md`를 따랐습니다. 차이가 하나 있습니다. 벤치마크는 기획서를 `docs/file/01-관리/` 같은 단계 폴더로 **복사**했지만, GlobalCommerce는 기획서와 코드가 한 저장소에 있으므로 복사하지 않습니다. "단계" 열(01 관리 / 02 요구사항 / 03 설계 / 04 구현)은 분류만 나타내고, "경로" 열은 실제 파일(`products/...`, `docs/...`, `.claude/...`)을 저장소 루트 기준으로 가리킵니다. 그래서 `docs/file/` 아래에는 이 파일 하나만 있고, setup 스크립트나 `build_root.py`도 없습니다.
> 파일을 옮기거나 이름을 바꾸면 이 표의 경로를 같은 커밋에서 고칩니다. 상태가 "초안"인 산출물은 관련 열린 결정(`products/00_DECISIONS.md` 4절)을 반영한 뒤 "승인"으로 바꿉니다. 개발 task는 "초안"도 참고할 수 있지만, W1 전까지 01~05장을 "승인"으로 바꾸는 것을 권합니다(제안).

## 적용 기준

| 기준 | 버전 | 원문 확보 | 비고 |
|---|---|---|---|
| GlobalCommerce 확정 결정과 ID 체계 | 2026-10-25 | 확보 | `products/00_DECISIONS.md` |
| platform-docs 통합 기획 규칙(DOC_TEMPLATE, 코어 lite, AUTH_ROADMAP, _design-guide) | 2026-10-13 이후 | 저장소 밖 | DevOps0906/platform-docs `products/_platform-core/`, `products/_design-guide/` |

## 산출물

| ID | 산출물명 | 단계 | 출처 상태 | 상태 | 버전 | 경로 | 상위 ID |
|---|---|---|---|---|---|---|---|
| DOC-MGT-001 | 제품 개요(기획서 묶음 안내) | 01 관리 | 원문 확인 | 초안 | 1.0 | products/README.md | - |
| DOC-MGT-002 | 확정 결정과 ID 체계 | 01 관리 | 원문 확인 | 초안 | 1.0 | products/00_DECISIONS.md | - |
| DOC-MGT-003 | 작업 계획(WBS, GC-06-001~049) | 01 관리 | 원문 확인 | 초안 | 1.0 | products/06_AGENT_PLAN.md | DOC-MGT-002 |
| DOC-MGT-004 | 개발 방법 안내서 | 01 관리 | 원문 확인 | 초안 | 1.0 | develop/globalcommerce_develop.md | DOC-MGT-002 |
| DOC-MGT-005 | 팀 운영 규칙(멀티에이전트) | 01 관리 | 원문 확인 | 초안 | 1.0 | develop/MULTI_AGENT.md | - |
| DOC-MGT-006 | 작업 목록과 task 양식 | 01 관리 | 원문 확인 | 초안 | 1.0 | tasks/README.md, tasks/TEMPLATE.md | DOC-MGT-003 |
| DOC-REQ-001 | 요구사항정의서(GC-F-###) | 02 요구사항 | 원문 확인 | 초안 | 1.0 | products/01_PRD.md | DOC-MGT-002 |
| DOC-DES-001 | 아키텍처설계서 | 03 설계 | 원문 확인 | 초안 | 1.0 | products/02_ARCHITECTURE.md | DOC-REQ-001 |
| DOC-DES-002 | 화면설계서(GC-S-##) | 03 설계 | 원문 확인 | 초안 | 1.0 | products/03_SCREENS_UX.md | DOC-REQ-001 |
| DOC-DES-003 | 인터페이스설계서(API, 오류 코드 GC0##) | 03 설계 | 원문 확인 | 초안 | 1.0 | products/04_API.md | DOC-DES-001 |
| DOC-DES-004 | 데이터설계서(테이블, RLS, 페르소나) | 03 설계 | 원문 확인 | 초안 | 1.0 | products/05_DATA_MODEL.md | DOC-DES-001 |
| DOC-DES-005 | DB 마이그레이션 SQL(기획 시점) | 03 설계 | 원문 확인 | 초안 | 1.0 | products/supabase/monolith/0001_core_lite.sql, 0002_globalcommerce_domain.sql, seed.sql | DOC-DES-004 |
| DOC-DSN-001 | 대시보드 디자인 캔버스(화면 20개) | 03 설계 | 원문 확인 | 초안 | 1.0 | docs/design/dashboard/*.dc.html, docs/design/dashboard/canvas.json | DOC-DES-002 |
| DOC-DSN-002 | 디자인 토큰 표와 화면 목록 | 03 설계 | 원문 확인 | 초안 | 1.0 | docs/design/dashboard/README.md | DOC-DSN-001 |
| DOC-DSN-003 | 15단계 → 화면·패턴 구조도 | 03 설계 | 원문 확인 | 초안 | 1.0 | docs/design/structure-map.html | DOC-DES-002 |
| DOC-DSN-004 | 코드 디자인 토큰(Tailwind CSS v4 `@theme`) | 03 설계 | 미확인 | 예정 | - | apps/web/styles/tokens.css | DOC-DSN-002 |
| DOC-IMP-001 | 개발지침(제품 규칙) | 04 구현 | 원문 확인 | 초안 | 1.0 | products/CLAUDE.md | DOC-DES-001 |
| DOC-IMP-002 | 원본 이식 계획 | 04 구현 | 원문 확인 | 초안 | 1.0 | products/07_SOURCE_MIGRATION.md | DOC-DES-001 |
| DOC-IMP-003 | 저장소 운영 규칙(팀장·팀원 공통, 커밋 형식) | 04 구현 | 원문 확인 | 초안 | 1.0 | CLAUDE.md | DOC-MGT-005 |
| DOC-IMP-004 | 에이전트 정의와 팀장 모델 | 04 구현 | 원문 확인 | 초안 | 1.0 | .claude/agents/, .claude/settings.json | DOC-MGT-005 |
| DOC-IMP-005 | 작업 명령(agent-check, check, next-task, sync-design) | 04 구현 | 원문 확인 | 초안 | 1.0 | .claude/commands/ | DOC-MGT-005 |
| DOC-IMP-006 | 분야 스킬(nextjs-expert, supabase-expert, worker-expert) | 04 구현 | 원문 확인 | 초안 | 1.0 | .claude/skills/ | DOC-IMP-001 |
| DOC-IMP-007 | DB 마이그레이션(실행본) | 04 구현 | 미확인 | 예정 | - | supabase/migrations/, supabase/seed.sql | DOC-DES-005 |

<!-- 상태: 예정 | 초안 | 검토 | 승인 | 폐기 | 참고.  출처 상태: 원문 확인 | 공개 요약 | 미확인 -->

- "예정"은 아직 파일이 없고 작업이 만들 산출물입니다. DOC-DSN-004는 GC-06-004, DOC-IMP-007은 GC-06-002가 만들고, 만든 커밋에서 상태를 "초안"으로 바꿉니다.
- DOC-DES-005와 DOC-IMP-007의 관계(제안): 002가 복사한 뒤 `products/supabase/monolith/`는 기획 시점 스냅샷으로 고정하고, 이후 DB 정본은 DOC-IMP-007 + DOC-DES-004입니다.
- DOC-DSN-001은 00장 7절 "디자인 캔버스에서 고칠 곳"이 반영되기 전입니다. 구현할 때는 캔버스 수치보다 00장 GC-D-04가 우선합니다.

## 참고 산출물(입력 자료, 고치지 않음)

기획의 입력이 된 원자료입니다. 우선순위는 00장 1절(디자인 캔버스 > 15단계 PRD > PRD v3·스펙 > platform-docs)이고, 기획서와 다르면 기획서(위 표)가 이깁니다. task에서는 도메인 상세(규격, 폼 필드, 금지어)를 찾을 때만 참고합니다.

| ID | 산출물명 | 단계 | 상태 | 경로 | 주로 쓰는 작업 |
|---|---|---|---|---|---|
| DOC-REQ-101 | 15단계 마이크로 PRD | 02 요구사항 | 참고 | docs/prd/15-step-micro-prd.md | 전체(범위 확인) |
| DOC-REQ-102 | 전체 PRD v3.0.0 | 02 요구사항 | 참고 | docs/prd/PRD.md | 전체 |
| DOC-DES-101 | 디자인·UX 심화 스펙 | 03 설계 | 참고 | docs/spec/NOMAD_AI_FACTORY_MASTER_SPEC.md | 화면 task |
| DOC-DES-102 | 상세페이지 유형과 이미지 자동화 | 03 설계 | 참고 | docs/spec/DETAIL_PAGE_SYSTEM.md | 025, 026(18슬롯은 R2) |
| DOC-DES-103 | 마켓별 이미지 규격 | 03 설계 | 참고 | docs/spec/MARKET_IMAGE_SPEC.md | 023, 025 |
| DOC-DES-104 | 마켓별 상품 등록 폼 | 03 설계 | 참고 | docs/spec/MARKET_REGISTER_FORM.md | 012, 027, 028, 031 |
| DOC-DSN-101 | 디자인 시스템(스펙판) | 03 설계 | 참고 | docs/spec/DESIGN.md | 004 |
| DOC-DSN-102 | Stitch용 디자인 시스템 요약 | 03 설계 | 참고 | docs/spec/DESIGN_FOR_STITCH.md | 004 |
| DOC-DSN-103 | Stitch UI 디자인 기획서 | 03 설계 | 참고 | docs/spec/STITCH_UI_DESIGN_PLAN.md | 화면 task |
| DOC-DSN-104 | 랜딩페이지 Stitch 프롬프트 | 03 설계 | 참고 | docs/spec/LANDING_PAGE_STITCH_PROMPT.md | 랜딩(GC-S-17) |
| DOC-IMP-101 | 이전 개발 규칙(코드 저장소용 초안) | 04 구현 | 참고 | docs/spec/CLAUDE.md | 없음(DOC-IMP-001·003이 대체) |

## 변경 이력

| 날짜 | ID | 변경 | 사유 | 작업 |
|---|---|---|---|---|
| 2026-10-25 | 전체 | 최초 등록 | 기획서·개발서 구축, 입력 자료를 참고 산출물로 등록 | - |
