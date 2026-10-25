# 00 확정 결정과 ID 체계: GlobalCommerce

작성일 2026-10-25. 이 문서는 `products/`의 기획서 9종과 `develop/`의 개발서가 함께 따르는 정본이다. 문서끼리 다르면 이 문서가 이긴다. 바꿀 때는 맨 아래 변경 이력에 남긴다.

표기 규칙(platform-docs `products/nomad-commerce/01_PRD.md` 첫 줄과 같음): 원본·디자인·PRD에 근거가 없는 수치와 정책은 "제안"으로 쓰고 이유를 단다. 외부 사실(API 존재, 약관, 모델 제공 여부)을 확인하지 않았으면 "미확인"으로 쓴다.

## 1. 입력 자료와 우선순위

| 순위 | 자료 | 위치 | 정하는 것 |
|---|---|---|---|
| 1 | 대시보드 디자인 캔버스(화면 20개) | `docs/design/dashboard/`, 구조도 `docs/design/structure-map.html` | 화면, 메뉴, 경로, 화면 구성 요소, 문구, 상태 표현 |
| 2 | 15단계 마이크로 PRD | `docs/prd/15-step-micro-prd.md` | 기능 범위(1~15단계) |
| 3 | PRD v3.0.0과 스펙 문서 | `docs/prd/PRD.md`, `docs/spec/*.md` | 도메인 상세(마켓 이미지 규격, 등록 폼 필드, 상세페이지 유형, 금지어) |
| 4 | platform-docs 벤치마크 | DevOps0906/platform-docs `products/nomad-commerce/`, `products/_platform-core/`, `products/_design-guide/`, `develop/nomad-commerce/` | 문서 구조, 보안·결제·크레딧·인증 규칙, 코어 lite 테이블 |

벤치마크 대상인 nomad-commerce는 NOMAD AI Factory V.2를 포함한 원본 4개를 통합한 기획이다. GlobalCommerce는 같은 제품 계열을 15단계 범위 전체(쇼츠 렌더, SNS, 블로그, 노드 캔버스 포함)로 다시 기획한 단독 저장소다. nomad-commerce와 범위가 다른 곳은 3절 결정표에 적었다.

## 2. 제품 식별

| 항목 | 값 |
|---|---|
| 저장소 | DevOps0906/GlobalCommerce |
| 코드명 | `globalcommerce` |
| 코어 앱 id(`apps.id`) | `globalcommerce` |
| 화면 표기 브랜드 | NOMAD AI Factory(디자인 캔버스 표기). 최종 브랜드는 O-01 |
| 한 줄 정의 | 아마존·국내 위탁 상품을 수집해 AI로 상품명·대표 이미지·상세페이지를 만들고, 쿠팡·스마트스토어 여러 계정에 한 번에 올린 뒤, 블로그·숏폼·SNS로 홍보까지 자동화하는 구매대행 셀러용 SaaS |
| DB 구조 | Supabase 프로젝트 1개(모놀리스). 코어 lite(platform-docs `products/_platform-core/MONOLITH_CORE_LITE.sql`)와 도메인 테이블 모두 `public` 스키마 |
| 코드 위치(예정) | 이 저장소 루트의 pnpm 모노레포: `apps/web`, `services/worker`, `packages/*`, `supabase/` |

## 3. 확정 결정

