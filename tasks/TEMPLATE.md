# GC-06-### <제목>

<!-- 착수할 때 이 파일을 tasks/task-###.md (### = 작업 번호 뒤 세 자리)로 복사해 채운다.
     헤더 값은 products/06_AGENT_PLAN.md 2장 해당 행에서 옮기고, 다르게 정하면 로그에 [DECISION]을 남긴다. -->

- **웨이브 · 릴리스 · 규모**: W? · R? · S/M/L
- **선행 작업**: GC-06-### (없으면 "없음". 게이트가 있으면 G1 · G2 · R1 출시)
- **소유 경로**: `<경로>` — 이 밖의 파일은 고치지 않고 로그에 `[REQUEST]`
- **기능 ID**: GC-F-### (`products/00_DECISIONS.md` 5.1)
- **화면 ID**: GC-S-## (화면이 없으면 "없음")
- **관련 결정**: GC-D-## · O-## (열린 결정은 기본안을 적는다)
- **담당 (06장)**: <모델> · <에이전트> — 예: `Fable · supabase-expert`, `Sonnet · sub-agent-1`
- **실제 배치 (팀장)**: 구현 <에이전트 순서 `→`> / 호출 모델 <지정 또는 frontmatter> / 하위 지시 <사원: 문구 · 체크리스트 등>
- **검증**: 착수 전 <plan-challenger · 고문 설계 검토(Fable)> · 변경 후 review-expert + <06장 검증 에이전트>
- **확인 위치**: 로컬 Supabase · 가짜 어댑터 · Mock 페르소나 · 브라우저 375/1024/1440 등
- **상태**: 대기 | 진행 | 리뷰 | 완료 | 보류 (사유)

## 목표

한두 문장. 이 task 가 끝나면 무엇이 가능해지는가.

## 참고 문서

<!-- 작업에 필요한 장 · 절만. 문서 내용을 붙이지 말고 경로(+ 등록부 ID)만. -->

- `products/06_AGENT_PLAN.md` GC-06-### 행 (소유 경로 · 수용 기준)
- `products/00_DECISIONS.md` <절>
- `products/0?_*.md` <장>
- `docs/design/dashboard/<화면>.dc.html`
- `docs/spec/<문서>.md` <절>
- `.claude/skills/<영역>/references/pitfalls.md`

## 할 것

- [ ] 
- [ ] 

## 안 할 것 (범위 밖)

- 소유 경로 밖 파일 (필요하면 `[REQUEST]`)
- 다음 작업의 범위: GC-06-### …
- 현재 릴리스 밖 기능

## 완료 조건

<!-- 06장 수용 기준을 그대로 옮기고 확인 명령을 붙인다. -->

- [ ] (수용 기준 1) … — 확인: `<명령 또는 시나리오>`
- [ ] (수용 기준 2) … — 확인: …
- [ ] `/check` 해당 영역 통과 (typecheck · lint · test · build)
- [ ] review-expert 판정 ACCEPT, 06장 검증 에이전트 판정 기록

## 완료 보고

| 완료 조건 | 결과 | 확인 방법 | 담당 |
|---|---|---|---|
| | | | |

## 로그

<!-- 시간순 한 줄씩, 지우지 않는다. 태그: [PLAN] [DECISION] [DELEGATE] [REQUEST] [REVIEW] [BLOCKED] [FOUND] [DONE] — tasks/README.md 3장 -->
<!-- [DECISION] 은 근거와 결정자를 반드시 적는다. -->

- YYYY-MM-DD [PLAN] 
- YYYY-MM-DD [DECISION]  — 근거: … · 결정: 팀장 / 대표님
