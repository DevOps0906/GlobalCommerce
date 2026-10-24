---
description: 팀 에이전트 목록 · 모델 · 짝 스킬 정합성 점검 (읽기 전용)
allowed-tools: Read, Glob, Grep, Bash(ls:*), Bash(cat:*), Bash(grep:*), Bash(sed:*)
---

# Agent Check

이 저장소에서 실제로 부를 수 있는 에이전트를 **파일에서 읽어** 보고한다. 파일을 고치지 않는다. 입력: `$ARGUMENTS`

1. `.claude/settings.json`의 `model`(팀장)을 읽는다.
2. `.claude/agents/*.md`(README 제외)의 frontmatter 에서 `name` · `model` · `tools` · `disallowedTools`를 읽는다.
3. 각 분야 에이전트(nextjs-expert · supabase-expert · worker-expert)의 짝 스킬(`.claude/skills/<name>/SKILL.md`)과 그 `references/*.md`가 있는지 확인한다.
4. 아래를 점검해 어긋난 것을 보고한다.
   - 파일명과 `name`이 같은가
   - `.claude/agents/README.md` 표 · `develop/MULTI_AGENT.md` 2장 표의 이름 · 모델이 frontmatter 와 같은가
   - `products/06_AGENT_PLAN.md` 1.1절 · 2절 "담당" 열에 나오는 에이전트 이름이 모두 `.claude/agents/`에 있는가
   - 읽기 전용이어야 하는 에이전트(advisor · plan-challenger · review-expert · contract-reviewer · security-auditor)에 `Write` · `Edit`가 없는가
   - 에이전트 · 스킬 · 명령이 가리키는 문서 경로(`products/*`, `develop/*`, `docs/design/*`, `docs/spec/*`, `tasks/*`, `.claude/commands/check.md`)가 실제로 있는가
     — 아직 없는 코드 경로(`apps/web`, `services/worker`, `packages/*`, `supabase/`)는 "코드 착수 전"으로 따로 표시하고 오류로 세지 않는다
   - 남아 있으면 안 되는 원본(키오스크) 흔적: `flutter-expert`, `apps/kiosk`, `apps/admin`, `kiosk_devices`, `docs/11-multi-agent.md`
5. 결과를 표로 보고한다.

```
| 직급/분류 | 에이전트 | 모델 | 쓰기 | 짝 스킬 | 상태 |
```

어긋난 항목은 "정본(frontmatter) 값 / 문서 값 / 고칠 파일" 형식으로 아래에 나열한다.