| ID | 결정 | 이유 | nomad-commerce와 차이 |
|---|---|---|---|
| GC-D-01 | 15단계 전부를 이 제품 안에서 만든다(쇼츠 렌더, SNS 업로드, 블로그 발행, 노드 캔버스 포함) | 디자인과 15단계 PRD가 한 제품으로 그렸다 | nomad-commerce는 쇼츠 렌더를 sceneflow, 블로그를 nomad-blog에 맡겼다 |
| GC-D-02 | 릴리스 3단계. R1(MVP) = 1·2·3·6·7·8·9·10·14단계 + 5단계 중 실행 기록 화면(시스템 파이프라인만). R2 = 4·5단계(노드 캔버스, 사용자 워크플로우 실행 엔진), 11·12·13단계. R3 = 15단계 | 수집 → 가공 → 업로드만으로 첫 유료 매출을 검증할 수 있다(린 검증). 콘텐츠·자동화는 매출 검증 뒤 | nomad-commerce Phase 구분과 대체로 같고, 쇼츠·SNS를 R2에 자체 구현으로 둔 점만 다르다 |
| GC-D-03 | R1 마켓은 쿠팡 Wing Open API와 네이버 커머스 API, 그리고 엑셀(플레이오토 호환)·ZIP 내보내기. 지마켓·11번가 등은 R2 이후 | 국내 셀러 다수가 두 마켓을 쓴다. API 승인 전에도 엑셀·ZIP으로 등록 가능 | 같음(확정 결정 7) |
| GC-D-04 | 플랜 4종: 코드 `free`/`starter`/`pro`/`enterprise`, 화면 표기 무료/기본/프로/엔터, 월 0/29,000/69,000/149,000원(VAT 포함). 월 크레딧 15/150/350/900, 가입 크레딧 free 30. 마켓 계정 슬롯 1/3/10/30, 상품 30/300/2,000/10,000, 동시 생성 1/1/2/5. 숏폼 렌더 월 0/30/100/300편(R2, 제안) | nomad-commerce 2026-10-14 가격 판정을 그대로 쓴다. 디자인의 한도 숫자는 예시였다 | 숏폼 한도만 추가 |
| GC-D-05 | 추가 슬롯(Add-on)은 R1에 넣는다. 마켓 계정 등록이 슬롯 한도를 넘으면 등록 대신 추가 슬롯 결제 단계(수량 → 결제 → 확인)를 연다. 가격은 O-03 | 15단계 PRD 2단계가 요구하고 디자인에 화면이 있다 | nomad-commerce는 Phase 2 |
| GC-D-06 | 결제는 Toss Payments 단일(빌링키 구독 + 크레딧팩 일반결제) | 국내 카드 정기결제 | 같음(확정 결정 4) |
| GC-D-07 | 로그인 단계: A(개발, 로컬 시드 계정 Mock) → G1 → B(공개 베타 전, Google + 이메일) → G2 → C(카카오, 네이버). 네이버는 Supabase 기본 제공자가 아니라 커스텀 OAuth 또는 서버 브리지 | platform-docs `AUTH_ROADMAP.md` | 같음(확정 결정 22) |
| GC-D-08 | AI 구성은 R1에서 가볍게 간다: 서버 전용 TypeScript 패키지 `packages/ai`(제공자 어댑터 + 기능별 체인)를 Route Handler와 워커가 쓴다. 기본 LLM은 OpenAI GPT-4o(15단계 PRD 지정), 대체는 Anthropic Claude. FastAPI·LangGraph·Dify·RAG·음성 계층은 R3에서 다시 판단한다 | 1인 운영과 검증 속도. 키는 서버에만 둔다는 보안 원칙은 그대로 지킨다 | nomad-commerce는 MVP부터 FastAPI·Dify·RAG·음성 |
| GC-D-09 | 이미지: 누끼는 배경 제거 어댑터(기본 fal birefnet, 제안), 대표 이미지 합성은 이미지 생성 어댑터(15단계 PRD는 DALL-E 3. 착수 시 OpenAI 제공 모델을 확인하고 `gpt-image` 계열 또는 fal flux로 대체 가능, 미확인). 결과는 1080×1080. 한글 글자는 이미지 모델에 요청하지 않고 Sharp로 후합성 | 마켓 대표 이미지 규격, 한글 렌더 품질 | 제공자만 다름 |
| GC-D-10 | 상세페이지는 R1에서 4단 블록(1 후킹 헤드라인, 2 핵심 특징 3가지, 3 상세 스펙, 4 배송·교환 안내)으로 조립한다. 4번 블록에 해외 배송 템플릿을 조건부로 붙인다(해외 소싱 상품이고 설정이 켜져 있을 때만). 18슬롯 이미지형 상세페이지(`docs/spec/DETAIL_PAGE_SYSTEM.md`, `MARKET_IMAGE_SPEC.md`)는 R2 | 디자인 화면 S05와 15단계 PRD 10단계 | nomad-commerce는 MVP부터 18슬롯 |
| GC-D-11 | 금지어: 화장품·건기식 사전(`banned_words`), 한글 경계 매칭(정규식 `\b` 금지). 판정 FAIL이면 업로드·내보내기 차단, WARN은 사용자 확인 기록 뒤 진행. 후기·평점·"전문가 추천", "단순 변심 반품 불가", 건기식 부정 문구를 AI가 만들지 않는다 | 표시광고법, 마켓 반려 | 같음 |
| GC-D-12 | 쇼츠 렌더는 자체 워커(FFmpeg)로 15/30/50초, 9:16 1080×1920 mp4. 이미지 줌·팬 모션 + TTS 자막 + 음원(내 음원·기본 제공·랜덤). 음원 길이가 영상보다 짧으면 반복 재생 옵션 | 디자인 S08 | nomad-commerce는 sceneflow 워커 호출 |
| GC-D-13 | SNS: YouTube Data API v3(쇼츠 업로드, 설명란·댓글), Instagram Graph API(비즈니스 계정 릴스). 댓글 고정은 API 미지원으로 보고 수동 안내(미확인, 착수 전 확인). 상품 URL은 마켓 등록 완료 후 자동 삽입, 그전에는 "링크 대기" | 디자인 S09, 15단계 PRD 13단계 | nomad-commerce는 video 업로더 소비 |
| GC-D-14 | 블로그: 자체 블로그(앱 안 공개 페이지 `/b/[slug]`)와 WordPress REST API. 지역 신문사 연동(platform-docs local-news)은 R3 선택 | 디자인 S07 | nomad-commerce는 범위 밖 |
| GC-D-15 | 검색: Supabase pgvector, OpenAI `text-embedding-3-small`(1536차원), 하이브리드(전문 검색 + 벡터, 가중치 조절). JSON-LD는 schema.org Product | 15단계 PRD 15단계 | nomad-commerce는 오픈소스 임베딩 1024차원 |
| GC-D-16 | 환율은 한국수출입은행 현재환율 API를 평일 11:30 KST 1회 캐시. 실패 시 마지막 값과 기준 시각 표시. LLM 추정 환율 금지 | v1 리뷰 결함 | 같음 |
| GC-D-17 | 트렌드는 네이버 데이터랩 검색어 트렌드 API(상대 지수). 시즌 추천 = 4주 전 대비 증가율 상위 키워드 | 디자인 S01 | nomad-commerce는 Phase 2 |
| GC-D-18 | 실행 모델: 모든 비동기 작업은 코어 `jobs` 큐 + 워커. 사용자에게 보이는 실행 단위는 `workflow_runs`(종류 `system` = 고정 파이프라인, `workflow` = 사용자 캔버스)와 `workflow_run_steps`. R1은 `system`만, R2부터 `workflow`. 캔버스는 @xyflow/react 12, 그래프는 `workflow_versions.graph`(jsonb), 실행은 위상 정렬 + 노드별 재시도 | 디자인 S10·S11, v1 리뷰(엣지 무시 결함) | nomad-commerce는 MVP에 캔버스 없음 |
| GC-D-19 | 디자인 정본은 디자인 캔버스와 `docs/design/dashboard/README.md` 토큰 표. 코드의 정답은 `apps/web/styles/tokens.css`(Tailwind CSS v4 `@theme`) 하나. 업무 화면 라이트 기본, 다크는 두 번째 벌, 포인트 컬러 민트 1색 | platform-docs `_design-guide` | 포인트 색만 다름(nomad-commerce 03장은 송장 블루 제안) |
| GC-D-20 | 반응형 3구간: 모바일 ~767px, 태블릿 768~1199px, 데스크탑 1200px~. 글자 크기 본문 14·표 13·페이지 제목 20/22/24·핵심 숫자(Bebas Neue) 44/52/68. 셸은 모바일 하단 탭 5개, 태블릿 아이콘 레일 64px + 햄버거, 데스크탑 사이드바 240px | 사용자 지정, 디자인 반응형 화면 3개 | - |
| GC-D-21 | v1 리뷰(platform-docs `reviews/nomad-ai-factory.md`)의 결함을 막는다: CORS `*`, 클라이언트 과금 판단, localStorage API 키, 공개 AI 프록시, 쿠키 역할 판정. 판정은 전부 서버(`session_context`, 트리거, RPC) | 보안 | 같음 |
| GC-D-22 | 추가 슬롯 결제는 코어 `payment_orders.kind`에 슬롯 종류가 없으므로 `billing_key_charge` + metadata `{addon, quantity}`로 결제하고 `slot_addons.payment_order_id`로 연결한다. 코어에 `slot_addon` 종류가 생기면 그쪽으로 옮긴다 | 코어 lite는 수정하지 않는다(products/CLAUDE.md 2절) | - |
| GC-D-23 | 업로드 배치는 상세페이지 `confirmed`부터 받지만, 실제 전송 잡은 상세페이지가 `ready`(마켓 이미지 변환 완료)가 된 뒤 시작한다 | 04장 `gc_create_upload_batch`, 05장 3절 | - |
| GC-D-24 | "저장한 보기"는 R1에서 서버 테이블 `saved_views`(사용자별)로 저장한다. 브라우저 저장소에 두지 않는다 | 01장 GC-F-106 | - |
| GC-D-25 | 제품 RPC는 `gc_` 접두사를 쓴다(`gc_features`, `gc_limit`, `gc_create_upload_batch`, `gc_apply_product_edits`, `gc_acknowledge_compliance_warning`, `gc_release_held_jobs`, `gc_record_step_outcome`, `gc_dashboard_summary`, `gc_admin_set_plan`, R3 `gc_hybrid_search` 등). 정본은 04장 3절과 `0002_globalcommerce_domain.sql` | 코어 함수와 이름 충돌 방지 | - |
| GC-D-26 | 로컬 개발·테스트 기준은 Docker Desktop이다. Supabase 로컬 스택(CLI가 컨테이너로 기동)과 `docker-compose.yml`의 `web`·`worker` 서비스를 명령 하나(`pnpm dev:docker`, 제안)로 띄운다. 외부 API는 로컬 기본값이 가짜 어댑터이고 키를 넣으면 실제 호출로 바뀐다. 워커 이미지는 로컬과 배포(Railway)가 같은 Dockerfile을 쓴다. Windows는 WSL2 백엔드 | 사용자 지정(2026-10-25). 혼자 운영하므로 한 명령으로 전체를 재현할 수 있어야 한다 | - |

