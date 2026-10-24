# PRD.md — NOMAD AI Factory

> **버전:** v3.0.0 | **작성일:** 2026-06-16 | **작성자:** 리치노마드 김대영  
> **포지셔닝:** 아마존 구매대행 AI 자동화 SaaS — 멀티테넌트 · 구독형 · 7채널+SNS 배포  
> **참조 문서:** @MARKET_IMAGE_SPEC.md · @MARKET_REGISTER_FORM.md · @DETAIL_PAGE_SYSTEM.md · @NOMAD_AI_FACTORY_MASTER_SPEC.md

---

## 1. 제품 한 문장 정의

아마존·국내도매 소싱 → AI 상세페이지(이미지 10~15장) · 쇼츠 · 카드뉴스 자동생성 → **쿠팡·지마켓·옥션·11번가·스마트스토어·롯데온·카페24·아임웹 + 유튜브·인스타·페이스북·쓰레드·틱톡** 동시 배포를 개인 대시보드에서 처리하는 **멀티테넌트 구독 SaaS**

---

## 2. 타깃 유저 — Jobs To Be Done

| 세그먼트 | 진짜 고용 이유 (JTBD) | 핵심 불안 | 성공 기준 |
|---------|-------------------|---------|---------|
| 시간 절약형 부업 셀러 | 하루 2시간 안에 상품 5개 올리고 싶다 | 상세페이지 만드는 게 너무 오래 걸린다 | 클릭 10번 → 상세페이지 완성 |
| 매출 확장형 중급 셀러 | 같은 상품을 6개 마켓에 동시에 올리고 싶다 | 마켓마다 형식이 달라 실수가 난다 | 1회 입력 → 전 마켓 자동 배포 |
| 건기식 전문 소싱러 | 아마존 건기식을 법적 리스크 없이 팔고 싶다 | 금지어 위반으로 상품이 내려간다 | 금지어 자동 필터 + 법적 고지 자동화 |
| SNS 커머스 셀러 | 상품 영상을 자동으로 만들어 틱톡에 올리고 싶다 | 영상 편집을 못 한다 | 상품 선택 → 쇼츠 2분 완성 |
| 에이전시 운영자 | 10개 거래처 상품을 동시에 관리하고 싶다 | 거래처별 계정 분리가 안 된다 | 계정별 독립 대시보드 + 권한 분리 |

---

## 3. 멀티테넌트 SaaS 아키텍처

```
단일 Next.js 16 + Supabase 인스턴스
├── 데이터 격리: RLS(user_id 기준 완전 격리)
├── 개인 대시보드: 각 유저 = 독립 대시보드
├── 테넌트 식별: JWT sub(user_id) → 전체 쿼리 자동 필터
└── 슈퍼어드민: role='SUPER_ADMIN' → 전체 테넌트 통합 뷰

유저 플로우:
랜딩(소개/플랜) → 회원가입 → 플랜 선택·결제(TossPayments)
→ [개인 대시보드]
    ├── 설정: 마켓 API 등록 (쿠팡/스마트스토어/지마켓/옥션/11번가/롯데온/카페24/아임웹)
    ├── 설정: SNS 계정 연동 (유튜브/인스타/페이스북/쓰레드/틱톡)
    └── 설정: 자동화 엔진 선택 (React Flow / n8n / Make)
→ 소싱 → 상품DB 저장 → 상세페이지·쇼츠·카드뉴스 생성 → 배포
```

### 4단계 역할
| role | 접근 범위 |
|------|---------|
| SUPER_ADMIN | 전체 테넌트 + 슈퍼어드민 패널 |
| PRO_USER | 자신의 대시보드 + 자동화 캔버스 |
| BASIC_USER | 자신의 대시보드 (자동화 제한) |
| TEAM_MEMBER | 팀장 테넌트 내 제한 접근 (추후) |

---

## 4. 전체 메뉴 구조 (IA)

