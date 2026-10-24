# GlobalCommerce 작업 규칙

이 저장소는 NOMAD AI Factory V.2의 기획·설계 문서 저장소다. 코드 저장소용 개발 규칙은 `docs/spec/CLAUDE.md`에 있다.

## 멀티에이전트 구성

- 주 에이전트: Opus 5.5 (`.claude/settings.json`의 `model`)
- 부 에이전트: Sonnet 5.5 (`.claude/agents/*.md`의 `model`, 기본값은 `CLAUDE_CODE_SUBAGENT_MODEL`)

| 에이전트 | 역할 | 파일 수정 |
|---|---|---|
| 주 (Opus 5.5) | 요구사항 해석, 우선순위·범위 결정, 부 에이전트 분배, 결과 통합, 최종 커밋 | 가능 |
| `spec-researcher` | 외부 API·모델·정책 최신 사실 확인 | 불가 |
| `prd-writer` | 결정된 내용을 PRD 문서에 반영 | 가능 (`docs/prd`) |
| `spec-reviewer` | 문서 간 불일치 교차 검토 | 불가 |
| `design-reviewer` | 디자인 HTML의 디자인 시스템·접근성 검토 | 불가 |

## 주 에이전트 운영 원칙

1. 판단과 결정은 주 에이전트가 한다. 부 에이전트에는 범위가 좁고 결과 형식이 정해진 일만 맡긴다.
2. 서로 독립적인 조사·검토는 부 에이전트를 동시에 실행한다.
3. 부 에이전트의 보고는 그대로 믿지 않고, 핵심 근거(파일:줄, 출처 URL)를 확인한 뒤 반영한다.
4. 문서 수정 순서: `spec-researcher`로 사실 확인 → 주 에이전트 결정 → `prd-writer` 반영 → `spec-reviewer`로 정합성 재검토.