## 4. 열린 결정

| ID | 질문 | 선택지 | 기본안(정하기 전까지) | 정할 사람·시점 |
|---|---|---|---|---|
| O-01 | 제품 브랜드 | NOMAD AI Factory / NOMAD Commerce / GlobalCommerce | 디자인대로 NOMAD AI Factory | 대표님, R1 랜딩 전 |
| O-02 | 아마존 상품 데이터 수집 방식 | 공식 PA-API(판매 실적 자격 조건, 미확인) / 서드파티 상품 데이터 API(Rainforest·Keepa 등, 미확인) | 서드파티 API 어댑터, 직접 스크래핑 금지 | 대표님, W2 전 |
| O-03 | 추가 슬롯 가격 | 슬롯당 월 정액 / 플랜 업그레이드 유도만 | 화면은 `[추가 슬롯 가격]` 자리 표시 | 대표님, W1 전 |
| O-04 | 대표 이미지 생성 제공자 | OpenAI 이미지 모델 / fal flux | 어댑터로 둘 다 지원, 기본은 착수 시 비용·품질 비교 | 대표님, W3 전 |
| O-05 | 숏폼 렌더 한도와 크레딧 단가 | 3절 GC-D-04 제안값 / 별도 | 제안값 | 대표님, R2 착수 전 |
| O-06 | YouTube 댓글 고정 | 수동 안내 / 대체 수단 | 수동 안내 | 착수 전 API 문서 확인 |
| O-07 | 자체 블로그 도메인 | 앱 하위 경로 `/b/` / 별도 서브도메인 | 하위 경로 | 대표님, R2 |
| O-08 | 다크 테마 출시 시점 | R1 / R2 | R2(R1은 라이트만, 토큰은 두 벌 정의) | 대표님 |
| O-09 | R1 크레딧 단가(상품명 1, 누끼 1, 합성 2, 상세 조립 2) | 제안값 / 누끼를 합성에 묶기 / 상품 1개 정액 | 제안값(01장 4.2절) | 대표님, W3 전 |
| O-10 | 마켓 등록 정보(카테고리·고시·필수 속성) 화면 위치 | GC-F-305 + 상품 상세 "등록 정보" 탭 / 업로드 화면 안 | GC-F-305 + 탭(01장, 03장) | 대표님, W4 전 |
| O-11 | 설정 화면 "API 키" 탭 | 두지 않음 / 사용자 AI 키 입력 | 두지 않음 | 대표님 |
| O-12 | free 플랜의 마켓 API 업로드 | 허용(계정 1) / ZIP만 | 허용 | 대표님, W4 전 |
| O-13 | 해외 배송 금지 품목 판정 출처 | 운영자 관리 목록 / 외부 데이터 | 운영자 목록 | 대표님, W2 전 |
| O-14 | 엔터 플랜 판매 시점 | R1 / 초기 미판매 | 초기 미판매 | 대표님 |
| O-15 | 원본 이미지 사용 권리와 AI 생성 표시 | 셀러 책임 고지 / 원본 직접 사용 제한 | 셀러 책임 고지 | 대표님, R1 출시 전 법률 검토 |

