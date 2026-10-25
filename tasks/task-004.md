# GC-06-004 디자인 토큰 · 공용 셸

- **웨이브 · 릴리스 · 규모**: W0 · R1 · M
- **선행 작업**: GC-06-001
- **소유 경로**: `apps/web/styles/tokens.css`, `apps/web/app/{layout.tsx,globals.css}`, `apps/web/app/(app)/layout.tsx`, `apps/web/components/{ui,shell}/`, `apps/web/app/dev/components/`, `apps/web/lib/copy/errors.ts` — 이 밖의 파일은 고치지 않고 로그에 `[REQUEST]`
- **기능 ID**: 없음 (기반 작업)
- **화면 ID**: 없음 (화면 작업의 공용 셸)
- **관련 결정**: GC-D-20 (반응형 3구간 · 글자 크기 · 셸) · O-08 (라이트 기본, 다크 토큰 정의만)
- **담당 (06장)**: Sonnet · `sub-agent-1` / 검증 없음(06장 `-`) → review-expert
- **실제 배치 (팀장)**: 구현 `sub-agent-1` / 호출 모델 sonnet / 하위 지시 문구 · 체크리스트는 팀장이 별도 전달
- **검증**: 착수 전 없음 · 변경 후 review-expert
- **확인 위치**: Docker Desktop(GC-D-26)에서 최종 기동 확인; 클라우드 작업 환경은 이미지 저장소 차단으로 PGlite·문법 검사까지. 브라우저 375 / 768 / 1200 폭 셸 확인
- **상태**: 대기

## 목표

토큰과 공용 셸 3구간(모바일 하단 탭 · 태블릿 아이콘 레일 · 데스크탑 사이드바)을 만들어, 이후 화면 작업이 같은 토큰과 셸 위에서 시작하게 한다.

## 참고 문서

- `products/06_AGENT_PLAN.md` 2장 GC-06-004 행 (소유 경로 · 수용 기준)
- `products/CLAUDE.md` 1절, 6절 (반응형 규칙)
- `products/00_DECISIONS.md` GC-D-20
- `products/00_DECISIONS.md` O-08
- `docs/design/dashboard/README.md` 디자인 토큰 표 (값 원본, 내용은 붙이지 않음)

## 할 것

- [ ] `apps/web/styles/tokens.css`: 토큰 값을 `docs/design/dashboard/README.md` 토큰 표와 일치
- [ ] 라이트 기본, 다크 토큰 정의만 (O-08)
- [ ] 공용 셸: 모바일 하단 탭 5개, 태블릿 아이콘 레일 64px + 햄버거, 데스크탑 사이드바 240px
- [ ] 메뉴는 `packages/domain/nav.ts`만 읽고 R2·R3 메뉴는 렌더하지 않음
- [ ] `apps/web/app/dev/components/`는 프로덕션 빌드 제외
- [ ] `apps/web/lib/copy/errors.ts`에 오류 코드 → 사용자 문구 (이 파일이 유일한 위치)

## 안 할 것 (범위 밖)

- 소유 경로 밖 파일 (필요하면 `[REQUEST]`)
- 다음 작업의 범위: GC-06-005 도메인 패키지(`packages/domain/nav.ts` 작성), GC-06-006 인증(`apps/web/lib/auth/`, `apps/web/app/(auth)/`), 화면 작업(GC-06-012 · 016 · 019 등)
- 현재 릴리스 밖(R2 · R3) 메뉴 렌더

## 완료 조건

- [ ] 토큰 값이 `docs/design/dashboard/README.md` 표와 스크립트 비교로 일치 — 확인: 토큰 값 비교 스크립트 결과 불일치 0건
- [ ] 컴포넌트에 hex 0 (`bg-[#` 린트 차단) — 확인: `grep -rn "bg-\[#" apps/web/components` 0건, `pnpm lint`에서 샘플 위반 실패
- [ ] 라이트 기본·다크 토큰 정의만 (O-08) — 확인: `tokens.css`에 다크 정의 존재, 기본 테마가 라이트
- [ ] 셸 3구간이 GC-D-20 그대로 — 확인: 375px 하단 탭 5개, 768~1199px 레일 64px + 햄버거, 1200px 이상 사이드바 240px (브라우저 확인)
- [ ] 메뉴는 `packages/domain/nav.ts`만 읽고 R2·R3 메뉴 미렌더 — 확인: `grep -rn "nav" apps/web/components/shell` 및 렌더 결과에 R2·R3 메뉴 0개
- [ ] `/dev/components`는 프로덕션 빌드 제외 — 확인: `pnpm build` 후 `/dev/components` 404
- [ ] `/check` 해당 영역 통과 (typecheck · lint · build)
- [ ] review-expert 판정 ACCEPT

## 완료 보고

| 완료 조건 | 결과 | 확인 방법 | 담당 |
|---|---|---|---|
| | | | |

## 로그

