# 07 원본 이식과 폐기: GlobalCommerce

작성일 2026-10-25. 이 저장소는 코드를 새로 만든다. 원본 코드 저장소(v1 `nomad-ai-factory`, `sellingstudio`, `nomad-ai-commerce`)는 이 저장소에 없고, 근거는 platform-docs `reviews/`의 리뷰 문서와 그 리뷰가 인용한 줄 번호다. `Nomad-AI-Factory_V.2`는 코드 없는 기획 문서이고, 그 사본이 이 저장소 `docs/prd/PRD.md`와 `docs/spec/*.md`다. 벤치마크는 platform-docs `products/nomad-commerce/07_SOURCE_MIGRATION.md`다.

처리 용어: 이식(내용을 옮기고 2절 수정 적용), 참고(설계·문구만 보고 코드는 새로 씀), 보류(R2·R3 착수 때 다시 판단), 폐기(쓰지 않음, 3절 사유).

## 1. 원본 목록

| 원본 | 형태 | 이 저장소에서의 위치 | 근거 문서 | 처리 |
|---|---|---|---|---|
| `nomad-ai-factory`(v1) | Vite SPA + Express 코드, 완성도 약 30% | 없음 | platform-docs `reviews/nomad-ai-factory.md` | 자산 일부 참고, 나머지 폐기 |
| `Nomad-AI-Factory_V.2` | 기획 문서 10개 | `docs/prd/PRD.md`, `docs/spec/*.md` | `reviews/Nomad-AI-Factory_V.2.md` | 도메인 상세 참고(00장 1절 우선순위 3), 충돌 시 00~05장이 이긴다 |
| `sellingstudio` | Next 16 코드 | 없음 | `reviews/sellingstudio.md` | 패턴 참고 |
| `nomad-ai-commerce` | Next 코드(같은 도메인) | 없음 | `reviews/nomad-ai-commerce.md` | 화면 흐름 참고, 코드 폐기 |
| platform-docs nomad-commerce 기획 | 기획 9종 + 코어 문서 | 없음(외부 저장소) | `products/nomad-commerce/`, `products/_platform-core/` | 확정 규칙 재사용(1.5절) |
| 15단계 마이크로 PRD | 기획 | `docs/prd/15-step-micro-prd.md` | - | 정본(우선순위 2). 기능 ID는 00장 5.1절 |
| 대시보드 디자인 캔버스 | 화면 20개 | `docs/design/dashboard/`, `docs/design/structure-map.html` | - | 정본(우선순위 1) |

## 2. 이식 자산

### 2.1 nomad-ai-factory (v1)

| 자산 | 처리 | 대상 위치 | 작업 | 근거 |
|---|---|---|---|---|
| `frontend/lib/ai/index.ts` 리스팅 JSON 프롬프트, 톤·채널 가이드, 코드펜스 제거 파싱 | 참고 → zod 출력 검증으로 다시 씀 | `packages/ai/chains/title/` | GC-06-022 | `reviews/nomad-ai-factory.md:90` |
| `backend/server.js` 모델 화이트리스트, JSON 모드, `max_tokens` 상한 | 참고(라우터 기본값) | `packages/ai/` | GC-06-020 | 같은 문서 `:91` |
| `components/workflow/Canvas.tsx` 위상 정렬, 노드 6종 분류, `NodeSettingsPanel` UX | 보류(R2) → @xyflow/react 12로 새로 씀, 노드 data의 `apiKey` 제거 | `web/components/workflow/`, `worker/workflow/` | GC-06-037, 038 | 같은 문서 `:92` |
| `lib/stores/authStore.ts` Supabase OAuth 이벤트 순서 주석 | 참고 | `web/app/auth/callback/` | GC-06-036 | 같은 문서 `:93` |
| `app/dashboard/sourcing/page.tsx` 플랫폼·채널·톤 옵션 상수 | 이식(값 검토 후) | `packages/domain/` | GC-06-005 | 같은 문서 `:94` |
| `structer_extracted/structure/*.html` 대시보드 시안 | 참고만. 디자인 정본은 `docs/design/dashboard/` | - | - | 같은 문서 `:47` |
| 나머지 | 폐기 | - | - | 3절 |

