---
name: nextjs-expert
description: >-
  `apps/web` (셀러 대시보드 · 랜딩 · 슈퍼 어드민 — Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui) 작업 규약.
  페이지 · 레이아웃 · 서버/클라이언트 컴포넌트 · 서버 액션 · Route Handler · `proxy.ts` · Supabase SSR 세션(@supabase/ssr) ·
  잡 등록 · Realtime 진행률 · Toss 결제 화면 · 노드 캔버스(@xyflow/react) · 디자인 토큰(`apps/web/styles/tokens.css`) · 반응형 3구간을
  만들거나 고칠 때 반드시 먼저 읽을 것. "대시보드", "화면", "셸", "사이드바", "업로드 화면", "플랜 · 결제 화면", "설정 화면" 요청도 여기서 시작한다.
  nextjs-expert 와, 화면 · 컴포넌트 · 셸을 맡은 대리(sub-agent-1)가 함께 쓴다.
  DB 스키마 · RLS · RPC 는 supabase-expert, 잡 처리 · `packages/*` · 외부 API 어댑터 · 렌더는 worker-expert 다. Pages Router 로 만들지 않는다.
---

# nextjs-expert — `apps/web` 작업 규약

> **버전 주의**: Next.js · React · @supabase/ssr · Tailwind · @xyflow/react 는 메이저 변경이 잦다. 새 코드를 쓰기 전 `apps/web/package.json`의 실제 버전과
> 공식 문서를 확인한다. 확인하지 못한 항목은 "미확인"으로 보고한다.

## 0. 30초 요약

1. 서버 컴포넌트가 기본이다. 상호작용 · 브라우저 API · 상태가 필요한 말단만 `"use client"`.
2. 비밀은 서버에만. `NEXT_PUBLIC_*`는 브라우저에 노출된다. 키 · 토큰을 localStorage 에 두지 않는다. 서버 전용 패키지를 클라이언트에서 import 하지 않는다.
3. 판정(역할 · 플랜 · 크레딧 · 한도)은 서버, 데이터 접근의 최종 방어선은 RLS(supabase-expert)다. 클라이언트 검사는 UX 일 뿐이다 (GC-D-21).
4. 오래 걸리는 일은 잡으로 등록하고 진행은 실행 기록 · Realtime 으로 보여 준다 (GC-D-18).
5. 토큰은 `tokens.css` 하나(GC-D-19), 반응형 3구간 · 글자 크기는 GC-D-20 이 정본이다. 근거(task ID · GC-F · GC-S)를 보고에 인용한다.

## 1. 요청 판별

| 요청 | 시작 위치 |
|---|---|
| 새 화면 | `references/conventions.md` §라우트 → `00_DECISIONS.md` 5.2 → `docs/design/dashboard/<화면>.dc.html` → `products/03_SCREENS_UX.md` |
| 공용 셸 · 토큰 | `references/conventions.md` §토큰 · 반응형 → `/sync-design tokens` · `/sync-design shell` |
| 인증 · 보호 라우트 | `references/conventions.md` §인증 세션 → supabase-expert 정책 확인 |
| 생성 · 업로드 · 내보내기 버튼 | `references/conventions.md` §서버 호출 · 잡 → `products/04_API.md` |
| 결제 · 플랜 · 추가 슬롯 | `references/conventions.md` §결제 → plan-challenger 대상인지 팀장 확인 |
| 데이터 로딩 · 캐싱 이상 | `references/pitfalls.md` |
| 실행 · 검증 | `references/build-and-run.md` |

## 2. 핵심 규칙

- 라우트 파일 규약(`page` · `layout` · `loading` · `error` · `route`)을 따른다.
- 폼은 서버 측 검증(zod, `packages/domain` 스키마)이 정본, 클라이언트 검증은 보조. 에러 · 로딩 · 빈 상태를 항상 처리한다.
- 모든 `/api/*`(웹훅 · `/api/dev/login` 제외)는 첫 줄에서 `requireSession('globalcommerce', { roles })`. 입력은 zod 로 검증하고 바디 · 쿠키 · 쿼리의 plan · role · model · provider 는 읽지 않는다.
- 유료 작업은 `withCredits`(코어 `consume_credits`) → `enqueue_job(..., credit_ledger_id)` → 실패 시 `refund_credits`. 별도 차감 API 금지.
- 오류는 `GC0##` · `CR001` 코드로 받아 `apps/web/lib/copy/errors.ts` 한 곳에서 문구로 바꾼다. 화면 문구는 `lib/copy/<화면>.ts`.
- 스타일 값은 CSS 변수 토큰으로만 (hex · 임의 값 직접 사용 금지). Tailwind v4 문법, `tailwind.config.js` 금지.
- 금액 · 크레딧은 서버가 준 정수를 표시만 포맷한다. 핵심 숫자는 Bebas Neue, JetBrains Mono 는 로그 · 코드에만.

## 3. 제출 전 자가 점검

- [ ] lint · typecheck · test · build 결과를 보고했는가 (미실행이면 "미검증")
- [ ] 비밀 값이 클라이언트 번들 · localStorage · 로그에 없는가
- [ ] 375 · 1024 · 1440 너비에서 확인했는가 (모바일 하단 탭 · 태블릿 레일 · 데스크탑 사이드바)
- [ ] 에러 · 로딩 · 빈 상태, 실패 사유 한 줄이 처리됐는가
- [ ] 릴리스 밖 메뉴 · 기능을 렌더하지 않았는가
- [ ] 근거를 인용했는가

## 4. 참조 파일 지도

| 파일 | 언제 |
|---|---|
| `references/conventions.md` | 새 화면 · 인증 · 서버 호출 · 잡 · 결제 · 토큰 |
| `references/pitfalls.md` | 이상 동작, 리뷰 전 점검 |
| `references/build-and-run.md` | 실행 · 검증 명령 |
