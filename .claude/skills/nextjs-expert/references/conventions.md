# nextjs-expert — conventions

> 작성 시점 기준 일반 규약. 프로젝트의 실제 버전 · 기존 코드 · `develop/globalcommerce_develop.md`가 우선한다. 불일치는 보고한다.

## 라우트

- `app/` 아래 폴더 = 경로. 화면 ID · 경로는 `products/00_DECISIONS.md` 5.2 표가 정본이다 (`/dashboard`, `/sourcing`, `/products`, `/products/[id]/images`, `/upload`, `/runs`, `/settings/[section]`, `/billing`, `/admin/users` …).
- 공개 영역(`/`, `/login`, `/signup`, `/auth/callback`, `/b/[slug]`)과 로그인 영역, 슈퍼 어드민 영역은 라우트 그룹으로 분리한다.
- 로딩 · 에러 경계는 라우트 단위로 둔다.
- R2 · R3 화면(블로그 · 숏폼 · SNS · 워크플로우 캔버스 · 검색)은 해당 릴리스 task 전에는 라우트도 메뉴도 만들지 않는다.

## 서버/클라이언트 경계

- 기본은 서버 컴포넌트. `"use client"`는 이벤트 · 상태 · 브라우저 API 가 필요한 최소 컴포넌트에만.
- 서버에서 클라이언트로 넘기는 props 는 직렬화 가능한 값만.
- 서버 전용 모듈(비밀 · DB service role · `packages/ai` · `markets` · `net` · `sourcing`)은 `server-only`로 표시하고 클라이언트 모듈에서 import 하지 않는다.

## 인증 세션 (Supabase)

- 쿠키 기반 세션 클라이언트를 서버/브라우저용으로 구분해 만든다 (`@supabase/ssr` — 팩토리 이름은 버전 확인).
- 세션 갱신 · 보호 라우트 진입 판단은 `proxy.ts`(Next.js 16 에서 middleware 의 새 이름, 버전 확인)와 서버 레이아웃에서 한다. 클라이언트 상태만으로 보호하지 않는다.
- 역할(슈퍼 어드민) · 플랜은 쿠키 값이 아니라 서버 판정(`session_context` 등, 이름은 데이터 모델 정본)으로 읽는다.
- 인증 단계 A(로컬 시드 계정) → B(Google · 이메일) → C(카카오 · 네이버)는 GC-D-07. 현재 단계 밖 로그인 버튼을 만들지 않는다.

## 서버 호출 · 잡

- 사용자 요청 경로는 사용자 세션 + RLS 로 DB 를 읽고 쓴다. service role 은 웹훅 수신 같은 서버 전용 경로에서만, 사용 이유를 주석으로.
- 수집 · AI 생성 · 이미지 · 상세페이지 렌더 · 업로드 · 내보내기는 Route Handler 에서 잡을 등록(크레딧 선차감 RPC 포함)하고 바로 응답한다. 잡 이름은 `00_DECISIONS.md` 5.4.
- 진행률은 `workflow_runs` · `workflow_run_steps`(또는 업로드 배치) Realtime 구독으로 보여 주고, 화면을 떠나면 구독을 해제한다.
- 응답은 타입으로 좁히고, 오류 코드(5.5) → 화면 문구 변환을 한 곳에 둔다. GC003 은 추가 슬롯 단계(수량 → 결제 → 확인)로 안내한다 (GC-D-05).
- 계약 정본은 `products/04_API.md`와 `supabase/` 코드다. 필드를 추정하지 않는다.

## 결제 (Toss)

- 결제 금액 · 주문은 서버가 만든다. 클라이언트는 서버가 준 주문 id · 금액으로 결제창만 연다.
- 성공 리다이렉트 화면은 결과를 믿지 않고 서버 승인 · 웹훅 결과를 다시 조회해 보여 준다.
- 플랜 · 크레딧팩 · 추가 슬롯 값은 `packages/domain`(GC-D-04)에서 읽고 화면에 숫자를 하드코딩하지 않는다.

## 토큰 · 반응형

- 토큰 정본은 `apps/web/styles/tokens.css`(Tailwind CSS v4 `@theme`) 하나. 값은 `docs/design/dashboard/README.md` 토큰 표 (`/sync-design tokens`로 대조).
- 업무 화면 라이트 기본, 다크는 두 번째 벌(O-08). 포인트 컬러 민트 1색 — 채움 #00C9A7, 글자 · 버튼은 AA 색 #007A64.
- 구간: 모바일 ~767px · 태블릿 768–1199px · 데스크탑 1200px~ (GC-D-20).
- 글자 크기: 본문 14 · 표 13 · 페이지 제목 20/22/24 · 핵심 숫자 44/52/68 (모바일/태블릿/데스크탑). 토큰 변수로만 쓴다.
- 셸: 모바일 하단 탭 5개, 태블릿 아이콘 레일 64px + 햄버거, 데스크탑 사이드바 240px. 메뉴 순서 정본은 `Sidebar.dc.html`.

## 노드 캔버스 (R2)

- `@xyflow/react` 12, 그래프는 `workflow_versions.graph`(jsonb) (GC-D-18). 캔버스는 저장만 하고 실행은 서버 실행 엔진(worker-expert)이 한다.
- 연결되지 않은 노드를 실행하지 않는다 — 실행 가능 여부 판정은 서버.