O-09~O-15의 근거와 영향은 `01_PRD.md` 8장에 있다.

## 5. ID 체계

| 대상 | 형식 | 예 | 정의 문서 |
|---|---|---|---|
| 확정 결정 | `GC-D-##` | GC-D-04 | 이 문서 3절 |
| 열린 결정 | `O-##` | O-02 | 이 문서 4절 |
| 기능 요구사항 | `GC-F-###` | GC-F-104 | `01_PRD.md` 3장 |
| 화면 | `GC-S-##` | GC-S-02 | `03_SCREENS_UX.md` 1장 |
| 오류 코드 | `GC0##`(SQLSTATE 사용자 정의) | GC004 | `04_API.md` 오류 절 |
| 작업 | `GC-06-###` | GC-06-017 | `06_AGENT_PLAN.md` 2장 |
| 디자인 수정 항목 | `GC-DF-##` | GC-DF-01 | `03_SCREENS_UX.md` 7장 |
| 제품 RPC | `gc_<이름>` | `gc_create_upload_batch` | `04_API.md` 3절 |
| 산출물 | `DOC-<단계>-###` | DOC-REQ-001 | `develop/docs/file/_index.md` |

### 5.1 기능 ID (정본 목록)

번호 구역: 0xx 플랫폼(1~3단계), 1xx 대시보드·소싱(6·7단계), 2xx AI 가공(8~10단계), 3xx 업로드(14단계), 4xx 자동화(4·5단계), 5xx 콘텐츠(11~13단계), 6xx 검색·GEO(15단계).