```
NOMAD AI Factory
│
├── 🏠 대시보드
│   ├── KPI 카드 (오늘 등록 수 / 처리중 주문 / 이번달 수익 / 활성 계정)
│   ├── 실시간 환율 위젯 (USD · CAD · EUR · JPY · CNY / KRW)
│   ├── 쿠팡 카테고리별 TOP100
│   ├── 네이버 스마트스토어 카테고리별 TOP100
│   └── AI 시즌 상품 추천
│
├── 🔍 상품 검색
│   ├── 아마존 소싱 (URL 직접 입력 / 키워드 검색)
│   ├── 아마존 카테고리 TOP100 브라우저
│   ├── 트렌드 소싱 추천 (판매지수 기반)
│   └── 소싱 히스토리 / 즐겨찾기
│
├── 📦 상품 관리
│   ├── 상품 등록
│   │   ├── 아마존 URL (→ 상품DB 저장만, 상세페이지 미자동생성)
│   │   ├── 엑셀 대량 업로드 카드 (5종 지원)
│   │   │   ├── 오너클랜 .xlsx
│   │   │   ├── 도매꾹 .xlsx/.xls
│   │   │   ├── 온채널 .xls/.xlsx
│   │   │   ├── 아마존 CSV
│   │   │   └── 자유 양식 (컬럼 매핑 UI)
│   │   └── 수동 직접 입력
│   ├── 상품 목록 (전체/카테고리별/소싱처별/상태별)
│   │   ├── 체크박스 다중 선택
│   │   ├── [상세페이지 생성] 버튼 → 3-Mode 모달 진입
│   │   └── 상품별 상세페이지 상태 뱃지 (미생성/생성중/완료/오류)
│   ├── 상품 편집
│   ├── 재고 현황
│   └── 금지어 필터 관리
│
├── 🎨 상세페이지
│   ├── 상세페이지 목록 (상태별 필터)
│   │   └── 체크박스 선택 → [상세페이지 생성] 버튼
│   ├── 상세페이지 생성 — 3-Mode 탭 모달
│   │   ├── TAB 1: 개별 생성 (단일 상품)
│   │   │   ├── [하위탭] 기본설정: AI 상품명·설명·이미지·금지어·GEO ON/OFF
│   │   │   ├── [하위탭] 이미지슬롯: T-1~T-5 / D-1~D-10 / L-1~L-3
│   │   │   ├── [하위탭] 유형 선택: 설득형·리뷰형·감성형·정보형·스토리·비교·프로모션·세트
│   │   │   ├── [하위탭] 템플릿: 건강식품형·해외배송형·심플형
│   │   │   └── [하위탭] 고급설정: AI모델·번역엔진·이미지엔진
│   │   ├── TAB 2: 이미지로 생성 (1개 이상)
│   │   │   ├── [하위탭] 이미지소스: AI자동생성 / 내 이미지 업로드 / 기존 재사용
│   │   │   ├── [하위탭] 슬롯 매핑: 업로드 이미지 → 슬롯 자동배정
│   │   │   └── [하위탭] 출력설정: 마켓별 자동변환 선택
│   │   └── TAB 3: 다중 등록 생성 (2개 이상)
│   │       ├── [하위탭] 일괄옵션: 공통 유형·템플릿·슬롯·옵션
│   │       ├── [하위탭] 상품별 개별 설정: 행 클릭 인라인 편집
│   │       └── [하위탭] 실행순서: 드래그로 큐 조정
│   ├── 생성 Progress Bar 큐
│   │   ├── 단일: 단계별 SSE 스트림 (8단계)
│   │   └── 다중: 순차 큐 (동시처리 프리1·스타터1·프로2·엔터5)
│   ├── 상세페이지 에디터 (생성 후 수동 편집)
│   └── 상세페이지 통계
│
├── 🃏 카드뉴스
│   ├── 카드뉴스 목록
│   ├── 카드뉴스 생성
│   │   ├── 상품DB 선택 → 카드 수(5/8/10장) · 스타일 선택
│   │   ├── AI 텍스트 자동생성 + 이미지 합성
│   │   └── 슬라이드 에디터 (개별 수정)
│   └── SNS 배포 (인스타·페이스북·쓰레드)
│
├── 📊 판매 관리
│   ├── 주문 현황 (마켓별 통합)
│   ├── 정산 현황
│   ├── 반품/CS 관리
│   └── 판매 통계 (채널별·상품별·기간별)
│
├── 🚀 마켓 배포
│   ├── 이커머스 채널 (쿠팡·스마트스토어·지마켓·옥션·11번가·롯데온·카페24·아임웹)
│   ├── 다계정 선택 (슬롯별)
│   ├── 마켓별 상품등록 폼 (→ @MARKET_REGISTER_FORM.md 기준)
│   │   └── 6-Step Wizard: 상품정보→가격/옵션→배송정책→반품정책→고시정보→검토/배포
│   ├── 일괄 전송 + 실시간 Progress Bar
│   └── 등록 이력 / 실패 로그
│
├── 🎬 쇼츠 생성
│   ├── 쇼츠 목록
│   ├── 쇼츠 생성 (상품DB 선택 → 15초/30초/50초 → TTS·음원 설정)
│   ├── SNS 배포
│   │   ├── 유튜브 쇼츠 (YouTube Data API v3)
│   │   ├── 인스타그램 릴스 (Meta Graph API)
│   │   ├── 페이스북 릴스 (Meta Graph API)
│   │   ├── 쓰레드 (Threads API)
│   │   └── 틱톡 (TikTok Content Posting API)
│   └── 배포 이력 & 성과 통계
│
├── 🤖 자동화
│   ├── Mode A: 내장 React Flow 캔버스
│   │   └── 노드 직접 연결해야만 실행 활성화 (미연결 = 실행 불가)
│   ├── Mode B: n8n Webhook 연동
│   └── Mode C: Make (Integromat) Webhook 연동
│
├── ⚙️ 설정
│   ├── 이커머스 API (쿠팡Wing·스마트스토어·ESM+·11번가·롯데ON)
│   ├── 자체몰 API (카페24·아임웹)
│   ├── SNS 계정 연동 (유튜브·인스타·페이스북·쓰레드·틱톡)
│   ├── 자동화 연동 (n8n URL+Key / Make Key+TeamID)
│   ├── AI 모델 설정 (OpenRouter)
│   ├── 번역 설정 (DeepL / GPT-4o)
│   ├── 해외배송 템플릿 ON/OFF
│   ├── 금지어 사전 관리
│   └── 음원 라이브러리 (Suno 업로드 · 기본 풀)
│
└── 👤 계정
    ├── 내 정보
    ├── 플랜 & 결제 (TossPayments 구독)
    ├── 다계정 슬롯 관리
    ├── API Key 발급 (외부 자동화용)
    └── 사용 내역
```

