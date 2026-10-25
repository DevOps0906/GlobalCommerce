# 작업 목록

> Claude Code CLI 작업 진행 현황입니다. `/next-task`가 이 표와 `products/06_AGENT_PLAN.md`를 보고 다음 작업을 고릅니다.
> 작업 목록 · 소유 경로 · 의존 · 담당 · 수용 기준의 **정본은 `products/06_AGENT_PLAN.md` 2장**(웨이브 순서는 3절)이고, 이 파일은 상태와 기록 형식을 정합니다.
> 이 표의 제목은 줄임말이고 선행 · 담당은 06장에서 옮긴 값입니다. 06장이 바뀌면 이 표를 따라 고칩니다.

## 1. 상태와 수명주기

```
대기 → 진행 → 리뷰 → 완료
          ↘ 보류 (사유: O-## · 게이트 G1/R1/G2 · 선행 · 외부 승인 등)
```

| 상태 | 뜻 | 바꾸는 시점 |
|---|---|---|
| `대기` | 아직 시작 안 함. task 파일이 없을 수 있음 | 기본값 |
| `진행` | task 파일이 있고 계획이 승인됨 | `/next-task` 5단계 (사용자 승인 후) |
| `리뷰` | 구현이 끝나 검증 에이전트가 보는 중 | 변경 후 review-expert 호출 시 |
| `완료` | 완료 조건(06장 수용 기준)을 모두 확인하고 커밋함 | 완료 보고를 채운 뒤 |
| `보류 (사유)` | 열린 결정 · 게이트 · 외부 승인 대기 | 막힌 즉시, 로그에 `[BLOCKED]` |

- 웨이브 안의 병렬 · 순서는 06장 3절을 따릅니다. 여러 task 를 동시에 `진행`으로 둘 때는 소유 경로가 겹치지 않아야 하고, 로그에 적습니다.
- 화면 작업(012 · 016 · 019 · 022 · 024 · 026 · 030 · 032 · 037 · 041 · 047)은 GC-06-004 완료 뒤 시작합니다 (06장 1절).
- 현재 릴리스 밖(R2 · R3) task 는 사용자가 지정하기 전에는 시작하지 않습니다 (GC-D-02). 036 · 044 는 대표님이 G1 · G2 를 판정해 `[DECISION] G1 통과` · `[DECISION] G2 통과`를 남긴 뒤에만 시작합니다.

## 2. task 파일

- 위치 · 이름: `tasks/task-###.md` — 번호는 작업 ID `GC-06-###`의 뒤 세 자리입니다 (예: GC-06-007 → `tasks/task-007.md`). 파일 안 제목과 커밋에는 `GC-06-###`을 씁니다.
- **착수할 때** `tasks/TEMPLATE.md`를 복사해 만듭니다. 다음 웨이브 것까지만 미리 초안을 둘 수 있습니다 (`develop/globalcommerce_develop.md` 6.4, 사원 초안 → 팀장 확인).
- 헤더(웨이브 · 릴리스 · 규모 · 소유 경로 · 선행 · 기능 ID · 담당 · 검증)는 06장 2절 해당 행에서 옮깁니다. 다르게 정하면 로그에 `[DECISION]`으로 남깁니다.
- **완료 조건**은 06장 수용 기준을 그대로 옮기고 확인 명령을 붙입니다. **안 할 것**에는 다음 작업의 범위와 소유 경로 밖을 적습니다.
- 할 것 / 안 할 것 / 완료 조건은 계획 승인 때 확정합니다. 승인 뒤 바꾸려면 로그에 `[DECISION]`을 남깁니다.

## 3. 로그

`products/06_AGENT_PLAN.md` · `products/CLAUDE.md`가 말하는 "task `log.md`"는 task 파일 맨 아래 **"로그" 절**입니다 (별도 폴더 · 파일을 만들지 않음).
시간순으로 한 줄씩 쌓고, 지우거나 고치지 않습니다. 바뀌면 새 줄을 씁니다.

```
- 2026-10-25 [DECISION] 크레딧 환불은 원 차감 원장 id 고유 제약으로 1회 보장 — 근거: plan-challenger Concern 2, GC-F-004 · 결정: 팀장(사용자 승인)
- 2026-10-26 [REQUEST] GC-06-001 .github/workflows/: scripts/security/ 검사 단계 추가
```