| ID | 기능 | 단계 | 릴리스 | 화면 |
|---|---|---|---|---|
| GC-F-001 | 로그인·가입(인증 단계 A→B→C) | 2 | R1(B는 공개 베타 전) | S16 |
| GC-F-002 | 역할·플랜 판정(서버) | 1 | R1 | 전체 |
| GC-F-003 | 슈퍼 어드민 콘솔(사용자 목록, 역할·플랜 조정, 감사 기록) | 1 | R1 | S15 |
| GC-F-004 | 크레딧 선차감·환불 | 2 | R1 | 전체 |
| GC-F-005 | 플랜 한도 DB 집행(상품 수, 마켓 슬롯, 기능) | 2 | R1 | S13, S14 |
| GC-F-006 | 구독 결제(Toss 빌링키), 크레딧팩 | 2 | R1 | S14 |
| GC-F-007 | 추가 슬롯 구매(3단계 위저드) | 2 | R1 | S14 |
| GC-F-008 | 마켓 계정 다계정 등록·검증·만료 표시 | 3 | R1 | S13 |
| GC-F-009 | 해외 배송 템플릿 On/Off와 문구 | 3 | R1 | S13 |
| GC-F-010 | 음원 라이브러리(내 음원 업로드, 기본 제공 풀) | 3 | R1(업로드·목록), R2(렌더 사용) | S13 |
| GC-F-011 | 알림 설정(인앱·이메일) | 3 | R1 | S13 |
| GC-F-101 | 환율 위젯(USD/KRW 크게, CAD/KRW 작게)과 마진 계산 | 6 | R1 | S01, S02 |
| GC-F-102 | 데이터랩 검색어 추이와 시즌 추천 | 6 | R1 | S01 |
| GC-F-103 | 대시보드 KPI(오늘 처리 대기)와 최근 실행 | 6 | R1 | S01 |
| GC-F-104 | 아마존 URL 수집(ASIN 추출, 중복 시 갱신) | 7 | R1 | S02 |
| GC-F-105 | 위탁 엑셀 수집(오너클랜·도매꾹, 열 매핑, 오류 셀 표시) | 7 | R1 | S02 |
| GC-F-106 | 상품 목록·필터·저장한 보기·일괄 선택 | 7·8 | R1 | S02, S03 |
| GC-F-201 | AI 상품명(GPT-4o 번역 + GEO 키워드 조합) | 8 | R1 | S03 |
| GC-F-202 | 금지어 사전과 자동 치환(화장품·건기식) | 8 | R1 | S03 |
| GC-F-203 | 셀 직접 편집, 바뀐 셀 표시, 한 번에 저장·되돌리기 | 8 | R1 | S03 |
| GC-F-204 | 누끼(배경 제거) | 9 | R1 | S04 |
| GC-F-205 | 대표 이미지 합성 1080×1080(배경 설명 입력, 다시 만들기) | 9 | R1 | S04 |
| GC-F-206 | 상품 활동 타임라인과 메모 | 9 | R1 | S04 |
| GC-F-207 | 상세페이지 4단 블록 조립·편집(실행 취소, 자동 저장, 기기 폭 미리보기) | 10 | R1 | S05 |
| GC-F-208 | 배송 템플릿 조건부 결합 | 10 | R1 | S05 |
| GC-F-209 | 상세페이지 확정과 마켓 규격 이미지 변환 | 10 | R1 | S05 |
| GC-F-301 | 상품 × 마켓 계정 선택 전송(멱등) | 14 | R1 | S06 |
| GC-F-302 | 전송 진행률(실시간), 실패 사유 한 줄, 실패 건만 재전송 | 14 | R1 | S06 |
| GC-F-303 | 엑셀(플레이오토 호환)·ZIP 내보내기 | 14 | R1 | S06 |
| GC-F-304 | 등록 완료 상품 URL 저장과 13단계 전달 | 14 | R1(저장), R2(전달) | S06, S09 |
| GC-F-305 | 마켓 등록 정보(카테고리, 상품정보제공고시, 필수 속성)와 완성도. 완성도 100% 미만이면 전송 버튼 비활성(제안, O-10) | 14 | R1 | S04 등록 정보 탭, S06 |
| GC-F-401 | 실행 기록(시스템 파이프라인 진행률, 노드별 로그, 실패 노드부터 재실행) | 5 | R1 | S11 |
| GC-F-402 | 노드 캔버스(팔레트, 미니맵, 노드 설정 패널, 버전 기록) | 4 | R2 | S10 |
| GC-F-403 | 워크플로우 실행 엔진(위상 정렬, 노드별 재시도, 취소) | 5 | R2 | S10, S11 |
| GC-F-501 | 블로그 원고 생성(상세페이지 기반) | 11 | R2 | S07 |
| GC-F-502 | 블로그 발행(자체 블로그, WordPress), 예약 | 11 | R2 | S07 |
| GC-F-503 | 숏폼 렌더(15/30/50초, 모션 템플릿 3종) | 12 | R2 | S08 |
| GC-F-504 | TTS 자막과 음원 합성 | 12 | R2 | S08 |
| GC-F-505 | SNS 채널 연결과 업로드 예약(유튜브 쇼츠, 인스타 릴스) | 13 | R2 | S09 |
| GC-F-506 | 상품 URL 자동 삽입(설명란, 댓글) | 13 | R2 | S09 |
| GC-F-601 | 상품 임베딩(text-embedding-3-small) | 15 | R3 | S12 |
| GC-F-602 | 하이브리드 검색(키워드/의미 가중치, 필터, CSV) | 15 | R3 | S12 |
| GC-F-603 | JSON-LD(Product) 생성과 상세페이지·블로그 반영 | 15 | R3 | S12 |

