# CLAUDE.md — GlobalCommerce

이 파일은 Claude Code CLI가 이 저장소에서 작업할 때 항상 먼저 읽는 **팀장 운영 규칙**입니다.
제품 규칙(무엇을 지켜야 하나)은 [`products/CLAUDE.md`](products/CLAUDE.md)에 있고, 이 파일은 일하는 방법만 정합니다.

## 1. 이 저장소는 무엇인가

아마존 · 국내 위탁 상품을 수집해 AI로 가공하고 쿠팡 · 스마트스토어에 올린 뒤 콘텐츠로 홍보하는 구매대행 셀러용 SaaS(GlobalCommerce, 화면 표기 NOMAD AI Factory)의
기획 · 설계 문서와 코드가 함께 들어가는 저장소입니다. 코드는 루트 pnpm 모노레포(`apps/web`, `services/worker`, `packages/*`, `supabase/`)로 쌓습니다 (`products/00_DECISIONS.md` 2절).

## 2. 먼저 읽을 문서

| 문서 | 내용 |
|---|---|
| [`products/CLAUDE.md`](products/CLAUDE.md) | 제품 절대 규칙 — 서버 판정, 키 · 자격증명, 금지어, 금액, DB 변경 규칙 |
| [`products/00_DECISIONS.md`](products/00_DECISIONS.md) | 확정 결정(GC-D) · 열린 결정(O) · ID 체계 · 기능 · 화면 · 테이블 · 잡 · 오류 코드 정본. 문서끼리 다르면 이 문서가 이긴다 |
| [`products/06_AGENT_PLAN.md`](products/06_AGENT_PLAN.md) | 작업(GC-06-###) 목록 · 웨이브 · 선행 · 배치 정본 |
| [`develop/globalcommerce_develop.md`](develop/globalcommerce_develop.md) | 개발 가이드 — 폴더 구조, 실행 방법, 환경 변수 |
| [`develop/MULTI_AGENT.md`](develop/MULTI_AGENT.md) | 멀티에이전트 팀 구성 · 위임 · 검증 규칙 |
| [`tasks/README.md`](tasks/README.md) | 진행 현황 · task 파일 형식 · 발견한 문제 |
| `products/README.md` | 나머지 기획서(PRD · 화면 · API · 데이터 모델) 목록 |
| `docs/design/dashboard/README.md` | 디자인 캔버스 화면 목록 · 디자인 토큰 표 |

문서는 **작업에 필요한 장만** 읽습니다.

## 3. 작업 방식

1. `tasks/README.md` 진행 현황과 `products/06_AGENT_PLAN.md` 선행 관계를 보고 다음 작업을 고릅니다. (`/next-task` 명령으로도 가능)
2. `tasks/task-###.md`(### = GC-06 번호 뒤 세 자리)가 없으면 `tasks/TEMPLATE.md`로 만들고, 06장 해당 행(소유 경로 · 의존 · 담당 · 수용 기준)을 옮긴 뒤
   **참고 문서**에서 작업에 필요한 장을 읽고 시작합니다. 작업은 팀(멀티에이전트)으로 나눠 진행합니다 (6장).
3. 작업 범위의 **안 할 것**과 **소유 경로 밖**은 건드리지 않습니다. 소유 경로 밖 변경이 필요하면 task 로그에 1줄 요청 `[REQUEST] GC-06-### 파일: 내용`을 남깁니다 (06장 1절 · 2.1절).
   범위 밖 문제를 발견하면 `tasks/README.md`의 "발견한 문제" 표에 적고 넘어갑니다.
4. **완료 조건**(06장 수용 기준)을 모두 확인한 뒤 task 파일의 완료 보고를 채우고 `tasks/README.md`의 상태를 `완료`로 바꾸고 커밋합니다.
5. 설계와 다르게 구현해야 하면, 코드보다 먼저 관련 문서(`products/` · `develop/`)를 고치고 이유를 task 로그 `[DECISION]`과 커밋 메시지에 남깁니다.
   확정 결정(GC-D)을 바꾸는 일은 사용자 승인을 받고 `00_DECISIONS.md` 변경 이력에 적습니다.
6. 열린 결정(O-##)에 걸리면 기본안으로 진행하되 task 로그에 적고 사용자에게 알립니다. 외부 사실을 확인하지 못했으면 "미확인", 근거 없는 수치는 "제안"으로 씁니다.
   게이트(G1 · R1 출시 · G2)는 대표님이 판정하고 `[DECISION]`으로 남긴 뒤에만 다음 작업을 엽니다. 팀장 · 에이전트가 스스로 넘기지 않습니다.
7. 문서 · 커밋 메시지 · 화면 문구는 한국어, 코드 식별자는 영어로 씁니다.
8. 원격 DB 적용 · 삭제, 외부 API 실 계정 호출, 배포는 사용자 확인 없이 하지 않습니다.

## 4. 커밋 규칙

```
[GC-06-007] 워커 런타임: 잡 루프 · 디스패처 · 크론

- 무엇을 했는지
- 확인한 방법 (/check 결과, 로컬 Supabase, 가짜 어댑터)
```

여러 task 를 한 커밋에 섞지 않습니다. 문서만 바꾼 커밋은 `[docs]`로 시작합니다.

## 5. 자주 쓰는 명령 (`.claude/commands/`)

- `/next-task` — 다음 대기 작업을 찾아 계획을 세우고 팀으로 진행
- `/check` — 타입체크 · 린트 · 테스트 · 빌드 · SQL · 금지 패턴 점검 후 결과 요약
- `/sync-design` — 디자인 캔버스 · 토큰 표와 `apps/web` 구현 차이 점검
- `/agent-check` — 팀 에이전트 목록 · 모델 · 정합성 점검

## 6. 멀티에이전트 작업 방식

이 세션은 **팀장**입니다 (`.claude/settings.json` → `claude-opus-5-5`). 직접 다 하지 말고 나눠 맡기고 검토합니다. 상세는 `develop/MULTI_AGENT.md`.

작업별 담당 에이전트 · 구현 모델 · 검증 에이전트는 `products/06_AGENT_PLAN.md` 2절 "담당" 열이 정본입니다 (읽는 법은 `develop/MULTI_AGENT.md` 3.3).

| 맡길 일 | 에이전트 |
|---|---|
| `apps/web` 서버 · 인증 · 결제 · Route Handler / DB · SQL · RLS · RPC · `tests/rls/` / 잡 워커 · `packages/*` · 외부 API 어댑터 · 렌더 | `nextjs-expert` / `supabase-expert` / `worker-expert` |
| `apps/web` 화면 · 컴포넌트 · 셸, 분야 밖 판단 필요 실무 · 문서 / 규칙이 정해진 단순 반복 · 문구 상수 · 체크리스트 | 대리 `sub-agent-1` / 사원 `sub-agent-2` |
| 착수 전 계획 공격 (결제 · 크레딧 · 권한 · RLS · DB · 마켓 키 · 업로드 · AI 키 · 프롬프트 · SNS 토큰 · 잡 큐, 규모 L · Fable 작업) | `plan-challenger` |
| 변경 후 리뷰 (항상) + 경계 · 계약 변경 / 보안 변경 (마이그레이션은 둘 다) | `review-expert` + `contract-reviewer` / `security-auditor` |
| 수용 기준 자동 테스트 · 검증 근거 없음 | `test-writer` |
| 같은 문제로 2회 이상 막힘, Fable 작업 착수 전 설계 검토, 게이트 자료 · 열린 결정 정리 | 고문 `advisor` |

- 팀원끼리 서로 부르지 않습니다. 팀장이 중개합니다.
- 지시에는 문서 내용을 붙이지 말고 **경로와 장 · 절 번호**만 줍니다.
- 커밋은 팀장만 합니다. 팀원은 commit · push 하지 않습니다.
- 결정 · 계획 승인 · 위임 · 1줄 요청 · 리뷰 판정은 task 로그에 남깁니다 (`tasks/README.md` 3장 — 06장 · `products/CLAUDE.md`의 "task `log.md`"가 이 로그 절입니다).

### 운영 원칙 (팀장)

> 출처: [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) (MIT License) — 한국어로 옮기고 이 프로젝트에 맞게 고침.
> tablet-kiosk-core 루트 `CLAUDE.md` 8장을 거쳐 옮겼습니다.

1. **코딩 전에 생각한다** — 가정을 드러내고, 해석이 여럿이면 고르지 말고 제시합니다. 더 단순한 방법이 있으면 말합니다. 모호하면 멈추고 묻습니다.
2. **단순함 우선** — 요청한 것만 만듭니다. 한 번 쓰는 코드에 추상화, 요청하지 않은 설정 · 유연성, 일어날 수 없는 경우의 오류 처리를 넣지 않습니다. 현재 릴리스(R1 · R2 · R3) 밖 기능을 미리 만들지 않습니다.
3. **외과수술식 변경** — 필요한 곳만 고칩니다. 옆 코드를 "개선"하지 않고 기존 스타일을 따릅니다. 내 변경이 만든 미사용 코드만 지웁니다. 바뀐 모든 줄은 요청으로 거슬러 올라가야 합니다.
4. **목표 중심 실행** — 완료 조건을 확인 가능한 형태로 바꾸고(예: "검증 추가" → "잘못된 입력 테스트를 쓰고 통과시킨다"), 확인될 때까지 반복합니다. 여러 단계면 `단계 → 확인 방법`으로 계획을 적습니다.

팀원(서브에이전트)은 사용자에게 질문할 수 없으므로, 1번은 "가정을 보고에 적고 불확실한 점은 '팀장 확인 필요'로 올린다"로 적용합니다.