---

## 5. 상품 카테고리 체계

### 주력 (건강식품)
```
건강식품
├── 비타민/미네랄 (종합비타민·비타민C·D·B·오메가3·아연·마그네슘)
├── 단백질/운동 (Whey·Plant·크레아틴·BCAA)
├── 장건강 (프로바이오틱스·프리바이오틱스)
├── 면역/항산화 (루테인·CoQ10·글루타치온)
├── 슬리밍 (가르시니아·녹차추출물·CLA)
├── 관절/뼈 (글루코사민·콜라겐·칼슘)
└── 수면/스트레스 (멜라토닌·마그네슘글리시네이트·아시와간다)
```

### 확장 카테고리
뷰티/퍼스널케어 · 가전/디지털 · 홈&리빙 · 반려동물 · 스포츠/아웃도어 · 유아/어린이 · 식품 · 패션/액세서리

---

## 6. 핵심 기능 상세

### 6.1 소싱 → 상품DB 플로우

```
[아마존 URL 입력] or [엑셀 업로드 (5종)]
        ↓
[상품 데이터 수집 → 상품DB(products) 저장만]
  ※ 상세페이지 자동생성 없음. status = 'draft'
        ↓
[상품 목록에서 체크박스 다중 선택]
        ↓
[상세페이지 생성] 버튼 클릭 → 3-Mode 모달
        ↓
유형 선택 (AI 자동추천 or 수동) → 슬롯 설정 → 생성 시작
```

### 6.2 상세페이지 유형 8가지 (→ @DETAIL_PAGE_SYSTEM.md 참조)

| 유형 | 핵심 설득 방식 | 주력 카테고리 |
|-----|-------------|------------|
| 설득형 | 논리·수치·근거로 증명 | 건강식품·기능성 |
| 리뷰·사회적증거형 | 실 구매자가 이미 검증 | 뷰티·건기식 |
| 감성·라이프스타일형 | 이 제품으로 이런 삶 | MZ·패션·홈 |
| 정보·교육형 | 제대로 알고 사라 | 건기식·전자·의료 |
| 스토리텔링형 | 만든 이유와 여정 | 프리미엄·스타트업 |
| 비교·차별화형 | 다른 제품과의 차이 | 경쟁 치열 카테고리 |
| 프로모션·특가형 | 지금 당장 사야 할 이유 | 세일 시즌 |
| 세트·번들형 | 같이 사면 더 가치 있다 | 세트·선물 |

### 6.3 이미지 슬롯 시스템 (→ @MARKET_IMAGE_SPEC.md 참조)