### 5.2 화면 ID와 경로 (정본 목록)

| ID | 화면 | 경로 | 패턴(platform-docs DASHBOARD_PATTERNS) | 디자인 파일 | 릴리스 |
|---|---|---|---|---|---|
| GC-S-01 | 대시보드 | `/dashboard` | C · L | `Main.dc.html`, `TabletDashboard.dc.html`, `MobileDashboard.dc.html` | R1 |
| GC-S-02 | 소싱·수집 | `/sourcing` | B · O | `Sourcing.dc.html` | R1 |
| GC-S-03 | 상품 관리(상품명) | `/products` | B · O | `Products.dc.html` | R1 |
| GC-S-04 | 상품 이미지 | `/products/[id]/images` | G · M | `ProductImages.dc.html` | R1 |
| GC-S-05 | 상세페이지 | `/products/[id]/detail-page` | J | `DetailPage.dc.html` | R1 |
| GC-S-06 | 마켓 업로드 | `/upload` | O · N | `Upload.dc.html`, `MobileUpload.dc.html` | R1 |
| GC-S-07 | 블로그 발행 | `/content/blog` | B · J | `Blog.dc.html` | R2 |
| GC-S-08 | 숏폼 영상 | `/content/shorts` | J · N · M | `Shorts.dc.html` | R2 |
| GC-S-09 | SNS 배포 | `/content/sns` | N · E | `Sns.dc.html` | R2 |
| GC-S-10 | 워크플로우 | `/workflows`, `/workflows/[id]` | K | `Workflows.dc.html` | R2 |
| GC-S-11 | 실행 기록 | `/runs`, `/runs/[id]` | N | `Runs.dc.html` | R1 |
| GC-S-12 | 상품 검색·GEO | `/insights/search` | L | `Search.dc.html` | R3 |
| GC-S-13 | 설정 | `/settings/[section]`(general, markets, shipping, music, notifications) | H | `Settings.dc.html` | R1 |
| GC-S-14 | 플랜·결제 | `/billing` | H · I | `Billing.dc.html` | R1 |
| GC-S-15 | 슈퍼 어드민 | `/admin/users` | B · C · G | `Admin.dc.html` | R1 |
| GC-S-16 | 로그인·가입·온보딩 | `/login`, `/signup`, `/auth/callback`, `/onboarding` | I | 디자인 없음(03장에서 정의) | R1 |
| GC-S-17 | 랜딩 | `/` | 마케팅 | `docs/spec/LANDING_PAGE_STITCH_PROMPT.md` | R1 |
| GC-S-18 | 자체 블로그 공개 글 | `/b/[slug]` | 문서 | 디자인 없음 | R2 |

하위 경로(03장에서 정의): `/products/[id]`(상품 상세 기본 탭, `/products/[id]/images`로 이동), `/products/[id]/uploads`(업로드 기록 탭), `/billing/success`, `/billing/fail`(Toss 결제 결과).

