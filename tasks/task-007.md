# GC-06-007 워커 런타임 (잡 루프 · 크론 · 안전 fetch)

- **웨이브 · 릴리스 · 규모**: W0 · R1 · L
- **선행 작업**: GC-06-002, GC-06-005
- **소유 경로**: `services/worker/src/runtime/`, `services/worker/Dockerfile`, `packages/net/` — 이 밖의 파일은 고치지 않고 로그에 `[REQUEST]`
- **기능 ID**: GC-F-401 (기반)
- **화면 ID**: 없음
- **관련 결정**: GC-D-04 (동시 생성 한도) · GC-D-26 (워커 이미지 로컬 · 배포 동일 Dockerfile)
- **담당 (06장)**: Opus · `worker-expert` / 검증 `plan-challenger`, `security-auditor`, `test-writer`
- **실제 배치 (팀장)**: 구현 `worker-expert` / 호출 모델 opus / 하위 지시 없음
- **검증**: 착수 전 `plan-challenger`(잡 큐 계획 공격) · 변경 후 review-expert + `security-auditor`, `test-writer`
- **확인 위치**: Docker Desktop(GC-D-26)에서 최종 기동 확인; 클라우드 작업 환경은 이미지 저장소 차단으로 PGlite·문법 검사까지
- **상태**: 진행

## 목표

잡 claim 루프와 핸들러 · 크론 자동 로드, 조직별 동시성, 재시도 · 취소, 안전 fetch를 갖춘 워커 런타임을 만들어 이후 잡 작업이 핸들러 파일만 추가하면 돌게 한다.

## 참고 문서

- `products/06_AGENT_PLAN.md` 2장 GC-06-007 행 (소유 경로 · 수용 기준)
- `products/CLAUDE.md` 1절
- `products/00_DECISIONS.md` GC-D-04
- `products/00_DECISIONS.md` GC-D-26
- `products/00_DECISIONS.md` GC-F-401 (5.1절)

## 할 것

- [ ] 잡 claim 루프: 코어 `claim_jobs`·`heartbeat_job`·`complete_job`·`fail_job`·`reap_stale_jobs` 사용
- [ ] 핸들러 `services/worker/src/<영역>/handler.ts`, 크론 `cron.ts` 자동 로드
- [ ] 조직별 동시성 (pro 5건 요청 시 running 최대 2, 초과분 GC008 대기)
- [ ] 워커 재시작 후 잡 재개, 3회 실패 시 `refund_credits` 1행
- [ ] `workflow_runs`(kind `system`)·`workflow_run_steps` 기록 헬퍼
- [ ] `packages/net` 안전 fetch: 허용 도메인, DNS 해석 후 사설 IP 차단(169.254.169.254, 10.0.0.0/8, IPv6 루프백), 리다이렉트 3회, 2MB, 10초
- [ ] 워커 Docker 이미지: Node 22, Sharp, Noto Sans KR, 비밀 값 0

## 안 할 것 (범위 밖)

- 소유 경로 밖 파일 (필요하면 `[REQUEST]`)
- 다음 작업의 범위: GC-06-014 환율 크론 · 위젯, GC-06-017 아마존 수집 어댑터, GC-06-020 AI 라우터(`packages/ai/`), GC-06-023 누끼 · 합성 잡, GC-06-027 쿠팡 어댑터
- 도메인 상수 변경 (GC-06-005 소유)
- 원격 배포 · Railway 배포 (사용자 확인 없이 금지)
- 현재 릴리스 밖(R2 · R3) 잡: FFmpeg 렌더(GC-06-040) 등

## 완료 조건

- [ ] `claim_jobs`·`heartbeat_job`·`complete_job`·`fail_job`·`reap_stale_jobs` 사용 — 확인: 코드 검색과 통합 테스트에서 호출 확인
- [ ] pro 조직 5건 요청 시 running 최대 2(GC-D-04), 초과분 GC008 대기 — 확인: 로컬 Supabase에서 5건 enqueue 후 running 수 ≤ 2, 나머지 대기 assert
- [ ] 워커 재시작 후 잡 재개 — 확인: running 잡 중 워커 kill → 재기동 → 잡 재개 로그 확인
- [ ] 3회 실패 시 `refund_credits` 1행 — 확인: 실패 주입 3회 후 `credit_ledger` 환불 행 1건 assert
- [ ] `workflow_runs`(kind `system`)·`workflow_run_steps` 기록 헬퍼 동작 — 확인: 헬퍼 호출 후 행 생성 assert
- [ ] `packages/net` 사설 IP 차단(169.254.169.254, 10.0.0.0/8, IPv6 루프백) — 확인: 해당 주소 요청 거부 테스트 pass
- [ ] DNS 리바인딩 테스트 차단 — 확인: 리바인딩 테스트 케이스 pass
- [ ] 리다이렉트 3회, 2MB, 10초 제한 — 확인: 각 한도 초과 케이스 테스트 pass
- [ ] 이미지에 Node 22, Sharp, Noto Sans KR — 확인: `services/worker/Dockerfile` 내용 점검 및 이미지 빌드(가능 시)
- [ ] 같은 Dockerfile이 `docker-compose.yml`의 `worker` 서비스(GC-06-001)와 Railway 배포에 쓰임, 컨테이너 안에서 `host.docker.internal:54321`로 Supabase에 붙어 잡 처리 — 확인: Docker Desktop에서 `docker compose up worker` 후 잡 처리 로그 확인
- [ ] `/check` 해당 영역 통과 (typecheck · lint · test · build)
- [ ] review-expert ACCEPT, `security-auditor`·`test-writer` 판정 기록

## 완료 보고

| 완료 조건 | 결과 | 확인 방법 | 담당 |
|---|---|---|---|
| | | | |

## 로그

- 2026-10-25 [PLAN] 005 완료 · 002의 jobs/workflow 부분 확정으로 착수. 먼저 계획서만 작성 → plan-challenger 공격 → 구현 — 팀장
- 2026-10-25 [DELEGATE] 계획 worker-expert(opus) — 팀장
