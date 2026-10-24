# `.claude/agents/` — GlobalCommerce 개발팀

> 출처: DevOps0906/tablet-kiosk-core 멀티에이전트 구성(커밋 15f8727)을 GlobalCommerce에 맞게 옮김

이 폴더의 에이전트는 **팀장(주 세션)** 이 작업을 나눠 맡기는 팀원입니다. 운영 규칙은 [`develop/MULTI_AGENT.md`](../../develop/MULTI_AGENT.md).
팀장 모델은 `.claude/settings.json`(`claude-opus-5-5`)에서 정합니다.
작업별 담당 에이전트 · 구현 모델 · 검증 에이전트의 정본은 [`products/06_AGENT_PLAN.md`](../../products/06_AGENT_PLAN.md) 2장 "담당" 열과 1.1절입니다.

## 1. 직급 (일반 실무)

| 직급 | 파일 | 모델 | 맡는 일 |
|---|---|---|---|
| 고문 | `advisor.md` | `claude-fable-5-1` | 팀장이 2회 이상 막힌 문제의 진단 · 권고, Fable 작업 착수 전 설계 검토, 게이트(G1 · R1 · G2) 판정 자료 · 열린 결정 선택지 정리 (읽기 전용) |
| 팀장 | (주 세션) | `claude-opus-5-5` | task 해석 · 분해 · 위임 · 1줄 요청 중재 · 결과 검토 · 커밋 |
| 대리 | `sub-agent-1.md` | `claude-sonnet-5-5` | `apps/web` 화면 · 컴포넌트 · 셸(nextjs-expert 스킬 사용), 분야 밖 판단 필요 실무(문서, 여러 영역에 걸친 작은 수정, 리뷰 지적 반영) |
| 사원 | `sub-agent-2.md` | `claude-haiku-5-5` | 규칙이 정해진 단순 반복 (탐색, 디자인 캔버스 값 추출, 문구 상수 `apps/web/lib/copy/`, 점검 스크립트 · 체크리스트, 시드 · task 파일 초안) |

## 2. 분야 에이전트 (구현)

| 파일 | 영역 | 짝 스킬 | 모델 |
|---|---|---|---|
| `nextjs-expert.md` | `apps/web` — 모노레포 골격, Route Handler, 인증 · `proxy.ts`, 결제, 서버 컴포넌트 (화면은 대리와 나눔) | `nextjs-expert` | `claude-sonnet-5-5` |
| `supabase-expert.md` | `supabase/`(마이그레이션 · RLS · RPC · 트리거 · seed), `tests/rls/`, `products/supabase/` 설계 SQL | `supabase-expert` | `claude-sonnet-5-5` |
| `worker-expert.md` | `services/worker`, `packages/*` (주 영역 `sourcing` · `markets` · `render` · `ai`, 06 1.1 에 따라 `domain` · `compliance` · `net` 포함) | `worker-expert` | `claude-sonnet-5-5` |

## 3. 검증 에이전트

| 파일 | 언제 | 쓰기 | 모델 |
|---|---|---|---|
| `plan-challenger.md` | 결제(Toss) · 크레딧 차감 · 권한 · RLS · DB 스키마 · 마켓 API 키 암호화 · 마켓 업로드 · AI 키 · 프롬프트 · 잡 큐 · 실행 엔진 · SNS 토큰 task, 규모 L · Fable task 의 **착수 전** 계획 공격 | 없음 | `claude-opus-5-5` |
| `review-expert.md` | 모든 구현 task 의 **변경 후** 리뷰 · 추적성 | 없음 | `claude-sonnet-5-5` |
| `contract-reviewer.md` | web ↔ DB ↔ worker, packages ↔ apps, 앱 ↔ 외부 마켓 · SNS · AI · 결제 API 경계를 넘는 변경, 모든 마이그레이션 | 없음 | `claude-sonnet-5-5` |
| `security-auditor.md` | 인증 · 결제 · 크레딧 · 권한 · RLS · 키 · 토큰 · 외부 fetch · 파일 업로드 · AI 프롬프트 · 개인정보 변경, 모든 마이그레이션, 보안 점검(GC-06-034) | 없음 | `claude-sonnet-5-5` |
| `test-writer.md` | 리뷰가 "검증 근거 없음"을 냈을 때, 수용 기준 자동 테스트 보강 · 누락 점검, E2E(GC-06-033) | 테스트 경로만 | `claude-sonnet-5-5` |

## 4. 모델 바꾸기

- 정본은 각 파일 frontmatter 의 `model:`입니다. 바꾸면 이 표와 `develop/MULTI_AGENT.md` 2장도 함께 고칩니다.
- `06_AGENT_PLAN.md` "담당" 열의 모델(Fable · Opus · Sonnet · Haiku)이 frontmatter 와 다르면, 팀장이 호출할 때 그 모델을 지정합니다.
  지정할 수 없으면 frontmatter 모델로 부르고 `develop/MULTI_AGENT.md` 3.3 대응표대로 보완합니다 (frontmatter 는 바꾸지 않음).
- 보안 감사를 더 깊게 보려면 `security-auditor.md`만 `claude-opus-5-5`로 올립니다.
- 착수 전 계획 검토를 고문급으로 하려면 `plan-challenger.md`를 `claude-fable-5-1`로 바꿉니다 (비용 큼 — 결제 · 크레딧 task 에만 권장).

## 5. 에이전트 추가

1. 성격이 가까운 파일을 복사해 `<이름>.md`로 저장하고 `name` · `description` · `tools` · `model`을 고칩니다.
2. 이 표와 `develop/MULTI_AGENT.md` 2장에 한 줄 추가하고, `06_AGENT_PLAN.md` 1.1 표에 넣도록 제안합니다.
3. 대리 · 사원 설명에서 넘겨준 업무를 뺍니다.
4. `/agent-check`로 확인합니다.

## 6. 원본과 다른 점

- `flutter-expert`(키오스크 앱 · 기기 패키지)는 옮기지 않고 **`worker-expert`**(잡 워커 · 공유 패키지 · 외부 API 어댑터 · 렌더)로 바꿨습니다.
- `nextjs-expert`의 영역은 `apps/admin` → `apps/web`, `supabase-expert`는 스키마 `kiosk` → `public` 모놀리스(코어 lite + 도메인)입니다.
- 원본은 대시보드 화면도 nextjs-expert 가 맡았지만, 여기서는 `06_AGENT_PLAN.md` 1.1 에 따라 화면 · 컴포넌트 · 셸은 대리(sub-agent-1)가 nextjs-expert 스킬로 맡습니다.
- 결제 단말 · 프린터 · 쿠폰 · 업종 모듈 · 가짜 기기 관련 규칙은 결제(Toss) · 크레딧 · 마켓 업로드 · 잡 큐 · 금지어 규칙으로 바꿨습니다.
- 전체 대응표는 `develop/MULTI_AGENT.md` 7장.