공용 셸: `Sidebar.dc.html`(메뉴 순서 정본), `TopBar.dc.html`. R2·R3 메뉴는 해당 릴리스 전까지 렌더하지 않는다(잠금 배지가 아니라 숨김. 플랜 잠금은 배지).

### 5.3 테이블 (정본 이름)

코어 lite(platform-docs `MONOLITH_CORE_LITE.sql`에서 복사, 수정 금지): `profiles`, `organizations`, `org_members`, `audit_log`, `apps`, `plans`, `credit_packs`, `subscriptions`, `app_entitlements`, `billing_keys`, `payment_orders`, `payments`, `webhook_events`, `wallets`, `credit_ledger`, `ai_usage`, `oauth_states`(R2 SNS 연결에 사용), `encrypted_credentials`, `rate_limit_buckets`, `jobs`. affiliate·AI 지식·위키·대화 절은 넣지 않는다(`0001_core_lite.sql` 머리 주석).

도메인(모두 `org_id` 보유, RLS 필수):

| 영역 | 테이블 | 릴리스 |
|---|---|---|
| 설정 | `market_accounts`, `shipping_templates`, `audio_tracks`, `notification_prefs`, `saved_views`, `slot_addons` | R1 |
| 대시보드 | `fx_rates`(조직 없음, 공용 읽기), `trend_keywords`(조직 없음), `season_picks`(조직 없음) | R1 |
| 소싱·상품 | `source_imports`, `import_rows`, `products`, `product_images`, `banned_words`(org_id null = 기본 사전), `title_revisions`, `product_activities` | R1 |
| 상세페이지 | `detail_pages`(blocks jsonb, verdict, status), `market_images` | R1 |
| 업로드 | `upload_batches`, `market_listings`, `export_files` | R1 |
| 실행 | `workflows`, `workflow_versions`, `workflow_runs`, `workflow_run_steps` | R1(`workflow_runs`·`workflow_run_steps`만), R2(전체) |
| 콘텐츠 | `posts`, `publish_targets`, `videos`, `sns_accounts`, `sns_posts` | R2 |
| 검색 | `product_embeddings`, `jsonld_snapshots` | R3 |

### 5.4 잡 타입 (코어 `jobs.job_type`, 큐 `gc.<영역>`)

| 큐 | job_type | 릴리스 |
|---|---|---|
| `gc.import` | `import.amazon`, `import.excel` | R1 |
| `gc.ai` | `title.generate`, `image.cutout`, `image.compose` | R1 |
| `gc.detail` | `detail.assemble`, `detail.render_market` | R1 |
| `gc.upload` | `upload.coupang`, `upload.smartstore`, `upload.poll_status` | R1 |
| `gc.export` | `export.excel`, `export.zip` | R1 |
| `gc.cron` | `fx.fetch`, `trend.fetch`, `export.expire` | R1 |
| `gc.workflow` | `workflow.step` | R2 |
| `gc.content` | `blog.generate`, `blog.publish`, `shorts.render`, `sns.upload`, `sns.link_insert` | R2 |
| `gc.search` | `embed.product`, `jsonld.build` | R3 |

### 5.5 오류 코드

| 코드 | 의미 | HTTP |
|---|---|---|
| GC001 | 허용되지 않는 상태 전이 | 409 |
| GC002 | 상품 수 한도 초과 | 403 |
| GC003 | 마켓 계정 슬롯 한도 초과(추가 슬롯 단계로 안내) | 403 |
| GC004 | 금지어 FAIL 상세페이지·상품명으로 업로드·내보내기 | 422 |
| GC005 | 확인하지 않은 WARN이 있음 | 422 |
| GC006 | 배송·반품 템플릿 규칙 위반(청약철회 7일 미만 등) | 422 |
| GC007 | 플랜에 없는 기능 | 403 |
| GC008 | 동시 실행 한도 초과(대기열로 넣음) | 202 |
| GC009 | 마켓 계정 키 검증 실패 또는 만료 | 422 |
| GC010 | 허용 도메인이 아닌 URL | 400 |
| CR001(코어) | 크레딧 부족 | 402 |

### 5.6 작업 ID와 웨이브 (요약, 상세는 `06_AGENT_PLAN.md`)

모델 배치는 사용자의 멀티에이전트 구조를 따른다: 고문 Fable 5.1(결제, 권한, RLS, 데이터 모델처럼 실수 비용이 큰 설계), 주 Opus 5.5(기능 설계, 연동, 검증), 대리 Sonnet 5.5(화면, 컴포넌트, 문서), 사원 Haiku 5.5(보일러플레이트, 문구, 체크리스트).

