# GlobalCommerce (globalcommerce)

작성일 2026-10-25. 기획서 묶음의 입구 문서. 장 구조는 platform-docs `products/nomad-commerce/README.md`를 따른다. ID와 결정은 `00_DECISIONS.md`가 정본이고, 이 문서와 다르면 `00_DECISIONS.md`가 이긴다.

## 1. 한 줄 정의

아마존·국내 위탁 상품을 수집해 AI로 상품명·대표 이미지·상세페이지를 만들고, 쿠팡·스마트스토어 여러 계정에 한 번에 올린 뒤, 블로그·숏폼·SNS로 홍보까지 자동화하는 구매대행 셀러용 SaaS다(`00_DECISIONS.md` 2절).

| 항목 | 내용 |
|---|---|
| 대상 사용자 | 아마존 구매대행 부업 셀러, 쿠팡·스마트스토어 다계정 셀러, 화장품·건기식 셀러, 숏폼으로 상품을 알리는 SNS 커머스 셀러(`01_PRD.md` 1장, `docs/prd/PRD.md` 2장) |
| 화면 표기 브랜드 | NOMAD AI Factory(디자인 캔버스 표기). 최종 브랜드는 O-01 |
| 코드명, 코어 앱 id | `globalcommerce` |
| 릴리스 | R1(MVP) 수집 → 가공 → 업로드, R2 노드 캔버스·블로그·숏폼·SNS, R3 임베딩 검색·JSON-LD(GC-D-02) |
| DB | Supabase 프로젝트 1개, 모든 테이블 `public` 스키마(5절) |

## 2. 입력 자료와 벤치마크 근거

| 근거 | 내용 |
|---|---|
| 화면 정본 = 디자인 캔버스 | 화면 20개(`docs/design/dashboard/*.dc.html`)가 메뉴, 경로, 문구, 상태 표현을 정한다. 숫자와 상품은 예시 데이터이고 플랜 한도도 예시다(`docs/design/dashboard/README.md` 6행) |
| 기능 범위 = 15단계 마이크로 PRD | 1~15단계(`docs/prd/15-step-micro-prd.md`)를 한 제품 안에서 모두 만든다(GC-D-01). 릴리스 배치는 GC-D-02 |
| 도메인 상세 = PRD v3.0.0과 스펙 | 마켓 이미지 규격(`docs/spec/MARKET_IMAGE_SPEC.md`), 등록 폼 필드(`docs/spec/MARKET_REGISTER_FORM.md`), 상세페이지 유형과 금지어(`docs/spec/DETAIL_PAGE_SYSTEM.md`), 가격표(`docs/prd/PRD.md` 7장) |
| 문서 구조·규칙 = platform-docs | `products/nomad-commerce/`(같은 제품 계열을 4개 원본에서 통합한 기획)의 장 구조, 크레딧 선차감, 플랜 한도 DB 집행, 마켓 키 암호화, 금지어 게이트를 그대로 쓴다. 코어 테이블은 `products/_platform-core/MONOLITH_CORE_LITE.sql` |
| 막아야 할 결함 = v1 리뷰 | platform-docs `reviews/nomad-ai-factory.md` 3장 높음 #1~#3(공개 AI 프록시와 CORS `*`, 클라이언트 한도 판단, localStorage API 키)과 쿠키 역할 판정(GC-D-21) |

nomad-commerce와 범위가 다른 곳(쇼츠 렌더·블로그·노드 캔버스 자체 구현, 4단 블록 상세페이지, AI 구성 경량화, pgvector 1536차원)은 `00_DECISIONS.md` 3절 결정표 마지막 열에 있다.

## 3. 원본 매핑

| 입력 자료 | 가져오는 것 | 버리거나 바꾸는 것 |
|---|---|---|
| `docs/design/dashboard/` 화면 20개 | 메뉴 순서(`Sidebar.dc.html`), 화면 구성, 실패 사유 문구, 진행률 표현, 반응형 3화면 | 플랜 한도 숫자(슬롯 1/2/5/20, AI 생성 횟수)는 GC-D-04 값으로 바꾼다(`00_DECISIONS.md` 7절). 설정의 "API 키" 탭은 O-11 |
| `docs/prd/15-step-micro-prd.md` | 1~15단계 기능 목록, GPT-4o 상품명, 1080×1080 합성, 4단 상세페이지, 15/30/50초 숏폼, `text-embedding-3-small` | 1단계 `users.role(SUPER_ADMIN)` 컬럼은 코어 `profiles.platform_role='platform_admin'`으로 대체, DALL-E 3 고정은 이미지 어댑터로(GC-D-09) |
| `docs/prd/PRD.md` v3.0.0 | 페르소나(2장), 가격표(7장), 상품 흐름(6.1절), 자동화 원칙 "연결된 노드만 실행"(6.6절) | 8개 마켓·5개 SNS 동시 지원, 카드뉴스, n8n·Make 모드, 4단계 역할(SUPER_ADMIN/PRO_USER/BASIC_USER/TEAM_MEMBER)은 R1 범위에서 뺀다(`01_PRD.md` 2장) |
| `docs/spec/MARKET_IMAGE_SPEC.md` | 쿠팡·스마트스토어 대표·상세 이미지 규격(2·3장), "마스터에서만 파생", "이미지 모델에 한글 요청 금지"(1장) | 18슬롯 이미지형 상세페이지는 R2(GC-D-10) |
| `docs/spec/MARKET_REGISTER_FORM.md` | 마켓별 필수 항목과 완성도 계산(10장), 마진 계산 요소(4장), 쿠팡 반품비 가이드(6장) | "이 제품은 건강기능식품이 아닙니다" 자동 삽입(7장)과 "단순 변심 반품 불가" 기본 사유(6장, 9장)는 쓰지 않는다(GC-D-11) |
| `docs/spec/DETAIL_PAGE_SYSTEM.md` | 금지어 대체어 목록(8장), JSON-LD Product 예시(7장) | 리뷰형의 가상 평점·후기·"전문가 추천"(1장 유형 2), `includes` 기반 금지어 매칭(8장) |
| `docs/spec/CLAUDE.md` v3.0.0 | 접근성 규칙(버튼 `#007A64`, 플레이스홀더 `#94A3B8`), 엣지 없는 캔버스 실행 금지(14장) | Zustand 브라우저 큐 + SSE 생성(8·9장), `@xyflow/react v11`, `.env.local` 단일 마켓 키(3장) |