```
10장 기본 구성: T-1·T-2 / D-1·D-2·D-3·D-5·D-7 / L-1·L-2·L-3
15장 풀패키지:  T-1·T-2·T-3 / D-1~D-10(선택) / L-1·L-2·L-3

이미지 생성 엔진 선택:
  AI씬 슬롯 (D-1·D-3·D-4·D-6·T-2) → DALL-E 3 / Flux Pro
  인포그래픽 슬롯 (D-2·D-5·D-7·D-8·D-9·D-10·L-1·L-2·L-3) → Puppeteer HTML 렌더링
  원본 처리 (T-1·T-3) → Remove.bg + Sharp.js

한글 텍스트 처리:
  ※ DALL-E에 한글 직접 생성 요청 금지 (깨짐 발생)
  → AI가 씬/배경만 생성 + Sharp.js로 한글 카피 후합성
```

### 6.4 자동화 파이프라인 실행 순서

```
PHASE 1 (5~10초):   아마존 데이터 수집 → DeepL/GPT-4o 번역
PHASE 2 (8~15초):   GPT-4o 마스터 스토리라인 JSON 생성 (슬롯별 장면·카피·프롬프트)
PHASE 3 (2~5초):    슬롯별 이미지 프롬프트 정제
PHASE 4A (8~15초):  T-1 누끼+흰배경 / T-2 라이프스타일 합성 (병렬)
PHASE 4B (40~90초): D슬롯 AI이미지 생성 + 인포그래픽 렌더링 (순차)
PHASE 5 (5~10초):   한글 카피 텍스트 Sharp.js 합성
PHASE 6 (3~5초):    품질 검증 + 금지어 검사
PHASE 7 (5~10초):   마켓별 이미지 자동변환 (→ @MARKET_IMAGE_SPEC.md 기준)
PHASE 8 (3~5초):    Supabase Storage 저장 + detail_pages 조립

총 소요: 10장 약 80~165초 / 15장 약 120~240초
```

### 6.5 마켓 배포 폼 (→ @MARKET_REGISTER_FORM.md 참조)

```
6-Step Wizard:
  Step 1: 기본 상품정보 (상품명 AI 3안·카테고리·브랜드·원산지·태그)
  Step 2: 가격/옵션 (소싱가→환율환산→판매가 자동계산·재고·옵션)
  Step 3: 배송정책 [마켓별 탭] (배송비·출고일·택배사·해외배송설정)
  Step 4: 반품정책 [마켓별 탭] (반품비·교환정책·쿠팡 반품비 상한가 자동계산)
  Step 5: 고시정보 (카테고리별 AI 자동완성·건기식 필수고지 자동삽입)
  Step 6: 완성도 % 검토 + 배포 실행

지원 채널: 쿠팡·스마트스토어·지마켓·옥션·11번가·롯데온·카페24·아임웹
카페24 추가: HS코드·해외통관·공급가·과세구분·SEO 완전 지원
아임웹 추가: 배송템플릿제·개인통관고유부호·연관상품·SKU
```

### 6.6 자동화 3-Mode

| Mode | 대상 | 설정 난이도 | 외부 서비스 연동 |
|------|------|-----------|--------------|
| A: React Flow | 플랫폼 내 비주얼 | ⭐ | 제한적 |
| B: n8n | 개발자·자체 서버 | ⭐⭐⭐ | 400+ |
| C: Make | 비개발자·클라우드 | ⭐⭐ | 1,500+ |

**공통 원칙:** 사용자가 노드를 직접 연결해야만 실행 활성화. 미연결 상태 백그라운드 실행 절대 금지.

### 6.7 SNS 5채널 배포

| 채널 | API | 콘텐츠 | 다계정 |
|-----|-----|--------|------|
| 유튜브 | YouTube Data API v3 | 쇼츠 영상 | ✅ |
| 인스타그램 | Meta Graph API | 릴스·카드뉴스 캐러셀 | ✅ |
| 페이스북 | Meta Graph API | 릴스·앨범 | ✅ |
| 쓰레드 | Threads API | 영상·이미지 스레드 | ✅ |
| 틱톡 | TikTok Content Posting API | 영상 | ✅ |

---

## 7. 결제 플랜

| 플랜 | 월 구독료 | 상품DB | 상세페이지 | 마켓채널 | 다계정 | 쇼츠 | 카드뉴스 | 자동화 | 동시생성 |
|-----|---------|------|---------|--------|------|-----|--------|------|------|
| 프리 | 무료 | 30개 | 10개 | 1개 | 1개 | — | — | Mode A 기본 | 1 |
| 스타터 | 29,000원 | 300개 | 100개 | 3개 | 3개 | 10개 | 20개 | Mode A 전체 | 1 |
| 프로 | 69,000원 | 2,000개 | 500개 | 전체 | 10개 | 50개 | 100개 | A+B+C | 2 |
| 엔터 | 149,000원 | 무제한 | 무제한 | 전체 | 무제한 | 무제한 | 무제한 | A+B+C | 5 |