### 2.2 Nomad-AI-Factory_V.2 (`docs/prd`, `docs/spec`)

| 자산 | 처리 | 대상 위치 | 작업 | 근거 |
|---|---|---|---|---|
| `MARKET_IMAGE_SPEC.md` 2·3절 쿠팡·스마트스토어 대표·상세 이미지 규격 | 이식(R1은 두 마켓만) | `packages/domain/`(마켓 규격 상수) | GC-06-005 | `docs/spec/MARKET_IMAGE_SPEC.md` 2·3절 |
| 같은 문서 8절 Sharp 변환·분할 코드 | 이식(마스터에서만 파생, 단위 테스트) | `packages/render/market/` | GC-06-025 | 같은 문서 8절 |
| 같은 문서 10절 규격 위반 감지 | 이식(오류 문구는 03장) | `packages/render/market/` | GC-06-025 | 같은 문서 10절 |
| 같은 문서 4·5·9·11절 18슬롯, 10/15장 구성, Puppeteer 템플릿 | 보류(R2, GC-D-10) | - | 미배정 | `reviews/Nomad-AI-Factory_V.2.md` 3장 #7 |
| `DETAIL_PAGE_SYSTEM.md` 5절 PHASE 4 "상세설명 4단 구조" | 이식 → R1 4단 블록(GC-D-10의 블록 이름이 정본) | `packages/ai/chains/detail/` | GC-06-025 | `docs/spec/DETAIL_PAGE_SYSTEM.md` 5절 |
| 같은 문서 1·2·4절 유형 8종, 자동 추천, 스토리라인 프롬프트 | 보류(R2). 리뷰형 후기·평점 슬롯은 폐기 | - | 미배정 | 같은 문서 1절 유형 2 |
| 같은 문서 8절 건기식 금지어 목록 | 이식 → `banned_words` 기본 사전 seed(`REPLACEMENTS['효과']` 제거) | `supabase/seed.sql`, `packages/compliance/` | GC-06-002, 021 | 같은 문서 8절 |
| 같은 문서 7절 JSON-LD 생성 | 이식(`brand`는 상품 브랜드) | `packages/domain/jsonld/` | GC-06-046 | 같은 문서 7절 |
| `MARKET_REGISTER_FORM.md` 10절 쿠팡·스마트스토어 필수 항목 | 이식(두 마켓만) | `packages/markets/{coupang,smartstore}/`, `packages/domain/` | GC-06-005, 027, 028 | `docs/spec/MARKET_REGISTER_FORM.md` 10절 |
| 같은 문서 6절 쿠팡 반품비 자동 계산 가이드 | 참고(값은 착수 시 쿠팡 공식 기준 확인, 미확인) | `packages/domain/` | GC-06-012 | 같은 문서 6절 |
| 같은 문서 9절 배송·반품 템플릿 구조 | 참고(반품 불가 문구 제외) | `shipping_templates` | GC-06-002, 012 | 같은 문서 9절 |
| 같은 문서 7절 고시 자동완성 프롬프트 | 보류. 고시 항목 R1 범위는 01장 결정 대기(미확인) | - | 027·028 착수 전 확인 | 같은 문서 7절 |
| `CLAUDE.md`(spec) 11절 엑셀 필드맵 | 참고 | `packages/sourcing/excel/` | GC-06-018 | `docs/spec/CLAUDE.md` 11절 |
| 같은 문서 14절 "엣지 없으면 실행 비활성" | 이식(규칙) | `web/components/workflow/` | GC-06-037 | 같은 문서 14절 |
| 같은 문서 15절 버튼 동사 시작, 금액 콤마, `role="progressbar"`, reduced-motion, 44px 터치 | 이식(규칙) → 03장, `products/CLAUDE.md` | - | 화면 작업 전부 | 같은 문서 15절 |
| `NOMAD_AI_FACTORY_MASTER_SPEC.md` 빈 상태·오류·확인·로딩 문구 | 참고 → 03장 문구 표, `web/lib/copy/` | `web/lib/copy/` | 화면 작업 | 같은 문서 PART 4 |
| 같은 문서 PART 5 대비표·키보드 맵 | 참고 | 03장 | 004, 화면 작업 | 같은 문서 PART 5 |
| `LANDING_PAGE_STITCH_PROMPT.md` 섹션 구성 | 참고(구조만, 수치·후기·가격 제거) | `web/app/(marketing)/` | GC-06-036 | `reviews/Nomad-AI-Factory_V.2.md` 3장 #5 |
| `PRD.md` IA·가격표 | 대체됨(00장 GC-D-04, 5.2절) | - | - | 같은 리뷰 #9 |