| 태그 | 언제 | 누가 남기나 |
|---|---|---|
| `[PLAN]` | 계획 확정 · 사용자 승인 | 팀장 |
| `[DECISION]` | 설계 · 범위 · 라이브러리 · 열린 결정 기본안 선택, 문서와 다르게 가는 결정, 고문 권고 채택, 게이트 판정(`G1 통과` 등) | 팀장 (근거와 결정자 필수. 게이트 · O-## 결정자는 대표님) |
| `[DELEGATE]` | 위임 (누구에게 · 어떤 모델로 · 무엇을) | 팀장 |
| `[REQUEST]` | 소유 경로 밖 변경 요청 — `[REQUEST] GC-06-### 파일: 내용`, 코어 부족은 `[REQUEST] core` (06장 1절 · 2.1절) | 팀장 (팀원 보고에서 옮김). 소유 작업이 반영하면 그 task 로그에 `[DONE] REQUEST <요청 작업>` |
| `[REVIEW]` | 검증 에이전트 판정 (PROCEED/REVISE/BLOCKED, ACCEPT/REQUEST_CHANGES/UNKNOWN, COMPATIBLE/BREAKING, PASS/ISSUES_FOUND) | 팀장 (요약 1줄) |
| `[BLOCKED]` | 막힘 · 보류 사유 | 팀장 |
| `[FOUND]` | 범위 밖 문제 발견 (5장 표에도 적음) | 팀장 |
| `[DONE]` | 수용 기준별 결과 · 커밋 SHA | 팀장 |

팀원은 로그에 직접 쓰지 않습니다. 팀원 보고에서 필요한 것을 팀장이 옮깁니다.

## 4. 진행 현황

| 작업 | 웨이브 | 릴리스 | 제목 | 선행 (06장) | 담당 (06장) | 상태 |
|---|---|---|---|---|---|---|
| GC-06-001 | W0 | R1 | 모노레포 · CI | — | Sonnet · nextjs-expert | 대기 |
| GC-06-002 | W0 | R1 | DB 마이그레이션 (코어 lite + 도메인 R1) | — | Fable · supabase-expert | 대기 |
| GC-06-003 | W0 | R1 | RLS · 권한 회귀 테스트 | 002 | Fable · supabase-expert | 대기 |
| GC-06-004 | W0 | R1 | 디자인 토큰 · 공용 셸 | 001 | Sonnet · sub-agent-1 | 대기 |
| GC-06-005 | W0 | R1 | 도메인 패키지 (상수 · zod · 플랜 features · 단가 · 마진) | — | Opus · worker-expert | 대기 |
| GC-06-006 | W0 | R1 | 인증 Stage A · `proxy.ts` · 세션 | 001, 002 | Fable · nextjs-expert | 대기 |
| GC-06-007 | W0 | R1 | 워커 런타임 (잡 루프 · 크론 · 안전 fetch) | 002, 005 | Opus · worker-expert | 대기 |
| GC-06-008 | W1 | R1 | 플랜 · 크레딧 API | 005, 006 | Fable · nextjs-expert | 대기 |
| GC-06-009 | W1 | R1 | Toss 구독 · 크레딧팩 | 008 | Fable · nextjs-expert | 대기 |
| GC-06-010 | W1 | R1 | 추가 슬롯 | 008, 009 | Fable · nextjs-expert | 대기 |
| GC-06-011 | W1 | R1 | 마켓 계정 (암호화 · 검증) | 006, 008 | Fable · nextjs-expert | 대기 |
| GC-06-012 | W1 | R1 | 설정: 배송 템플릿 · 음원 · 알림 | 004, 006 | Sonnet · sub-agent-1 | 대기 |
| GC-06-013 | W1 | R1 | 슈퍼 어드민 | 006, 008 | Fable · nextjs-expert | 대기 |
| GC-06-014 | W2 | R1 | 환율 크론 · 위젯 | 005, 007 | Opus · worker-expert | 대기 |
| GC-06-015 | W2 | R1 | 데이터랩 트렌드 | 005, 007 | Opus · worker-expert | 대기 |
| GC-06-016 | W2 | R1 | 대시보드 화면 | 004, 008 | Sonnet · sub-agent-1 | 대기 |
| GC-06-017 | W2 | R1 | 아마존 수집 어댑터 (O-02) | 005, 007, 008 | Opus · worker-expert | 대기 |
| GC-06-018 | W2 | R1 | 엑셀 파서 | 005, 007, 008 | Opus · worker-expert | 대기 |
| GC-06-019 | W2 | R1 | 소싱 화면 · 상품 목록 API | 004, 017, 018 | Sonnet · sub-agent-1 | 대기 |
| GC-06-020 | W3 | R1 | AI 라우터 `packages/ai` | 005, 007 | Opus · worker-expert | 대기 |
| GC-06-021 | W3 | R1 | 금지어 매처 | 005 | Opus · worker-expert | 대기 |
| GC-06-022 | W3 | R1 | 상품명 생성 잡 · 상품 관리 화면 | 008, 019, 020, 021 | Opus · nextjs-expert | 대기 |
| GC-06-023 | W3 | R1 | 누끼 · 합성 잡 | 007, 008, 020 | Opus · worker-expert | 대기 |
| GC-06-024 | W3 | R1 | 상품 이미지 화면 | 004, 023 | Sonnet · sub-agent-1 | 대기 |
| GC-06-025 | W3 | R1 | 상세페이지 조립 · 마켓 이미지 변환 | 007, 008, 012, 020, 021 | Opus · worker-expert | 대기 |
| GC-06-026 | W3 | R1 | 상세페이지 에디터 화면 | 004, 025 | Sonnet · sub-agent-1 | 대기 |
| GC-06-027 | W4 | R1 | 쿠팡 어댑터 | 005, 007 | Opus · worker-expert | 대기 |
| GC-06-028 | W4 | R1 | 스마트스토어 어댑터 | 005, 007 | Opus · worker-expert | 대기 |
| GC-06-029 | W4 | R1 | 업로드 배치 · 진행률 API | 011, 025, 027, 028 | Opus · nextjs-expert | 대기 |
| GC-06-030 | W4 | R1 | 업로드 화면 | 004, 029 | Sonnet · sub-agent-1 | 대기 |
| GC-06-031 | W4 | R1 | 엑셀 · ZIP 내보내기 | 007, 025 | Opus · worker-expert | 대기 |
| GC-06-032 | W4 | R1 | 실행 기록 화면 | 004, 007 | Sonnet · sub-agent-1 | 대기 |
| GC-06-033 | W5 | R1 | E2E 핵심 흐름 | W0~W4 전부 | Opus · test-writer | 대기 |
| GC-06-034 | W5 | R1 | 보안 점검 (v1 결함 · 키 노출) | W0~W4 전부 | Fable · security-auditor | 대기 |
| GC-06-035 | W5 | R1 | 반응형 3구간 점검 | W0~W4 화면 | Haiku · sub-agent-2 | 대기 |
| GC-06-036 | W5(G1 후) | R1 | 인증 Stage B (G1 후) | G1, 006, 009, 048 | Fable · nextjs-expert | 대기 |
| GC-06-048 | W5 | R1 | 랜딩 · 약관 페이지 | 004, 005 | Sonnet · nextjs-expert | 대기 |
| GC-06-037 | W6 | R2 | 노드 캔버스 | R1 출시, 004 | Sonnet · nextjs-expert | 대기 |
| GC-06-038 | W6 | R2 | 실행 엔진 | 037, 007 | Opus · worker-expert | 대기 |
| GC-06-039 | W6 | R2 | 블로그 원고 · 발행 | R1 출시, 025 | Opus · nextjs-expert | 대기 |
| GC-06-040 | W6 | R2 | 숏폼 렌더 워커 | R1 출시, 012, 023 | Opus · worker-expert | 대기 |
| GC-06-041 | W6 | R2 | 숏폼 화면 | 040 | Sonnet · sub-agent-1 | 대기 |
| GC-06-042 | W6 | R2 | SNS 연동 · 업로드 | 040 | Opus · worker-expert | 대기 |
| GC-06-043 | W6 | R2 | 링크 자동 삽입 | 029, 042 | Opus · worker-expert | 대기 |
| GC-06-044 | W6(G2 후) | R2 | 인증 Stage C (G2 후) | G2, 036 | Fable · nextjs-expert | 대기 |
| GC-06-049 | W6 | R2 | 18슬롯 상세페이지 | R1 출시, 025, 026 | Opus · worker-expert | 대기 |
| GC-06-045 | W7 | R3 | 임베딩 · 하이브리드 검색 | R2 출시 | Opus · supabase-expert | 대기 |
| GC-06-046 | W7 | R3 | JSON-LD | 045, 039 | Haiku · sub-agent-2 | 대기 |
| GC-06-047 | W7 | R3 | 검색 화면 | 045, 046 | Sonnet · sub-agent-1 | 대기 |

task 파일을 만들면 작업 ID 를 링크로 바꿉니다 (예: `[GC-06-001](task-001.md)`).

## 5. 발견한 문제

작업 중 범위 밖 문제를 발견하면 여기에 적고 넘어갑니다.

| 날짜 | 발견한 작업 | 내용 | 제안 |
|---|---|---|---|
| | | | |