**연간 할인:** 월 × 10개월 (2개월 무료)  
**Add-on:** 마켓채널 5,000원/슬롯/월 · 다계정 8,000원/계정/월 · 쇼츠 990원/개 · 카드뉴스 490원/세트

---

## 8. 핵심 DB 스키마

```sql
-- 멀티테넌트 기반 (RLS 필수)
users (id UUID, email, role, plan, created_at)
subscriptions (id, user_id, plan_type, status, period_start, period_end, toss_subscription_id)

-- 다계정
market_accounts (id, user_id, market_type, account_name, api_key_enc, slot_no, is_active)
sns_accounts (id, user_id, platform, account_name, access_token_enc, refresh_token_enc, token_expires_at)

-- 자동화
automation_configs (id, user_id, mode, n8n_url, n8n_api_key_enc, make_api_key_enc, make_team_id, webhook_url)

-- 상품
products (id, user_id, source_type, source_url, asin, title_original, title_ko, title_optimized,
          description_ko, images JSONB, price_source, price_sell, category_id,
          is_health_food, status, banned_words_found TEXT[], created_at)

-- 상세페이지
detail_pages (id, product_id, user_id, page_type, html_content, images JSONB,
              template_id, include_shipping_template, include_health_disclaimer,
              geo_jsonld JSONB, status, created_at)

-- 생성 큐
detail_page_generation_jobs (id, user_id, product_id, mode, sub_options JSONB,
                              status, progress INT, current_step, queue_order,
                              started_at, finished_at, error, detail_page_id)

-- 카드뉴스
card_news (id, product_id, user_id, title, style, card_count, cards JSONB, status)

-- 쇼츠
shorts (id, product_id, user_id, duration_type, tts_voice, music_id, video_url, status)

-- SNS 배포 이력
sns_uploads (id, user_id, content_type, content_id, sns_account_id, platform,
             status, platform_post_id, description_text, scheduled_at, uploaded_at, error_msg)

-- 마켓 배포 이력
market_uploads (id, product_id, market_account_id, status, market_product_id, uploaded_at, error_msg)

-- 마켓 배포 폼 데이터
market_register_forms (id, product_id, user_id, market_type, form_data JSONB,
                        shipping_template_id, completeness_pct INT, status)

-- 배송 정책 템플릿
shipping_templates (id, user_id, template_name, template_type,
                    shipping_fee_by_market JSONB, return_policy JSONB, is_default)

-- 환율 캐시
exchange_rates (id, currency_pair, rate, change_amount, change_percent, direction, fetched_at)

-- 카테고리
categories (id, parent_id, name_ko, name_en, is_health_food, level)

-- 금지어
banned_words (id, word, category, replacement, created_at)

-- RLS (전 테이블 공통)
-- ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "user_isolation" ON [table] USING (user_id = auth.uid());
```

---

## 9. 개발 로드맵 (18단계)

| Phase | 단계 | 기능 | 우선순위 |
|-------|------|------|---------|
| 1 | 1 | 멀티테넌트 DB + RLS 설계 | 🔴 |
| 1 | 2 | Supabase Auth + 플랜별 권한 | 🔴 |
| 1 | 3 | TossPayments 구독 결제 | 🔴 |
| 1 | 4 | 통합 설정창 (마켓API·SNS·자동화·음원) | 🔴 |
| 2 | 5 | 대시보드 (KPI + 5개 환율 + TOP100) | 🟠 |
| 2 | 6 | 소싱 (아마존 URL + 엑셀 5종) | 🟠 |
| 3 | 7 | AI 상품명 최적화 + 금지어 필터 | 🟡 |
| 3 | 8 | 이미지 처리 (누끼·배경합성·10~15장) | 🟡 |
| 3 | 9 | 상세페이지 3-Mode 생성 + 큐 시스템 | 🟡 |
| 4 | 10 | 카드뉴스 생성 | 🟡 |
| 4 | 11 | 쇼츠 영상 렌더링 (15/30/50초) | 🟡 |
| 4 | 12 | SNS 5채널 자동 업로드 | 🟡 |
| 5 | 13 | 마켓 6-Step 배포 폼 + Progress Bar | 🟢 |
| 5 | 14 | 판매 관리 (주문·정산·CS) | 🟢 |
| 6 | 15 | Mode A: React Flow 자동화 | 🟢 |
| 6 | 16 | Mode B: n8n Webhook | 🔵 |
| 6 | 17 | Mode C: Make Webhook | 🔵 |
| 7 | 18 | Vector DB 임베딩 + GEO JSON-LD | 🔵 |