| 웨이브 | 릴리스 | 작업 |
|---|---|---|
| W0 기반 | R1 | 001 모노레포·CI, 002 DB 마이그레이션(코어 lite + 도메인 R1), 003 RLS 테스트, 004 디자인 토큰·공용 셸(사이드바·상단 바·하단 탭), 005 도메인 패키지(상수·zod·플랜 features·단가), 006 인증 Stage A·`proxy.ts`·세션, 007 워커 런타임(잡 루프·디스패처·크론) |
| W1 플랫폼 | R1 | 008 플랜·크레딧 API, 009 Toss 구독·크레딧팩, 010 추가 슬롯, 011 마켓 계정(암호화·검증), 012 배송 템플릿·음원·알림 설정, 013 슈퍼 어드민 |
| W2 데이터 | R1 | 014 환율 크론·위젯, 015 데이터랩 트렌드, 016 대시보드 화면, 017 아마존 수집 어댑터, 018 엑셀 파서, 019 소싱 화면 |
| W3 AI 가공 | R1 | 020 AI 라우터 `packages/ai`, 021 금지어 매처, 022 상품명 생성 잡과 상품 관리 화면, 023 누끼·합성 잡, 024 상품 이미지 화면, 025 상세페이지 조립·마켓 이미지 변환, 026 상세페이지 에디터 화면 |
| W4 업로드 | R1 | 027 쿠팡 어댑터, 028 스마트스토어 어댑터, 029 업로드 배치·진행률 API, 030 업로드 화면, 031 엑셀·ZIP 내보내기, 032 실행 기록 화면 |
| W5 R1 마감 | R1 | 033 E2E 핵심 흐름, 034 보안 점검(v1 결함 grep, 키 노출), 035 반응형 3구간 점검, 048 랜딩·약관 페이지, 036 인증 Stage B(G1 후) |
| W6 | R2 | 037 노드 캔버스, 038 실행 엔진, 039 블로그 원고·발행, 040 숏폼 렌더 워커, 041 숏폼 화면, 042 SNS 연동·업로드, 043 링크 자동 삽입, 049 18슬롯 상세페이지, 044 인증 Stage C(G2 후) |
| W7 | R3 | 045 임베딩·하이브리드 검색, 046 JSON-LD, 047 검색 화면 |

## 6. 문서 지도

| 구분 | 경로 | 벤치마크 원본(platform-docs) |
|---|---|---|
| 결정 정본 | `products/00_DECISIONS.md` | `products/00_MERGE_ANALYSIS.md` 확정 결정 표 |
| 기획서 | `products/README.md`, `01_PRD.md` ~ `07_SOURCE_MIGRATION.md`, `CLAUDE.md`, `supabase/monolith/` | `products/nomad-commerce/` |
| 개발서 | `develop/README.md`, `develop/globalcommerce_develop.md`, `develop/docs/file/_index.md` | `develop/nomad-commerce/` |
| 입력 자료 | `docs/prd/`, `docs/spec/`, `docs/design/` | - |

## 7. 디자인 캔버스에서 고칠 곳 (이 결정 때문에)

| 화면 | 지금 | 바꿀 값 | 근거 |
|---|---|---|---|
| `Sidebar.dc.html` | 프로 플랜 · 마켓 슬롯 4 / 5 | 4 / 10 | GC-D-04 |
| `Settings.dc.html` | 프로 플랜은 5개까지, 계정 추가 4 / 5 | 10개까지, 4 / 10 | GC-D-04 |
| `Billing.dc.html` | 플랜 비교 슬롯 1/2/5/20, AI 생성 횟수, 숏폼 편수 | 슬롯 1/3/10/30, 월 크레딧 15/150/350/900, 상품 30/300/2,000/10,000 | GC-D-04 |
| `Billing.dc.html` | 사용량 "AI 생성 1,240 / 3,000" | "크레딧 잔액 / 월 지급량" | GC-D-04(크레딧 모델) |
| `Main.dc.html` | - | 변경 없음 | - |

## 변경 이력

| 날짜 | 변경 | 작업 |
|---|---|---|
| 2026-10-25 | 최초 작성 | 기획서·개발서 구축 |
| 2026-10-25 | GC-D-26 추가(Docker Desktop 로컬 기준, 사용자 지정). 06장 GC-06-001·007 수용 기준에 반영 | W0 착수 준비 |
| 2026-10-25 | 교차 검토 반영: GC-D-22~25, O-09~O-15, GC-F-305, 하위 경로 4개, `oauth_states`·`saved_views`, 작업 GC-06-048(랜딩·약관)·049(18슬롯), ID 형식 GC-DF·gc_ RPC | 기획서·개발서 구축 |
