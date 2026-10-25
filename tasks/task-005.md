# GC-06-005 도메인 패키지

- **웨이브 · 릴리스 · 규모**: W0 · R1 · M
- **선행 작업**: 없음
- **소유 경로**: `packages/domain/`(`workflow/`, `jsonld/` 제외) — 이 밖의 파일은 고치지 않고 로그에 `[REQUEST]`
- **기능 ID**: GC-F-004, GC-F-005, GC-F-101
- **화면 ID**: 없음
- **관련 결정**: GC-D-04 (플랜 한도 · 가격 정본) · GC-D-02 (릴리스 범위)
- **담당 (06장)**: Opus · `worker-expert` / 검증 `contract-reviewer`, `test-writer`
- **실제 배치 (팀장)**: 구현 `worker-expert` / 호출 모델 opus / 하위 지시 없음
- **검증**: 착수 전 없음 · 변경 후 review-expert + `contract-reviewer`, `test-writer`
- **확인 위치**: Docker Desktop(GC-D-26)에서 최종 기동 확인; 클라우드 작업 환경은 이미지 저장소 차단으로 PGlite·문법 검사까지
- **상태**: 진행

## 목표

상수, zod 스키마, 플랜 features 파서, 크레딧 단가, 마진 계산, 마켓 규격, 단계 이름, nav를 한 패키지에 모아 웹·워커·DB가 같은 값을 읽게 한다.

## 참고 문서

- `products/06_AGENT_PLAN.md` 2장 GC-06-005 행 (소유 경로 · 수용 기준)
- `products/CLAUDE.md` 1절
- `products/00_DECISIONS.md` GC-D-04
- `products/00_DECISIONS.md` GC-D-02
- `products/00_DECISIONS.md` GC-F-004, GC-F-005, GC-F-101 (5.1절)

## 할 것

- [ ] 플랜 features 파서: 누락 키 기본값
- [ ] 플랜 한도를 GC-D-04 값과 일치시킴
- [ ] 마진 계산(환율 · 관부가세 · 배송비), 경계값 테스트
- [ ] 쿠팡 상세 1000px · 분할 2,800px 규격, 스마트스토어 규격
- [ ] `workflow_run_steps` 단계 이름 상수를 01장과 일치
- [ ] 요청 바디 스키마는 `plan`·`role`·`model` 필드를 받지 않음
- [ ] nav 정의 (`packages/domain/nav.ts`)

## 안 할 것 (범위 밖)

- 소유 경로 밖 파일 (필요하면 `[REQUEST]`)
- 다음 작업의 범위: GC-06-007 워커 런타임(`services/worker/src/runtime/`), GC-06-008 플랜 · 크레딧 API(`apps/web/app/api/`), GC-06-020 AI 라우터(`packages/ai/`)
- `packages/domain/workflow/`, `packages/domain/jsonld/` (R2·R3)
- 플랜 가격 · 한도 값 변경 (정본은 GC-D-04, 다르면 예외로 보고)

## 완료 조건

- [ ] features 누락 키 기본값 — 확인: 단위 테스트 `packages/domain` 실행, 누락 키 케이스 pass
- [ ] 플랜 한도가 GC-D-04와 일치 — 확인: 단위 테스트에서 free/starter/pro/enterprise 상품·슬롯·동시 생성·크레딧 값을 GC-D-04와 대조 assert
- [ ] 마진 공식(환율·관부가세·배송비) 경계값 — 확인: 경계값 단위 테스트 pass
- [ ] 쿠팡 상세 1000px · 분할 2,800px 규격 — 확인: 규격 상수 테스트 pass
- [ ] `workflow_run_steps` 단계 이름 상수가 01장과 일치 — 확인: 상수와 `products/01_*` 단계 이름 대조 테스트 pass
- [ ] 요청 바디 스키마가 `plan`·`role`·`model` 필드를 받지 않음 — 확인: 해당 필드 포함 바디 parse 실패 assert
- [ ] `/check` 해당 영역 통과 (typecheck · lint · test)
- [ ] review-expert ACCEPT, `contract-reviewer`·`test-writer` 판정 기록

## 완료 보고

| 완료 조건 | 결과 | 확인 방법 | 담당 |
|---|---|---|---|
| | | | |

## 로그

- 2026-10-25 [PLAN] 사용자 승인("진행해줘")으로 W0 착수 — 팀장
- 2026-10-25 [DELEGATE] 구현 worker-expert(opus) — 06장 GC-06-005 행 — 팀장
- 2026-10-25 [DONE] 1차 — @gc/domain 10개 모듈, 요청 스키마 19개 .strict(), 테스트 190건(seed·SQL CHECK·00·01·Sidebar 직접 대조) — 팀장
- 2026-10-25 [FOUND] 문서 불일치 6건: 단가(01 vs 02·04), 파이프라인 키(01 밑줄 vs 02·04·05·SQL 점 표기), features 키(01·04 vs seed), 04 images_confirmed 상태, 크론 payload run_id, 06 nav 경로 — 팀장
- 2026-10-25 [DECISION] 단가는 01장 4.2(O-09 정본), 파이프라인 키는 DB와 같은 점 표기로 통일하고 01장 3.8을 고침, features 키는 seed 정본, images_confirmed는 활동 kind + images_confirmed_at. 문서는 sub-agent-1이 고침 — 팀장
- 2026-10-25 [REQUEST] GC-06-004/006 apps/web: 처음 @gc/domain을 import하는 작업이 의존성 추가 + next.config transpilePackages. GC-06-007 services/worker: TS 원본 워크스페이스 패키지 실행(번들 또는 tsx) — 팀장