세부 이식·폐기 목록은 `07_SOURCE_MIGRATION.md`.

## 4. 문서 목록

| 파일 | 내용 |
|---|---|
| `00_DECISIONS.md` | 확정 결정 GC-D-01~21, 열린 결정 O-01~08, ID 체계(기능·화면·테이블·잡·오류·작업) 정본 |
| `01_PRD.md` | 페르소나, R1/R2/R3 범위, 기능 요구사항과 수용 기준(GC-F-###), 요금과 크레딧 단가, 비기능(반응형 3구간 포함), 법·개인정보·금지 문구, KPI, 열린 결정(O-09~ 추가분) |
| `02_ARCHITECTURE.md` | 스택, 모노레포 구조, 잡 큐와 워커, `packages/ai` 어댑터, 외부 연동, 배포, 환경변수 |
| `03_SCREENS_UX.md` | 화면 GC-S-01~18 명세, 플로우, 셸과 반응형, 상태·빈 화면·오류 문구, 접근성 |
| `04_API.md` | Route Handler, RPC, 잡 페이로드, 웹훅, 외부 어댑터 계약, 오류 코드 GC001~ |
| `05_DATA_MODEL.md` | 도메인 테이블, 상태 전이, RLS, 인덱스, 플랜 features 키, 코어 참조 |
| `06_AGENT_PLAN.md` | 작업 GC-06-001~049, 웨이브 W0~W7, 모델 배치, 완료 정의 |
| `07_SOURCE_MIGRATION.md` | 입력 스펙·v1별 이식/폐기, 복사 금지 결함 |
| `CLAUDE.md` | 개발 에이전트 지침과 절대 규칙 |
| `supabase/monolith/` | `0001_core_lite.sql`(코어 lite 복사), 도메인 마이그레이션, `seed.sql`(플랜·크레딧팩·기본 금지어 사전) |
| `../develop/` | 개발서(`globalcommerce_develop.md`, 산출물 색인 `docs/file/_index.md`) |

읽는 순서: `00_DECISIONS.md` → `01_PRD.md` → `02` → `05` → `04` → `03` → `06`(자기 작업 행) → `07`.

## 4.1 릴리스 요약

| 릴리스 | 사용자가 할 수 있는 일 | 화면 | 기능 ID |
|---|---|---|---|
| R1(MVP) | 가입·결제, 마켓 계정 등록, 환율·트렌드 보고 아마존·위탁 상품 수집, AI 상품명·누끼·합성·4단 상세페이지, 쿠팡·스마트스토어 다계정 전송과 엑셀·ZIP, 실행 기록 | GC-S-01~06, 11, 13~17 | GC-F-001~011, 101~106, 201~209, 301~304, 401 |
| R2 | 노드 캔버스로 자동화, 블로그 원고·발행, 숏폼 렌더, 유튜브·인스타 업로드와 상품 링크 자동 삽입 | GC-S-07~10, 18 | GC-F-402~403, 501~506 |
| R3 | 의미 기반 상품 검색, JSON-LD를 상세페이지·블로그에 반영 | GC-S-12 | GC-F-601~603 |

`01_PRD.md`가 제안한 GC-F-305(마켓 등록 정보와 완성도)는 O-10 결정 전까지 R1 후보다.

## 5. DB 구조 선택

| 구조 | 선택 | 이유 |
|---|---|---|
| 모놀리스(Supabase 1개, `public` 스키마) | 선택 | 단독 저장소이고 다른 NOMAD 제품과 지갑·SSO를 공유할 계획이 없다. 셀러 마켓 키를 다른 제품과 물리적으로 분리한다. 코어 lite를 복사해 쓰고 affiliate·AI 지식·위키 절은 넣지 않는다(`00_DECISIONS.md` 5.3절) |
| 모듈러(platform-docs 통합 스키마) | 선택하지 않음 | nomad-commerce는 SNS 업로더를 video 제품에서 소비하려고 모듈러를 기본으로 했다. GlobalCommerce는 숏폼·SNS를 자체 구현하므로(GC-D-01) 이유가 없다 |

코어 lite 테이블은 수정하지 않는다. 플랜·크레딧·잡·자격증명은 코어 테이블만 쓰고 도메인 쪽에 다시 만들지 않는다.