### 2.3 sellingstudio

| 자산 | 처리 | 대상 위치 | 작업 | 근거 |
|---|---|---|---|---|
| `proxy.ts` 세션 갱신·라우트 보호 패턴 | 참고 | `web/proxy.ts` | GC-06-006 | `reviews/sellingstudio.md` 2장 |
| `lib/supabase/{client,server,admin}.ts` | 참고(admin은 서버 전용) | `web/lib/` | GC-06-001, 006 | 같은 문서 2장 |
| `lib/image/fal.ts` 큐 제출 | 참고(타임아웃·재시도 3회 추가) | `packages/ai/` 이미지 어댑터 | GC-06-023 | 같은 문서 3장 #18 |
| fal 웹훅 → Realtime → 뷰어 카드 갱신 구조 | 참고(서명 검증 추가) | `worker/image/`, `web/components/images/` | GC-06-023, 024 | 같은 문서 6장 강점 2 |
| `app/api/auth/callback` | 참고(`next` 화이트리스트, origin env 고정) | `web/app/auth/callback/` | GC-06-036 | 같은 문서 3장 #7 |
| 생성 라우트 6개 | 폐기(크레딧 경계가 틀림). `withCredits` 패턴으로 새로 씀 | - | GC-06-008 | 같은 문서 3장 #1 |
| `capacitor.config.ts` | 폐기(모바일 앱 범위 밖) | - | - | 같은 문서 3장 #5 |

### 2.4 nomad-ai-commerce

| 자산 | 처리 | 대상 위치 | 작업 | 근거 |
|---|---|---|---|---|
| 수집 탭, 다계정 선택 업로드, 진행률 화면 흐름 | 참고(디자인 캔버스가 우선) | 03장 | GC-06-019, 030 | `reviews/nomad-ai-commerce.md` 6장 강점 1 |
| `app/api/execute-flow` 노드별 실행기 분리 | 참고(R2, HTTP 자기 호출 제외) | `worker/workflow/` | GC-06-038 | 같은 문서 4장 |
| `lib/utils/plan-policy.ts` 플랜 상수화 형태 | 참고(값은 GC-D-04) | `packages/domain/` | GC-06-005 | 같은 문서 6장 강점 3 |
| 설정의 배송 템플릿·음원 목록 화면 아이디어 | 참고(DB 영속화) | `web/app/(app)/settings/` | GC-06-012 | 같은 문서 3장 #18 |
| 나머지 코드 | 폐기 | - | - | 3절 |

### 2.5 platform-docs nomad-commerce에서 재사용하는 결정

| 결정 | 재사용 위치 | 다른 점 |
|---|---|---|
| 코어 lite 테이블과 RPC(`session_context`, `consume_credits`, `refund_credits`, `enqueue_job`, `claim_jobs`, `revoke_credential`, `confirm_payment_order`, `fail_payment_order`) | 002, 006~009 | 스키마가 `public` 하나(00장 2절) |
| 크레딧 선차감 → 작업 → 실패 환불, 멱등 키 | 008, 모든 유료 작업 | 앱 id `globalcommerce` |
| 인증 단계 A→G1→B→G2→C, Mock 페르소나, CI 금지 문자열 | 006, 036, 044 | 같음(GC-D-07) |
| 안전 fetch 규격(허용 도메인, 사설 IP, 리다이렉트 3회, 2MB, 10초) | 007 `packages/net` | 같음 |
| 워커 핸들러 자동 로드 규약 | 007 | 큐 이름 `gc.<영역>` |
| 마켓 키 `encrypted_credentials` + 마스킹 + 워커에서만 복호화 | 011, 029 | 같음 |
| Toss 규칙(금액 DB, customerKey `org_<id>`, 서명·멱등) | 009, 010 | 추가 슬롯 R1(GC-D-05) |
| compliance FAIL/WARN과 확인 RPC, 한글 경계 금지어 | 021, 025 | 같음 |
| 쿠팡·스마트스토어 어댑터 범위, 엑셀(플레이오토)·ZIP, 서명 URL 7일 | 027, 028, 031 | 같음 |
| Tailwind CSS v4 전용, 디자인 정답은 코드 하나 | 004 | 포인트 민트(GC-D-19) |
| 플랜 4종 가격·크레딧 | 002, 005, 009 | 숏폼 한도만 추가 |

재사용하지 않는 결정: FastAPI·LangGraph·Dify·RAG·음성 계층(GC-D-08, R3 재판단), MVP 18슬롯(GC-D-10), sceneflow 렌더 호출(GC-D-12, 자체 FFmpeg), 블로그를 nomad-blog에 위임(GC-D-14), 오픈소스 1024차원 임베딩(GC-D-15), 송장 블루 포인트(GC-D-19), 3D 히어로.

## 3. 이식 자산 상세(고칠 점)

| 자산 | 고칠 점 |
|---|---|
| v1 리스팅 프롬프트 | 환율 추정 지시 삭제(환율은 `fx_rates`), temperature 0.3(제안), `JSON.parse` 대신 zod, 후기·평점 문형 금지 |
| v1 위상 정렬 | 엣지 기준 실행, 순환 거부, 고립 노드 실행 차단, 노드별 크레딧 |
| V.2 마켓 변환 코드 | 마스터에서만 파생, 쿠팡 썸네일 흰 배경·텍스트 오버레이 0, 분할 경계 테스트 |
| V.2 금지어 | 상수 대신 `banned_words` 하나, `includes` 대신 한글 경계 매처, 치환 사전 오류 제거 |
| V.2 등록 폼 필드 | 쿠팡·스마트스토어 필드만, 반품 제한 사유 자동 체크 제거, 고시 ⑨ 자동 삽입 제거 |
| V.2 JSON-LD | `brand`를 상품 브랜드로, 마켓 HTML에는 넣지 않음 |
| sellingstudio 콜백 | `next`는 `/`로 시작하고 `//`·`\`·`@` 없는 경로만, origin은 `NEXT_PUBLIC_APP_URL` |
| sellingstudio fal 호출 | 타임아웃, 재시도 3회, 웹훅 서명 또는 URL 토큰 + request_id 대조, 결과를 Storage로 복사 |

## 4. 폐기 목록과 사유

| # | 대상 | 사유 | 근거 |
|---|---|---|---|
| 1 | v1 Vite SPA, HashRouter, Tailwind CDN, `index.html` 커스텀 CSS | Next.js 16 App Router + Tailwind CSS v4로 새로 만든다 | `reviews/nomad-ai-factory.md:99` |
| 2 | v1 Express 프록시(CORS `*`, IP 레이트리밋, `/api-proxy`) | 인증 없는 공개 AI 프록시 | 같은 문서 3장 #1 |
| 3 | v1 `vertex-ai-proxy-interceptor.js`, `vite.config.ts` 더미 define | AI Studio 템플릿 잔재 | 같은 문서 3장 #6 |
| 4 | v1 `pages/`, `contexts/`, `lib/{actions,media,commerce}`, 인증 3벌, 설정 폼 2벌 | 미사용 약 4,500줄 | 같은 문서 3장 #7 |
| 5 | v1 `SettingsModal` localStorage 키 저장(BYOK) | XSS 한 번이면 14개 서비스 키 유출 | 같은 문서 3장 #3 |
| 6 | v1 `lib/supabase/usage.ts` 클라이언트 한도 | 과금 우회 | 같은 문서 3장 #2 |
| 7 | v1 `frontend/supabase/schema.sql`, `main.html`, `structer.zip`, `CLAUDE_v0.md` | 구 스키마·깨진 시안·구 문서 | 같은 문서 3장 #4, #15 |
| 8 | v1 주문 조회·CRUD | 15단계 범위 밖(GC-D-01) | 같은 문서 5장 #13 |
| 9 | V.2 `DESIGN_FOR_STITCH.md`, `STITCH_UI_DESIGN_PLAN.md` | 디자인 캔버스가 정본, 같은 사실의 중복 | `reviews/Nomad-AI-Factory_V.2.md` 2장 |
| 10 | V.2 spec `CLAUDE.md` 8·9절 Zustand 큐 + SSE 예제 | 배포 불가, 청크 버퍼 버그 | 같은 리뷰 3장 #1, #12 |
| 11 | V.2 `<form>` 금지, "localStorage 금지(아티팩트)", `middleware.ts`, `@xyflow/react v11` 표기 | 잘못 섞인 규칙과 존재하지 않는 버전 | 같은 리뷰 3장 #11 |
| 12 | V.2 리뷰형 후기·평점·"전문가 추천" 슬롯 | 표시광고법 위반 소지 | 같은 리뷰 3장 #5 |
| 13 | V.2 "단순 변심 반품 불가" 기본 템플릿, "건강기능식품이 아닙니다" 자동 삽입 | 전자상거래법·사실과 다른 표시 | 같은 리뷰 3장 #6 |
| 14 | V.2 랜딩 허위 수치·가상 후기·"7일 환불 보장" | 출시 전 허위 표시 | 같은 리뷰 3장 #5, #9 |
| 15 | V.2 마켓 8개, SNS 5개, n8n·Make, 카드뉴스, 판매관리 | R1·R2 범위 밖(GC-D-01·03). 지마켓 등은 R2 이후 다시 판단 | 같은 리뷰 3장 #14 |
| 16 | V.2 env 단일 마켓 키(`COUPANG_ACCESS_KEY` 등) | 테넌트 격리 붕괴 | 같은 리뷰 3장 #3 |
| 17 | sellingstudio `/api/credits/use` 분리 차감, 클라이언트 결과 insert, `USING(true)` 정책 | 과금 우회, 무결성 붕괴 | `reviews/sellingstudio.md` 3장 #1·#2·#4·#11 |
| 18 | sellingstudio Stripe, 미사용 의존성 14개, `MOCK_*` 대시보드 탭 | Toss 단일(GC-D-06), 정리 대상 | 같은 문서 3장 #9, #12 |
| 19 | nomad-ai-commerce 모의 인증·쿠키 권한(`mock-login`, `nomad_role`, `nomad_plan`) | 권한 위조 | `reviews/nomad-ai-commerce.md` 3장 #1, #7 |
| 20 | nomad-ai-commerce `globalThis` 업로드 잡, `execute-flow` 자기 호출, `tableName` insert, `raw_html`, exchangerate.host | 서버리스 비호환, 보안 결함 | 같은 문서 3장 #2, #6, #10, #12, #14 |

## 5. 복사 금지 결함

| 패턴 | 출처 | 왜 금지 | 대체 | 막는 작업 |
|---|---|---|---|---|
| 공개 AI 프록시, CORS `*` | v1 `backend/server.js:19-25,48-53` | 키 도용 | 인증된 Route Handler·워커만 `packages/ai` 호출 | 020, 034 |
| 클라이언트 한도 판단, 실패 시 그냥 진행 | v1 `lib/supabase/usage.ts:49-69` | 무제한 사용 | `withCredits` + DB 트리거 | 008, 002 |
| localStorage·sessionStorage에 키·토큰·역할·플랜 | v1 `SettingsModal.tsx:136` | XSS 유출, 권한 위조 | `encrypted_credentials`, `session_context` | 011, 006, 034 |
| LLM 추정 환율 | v1 `lib/ai/index.ts:131` | 마진 오류 | 수출입은행 캐시 | 014 |
| 분리된 크레딧 차감, 읽고-빼고-쓰기 | sellingstudio `credits/use/route.ts:33-61` | 무료 사용, 음수 잔액 | 코어 `consume_credits` | 008 |
| 요청 바디로 플랜·모델 결정 | sellingstudio `generate/images/route.ts:15,33-34` | 비용 폭증 | `plans.features` | 008, 020 |
| 무서명 웹훅, `USING(true) WITH CHECK(true)` | sellingstudio `webhook/fal/route.ts`, `001_initial_schema.sql:134-136` | 타인 데이터 변조 | 서명·멱등, 정책 없음 | 009, 023, 002 |
| 콜백 `next` 미검증, Host 헤더 origin | sellingstudio `auth/callback/route.ts:8,12-17` | 오픈 리다이렉트 | 화이트리스트 + env origin | 006, 036 |
| 쿠키 역할·플랜(`nomad_role`, `nomad_plan`, `mock-login`) | nomad-ai-commerce `middleware.ts:5-8` | 권한 위조 | `session_context`, Mock은 로컬 시드 계정만 | 006, 034 |
| 인증 없는 키 반환 API | nomad-ai-commerce `market-accounts/route.ts:16-46` | 전 계정 탈취 | 마스킹 응답 | 011 |
| 사용자 URL 직접 fetch, 원문 HTML 저장 | nomad-ai-commerce `amazon-fetch/route.ts:187-212` | SSRF | ASIN만 추출, `packages/net` | 017, 007 |
| 요청 바디 테이블 이름 | nomad-ai-commerce `blog/post/route.ts:56-58` | 임의 테이블 쓰기 | 고정 테이블 | 019, 039 |
| 한글에 `\b` 금지어 정규식 | nomad-ai-commerce `lib/product-utils.ts:90` | 필터 무효 | `packages/compliance` | 021 |
| `globalThis` 인메모리 잡, 경과 시간 진행률 | nomad-ai-commerce `market-upload-jobs.ts:15-22` | 다중 인스턴스에서 404 | 코어 `jobs` + Realtime | 007, 029 |
| 엣지 무시, 배열 순서 실행 | nomad-ai-commerce `execute-flow/route.ts:98-125` | 사용자가 그린 순서 무시 | 위상 정렬 | 038 |
| Route Handler SSE + 브라우저 큐 | V.2 spec `CLAUDE.md` 8·9절 | 탭을 닫으면 중단 | 워커 + Realtime | 007 |
| 단일 env 마켓 키 | V.2 spec `CLAUDE.md` 3절 | 테넌트 격리 붕괴 | 조직별 자격증명 | 011 |
| `user_id = auth.uid()` 공통 정책, `FOR ALL` | V.2 `PRD.md` 8절 | 셀프 업그레이드 | 조직 정책 + `with check` | 002, 003 |
| AI 후기·평점·전문가 추천, 반품 불가·건기식 부정 자동 문구 | V.2 `DETAIL_PAGE_SYSTEM.md` 1절, `MARKET_REGISTER_FORM.md` 6·7절 | 위법 소지 | 생성 금지(FAIL), 법률 검토 문안 | 021, 025, 012 |
| JSON-LD `brand` 하드코딩 | V.2 `DETAIL_PAGE_SYSTEM.md` 7절 | 허위 정보 | 상품 브랜드 | 046 |
| `.env` 실키 커밋, 0키 폴백 | platform-docs `SECURITY_BASELINE.md` 14장 | 키 유출 | env 검증 기동 실패 | 001 |
| "Tailwind로"만 적은 지시 | platform-docs `_design-guide/DESIGN_SYSTEM.md` | v3 설정 혼입 | "Tailwind CSS v4" 명시, `tailwind.config.js` 금지 | 001, 004 |

## 6. `docs/spec/*.md`와 `docs/prd/*.md`를 대체하는 장

| 입력 문서 | 상태 | 대체하는 곳 | 남겨 쓰는 부분 |
|---|---|---|---|
| `docs/prd/15-step-micro-prd.md` | 정본 유지 | 01장 3장(GC-F 매핑) | 전부 |
| `docs/prd/PRD.md` | 대체 | 00장, 01장 | JTBD·셀러 세그먼트 서술 |
| `docs/spec/CLAUDE.md` | 대체 | 루트 `CLAUDE.md`(팀 운영), `products/CLAUDE.md`(개발 규칙), `develop/` | 15절 코딩 컨벤션 일부(아래 `products/CLAUDE.md` 10절 표) |
| `docs/spec/DESIGN.md` | 대체 | 03장, `docs/design/dashboard/README.md` 토큰 표, `web/styles/tokens.css` | 컴포넌트 상태·빈 상태·접근성 서술 |
| `docs/spec/NOMAD_AI_FACTORY_MASTER_SPEC.md` | 대체 | 03장 문구 표·접근성 절 | PART 4 문구, PART 5 대비표, PART 6 모션 원칙 |
| `docs/spec/DESIGN_FOR_STITCH.md` | 폐기 | 03장 | 없음 |
| `docs/spec/STITCH_UI_DESIGN_PLAN.md` | 폐기 | 디자인 캔버스, 03장 | 없음 |
| `docs/spec/LANDING_PAGE_STITCH_PROMPT.md` | 부분 대체 | 03장 GC-S-17 | 섹션 순서만(수치·후기·가격 제거) |
| `docs/spec/DETAIL_PAGE_SYSTEM.md` | 부분 대체 | R1: 01장 GC-F-207~209, 04장 상세페이지 API, 05장 `detail_pages` | R2 참고: 유형 8종, 스토리라인, 슬롯 파이프라인 |
| `docs/spec/MARKET_IMAGE_SPEC.md` | 도메인 상세로 유지 | 쿠팡·스마트스토어 값은 `packages/domain` 상수가 정답 | 규격표 전부(R2 마켓 확장 때 다시 사용) |
| `docs/spec/MARKET_REGISTER_FORM.md` | 부분 대체 | 01장 GC-F-301, 04장 업로드 API, 027·028 어댑터 | 두 마켓 필수 항목, 템플릿 구조(6·7절 자동 문구 제외) |

## 7. 아카이브 절차

| 단계 | 내용 | 확인 작업 |
|---|---|---|
| 1 | 원본 3개 코드 저장소(`nomad-ai-factory`, `sellingstudio`, `nomad-ai-commerce`)를 읽기 전용으로 바꾸고 README 첫 줄에 "GlobalCommerce로 대체" 표시. 이 저장소로 코드를 복사하지 않는다 | GC-06-034 |
| 2 | 원본 `.env.local`의 키(OpenRouter, fal, Supabase service_role, Browserless, Toss·Stripe)를 재발급하고 구 키 폐기 | GC-06-034 |
| 3 | `docs/spec/`은 지우지 않고 6절 상태를 각 파일 첫 줄에 표시(대체·폐기·유지). 폐기 문서는 R1 출시 뒤 `docs/archive/`로 이동(제안) | GC-06-034 |
| 4 | v1·sellingstudio 운영 Supabase에 실사용 데이터가 있으면 이관 여부를 대표님이 결정(미확인: 데이터 존재 여부). 이관 시 크레딧은 `grant_credits(reason='migration')` 1회 | 대표님 |
| 5 | 원본 Supabase 프로젝트는 읽기 전용 2주 보관 후 정지(제안) | 대표님 |
| 6 | 원본 이미지·시안(`structer_extracted`, 루트 `image*.png`)은 이 저장소에 가져오지 않는다. 필요한 시안은 이미 `docs/design/`에 있다 | - |

## 변경 이력

| 날짜 | 변경 |
|---|---|
| 2026-10-25 | 최초 작성 |
