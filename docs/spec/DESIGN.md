# DESIGN.md — NOMAD AI Factory 디자인 시스템

> **버전:** v3.0.0 | **기준:** Next.js 16 + Tailwind v4 + Shadcn UI  
> **스킬 적용:** /frontend-design · /design-system · /ux-copy · /design-handoff · /accessibility-review

---

## 1. 디자인 철학 & 시그니처

**"데이터가 살아 움직이는 운영 대시보드"**

모든 수치(환율·KPI·진행률)는 `JetBrains Mono`로 표시해 숫자 자체가 타이포그래피의 주역이 된다. 다크 사이드바(`#0F1117`)와 라이트 콘텐츠의 대비가 "공장에서 일하는 느낌"을 만든다. Progress Bar의 브랜드 그라디언트 shimmer 애니메이션은 실제로 무언가 생산되고 있다는 감각을 준다.

---

## 2. 디자인 토큰 (CSS Variables)

```css
/* ── Brand ── */
--color-brand:        #00C9A7;
--color-brand-hover:  #007A64;   /* WCAG AA 통과: 흰 텍스트 비율 4.6:1 */
--color-brand-active: #006B56;
--color-brand-tint:   #E6FBF7;
--color-brand-subtle: #F0FDF9;

--color-denim:        #2563EB;
--color-denim-hover:  #1D4ED8;
--color-denim-tint:   #EFF6FF;

/* ── Semantic ── */
--color-success:      #10B981;  --color-success-tint: #DCFCE7;
--color-warning:      #F59E0B;  --color-warning-tint: #FEF9C3;
--color-error:        #EF4444;  --color-error-tint:   #FEE2E2;
--color-info:         #3B82F6;  --color-info-tint:    #EFF6FF;

/* ── Neutral ── */
--color-sidebar:      #0F1117;
--color-sidebar-hover: rgba(255,255,255,0.06);
--color-sidebar-active: rgba(0,201,167,0.12);
--color-bg-base:      #F8FAFC;
--color-bg-surface:   #FFFFFF;

/* ── Border ── */
--color-border-light: #F1F5F9;
--color-border-base:  #E2E8F0;
--color-border-strong:#CBD5E1;
--color-border-brand: #00C9A7;
--color-border-error: #EF4444;

/* ── Text ── */
--color-text-primary:   #0F172A;
--color-text-secondary: #475569;
--color-text-tertiary:  #94A3B8;
--color-text-placeholder: #94A3B8;  /* ⚠️ #CBD5E1은 WCAG 실패 → 반드시 이 값 사용 */
--color-text-inverse:   #FFFFFF;
--color-text-brand:     #00C9A7;
--color-text-link:      #2563EB;

/* ── Typography ── */
--font-display: 'Bebas Neue', sans-serif;   /* KPI 숫자·헤드라인 */
--font-body:    'Noto Sans KR', sans-serif; /* 한국어 본문 */
--font-mono:    'JetBrains Mono', monospace;/* 환율·금액·ASIN·API키 */

/* ── Type Scale ── */
--text-xs:   11px; --lh-xs:  1.4;
--text-sm:   13px; --lh-sm:  1.5;
--text-base: 14px; --lh-base:1.6;
--text-md:   16px; --lh-md:  1.5;
--text-lg:   20px; --lh-lg:  1.4;
--text-xl:   24px; --lh-xl:  1.3;
--text-2xl:  32px; --lh-2xl: 1.2;  /* Bebas Neue KPI */
--text-hero: 56px; --lh-hero:1.0;

/* ── Spacing (4px base) ── */
--space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
--space-5:20px; --space-6:24px; --space-8:32px; --space-10:40px;
--space-12:48px; --space-16:64px;

/* ── Layout ── */
--sidebar-width: 240px; --topbar-height: 64px; --content-max: 1440px;

/* ── Radius ── */
--radius-sm:4px; --radius-md:6px; --radius-lg:8px;
--radius-xl:12px; --radius-2xl:16px; --radius-full:9999px;

/* ── Shadow ── */
--shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
--shadow-md: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.04);
--shadow-brand: 0 0 0 3px rgba(0,201,167,.20);
--shadow-error:  0 0 0 3px rgba(239,68,68,.15);

/* ── Motion ── */
--dur-fast:100ms; --dur-base:150ms; --dur-slow:250ms; --dur-slower:400ms;
--ease: cubic-bezier(.4,0,.2,1);
--ease-spring: cubic-bezier(.34,1.56,.64,1);
```

---

## 3. 컴포넌트 시스템

### Button

```
Variants:  primary · secondary · ghost · danger · outline
Sizes:     xs(28px) · sm(32px) · md(36px) · lg(44px) · xl(52px)
States:    default · hover(-10% lightness) · active(scale 0.99) · focus(--shadow-brand) · disabled(opacity 0.4) · loading(Loader2 스피너)

⚠️ 핵심: primary 버튼 배경은 --color-brand-hover(#007A64) 사용
   (--color-brand #00C9A7 위 흰 텍스트는 WCAG AA 실패)

동사로 시작: "생성 시작" "저장하기" "배포하기" (O)
모호한 레이블: "확인" "OK" (X)

접근성:
  role="button" / keyboard: Enter·Space
  disabled → aria-disabled="true" tabIndex=-1
  loading  → aria-busy="true" aria-label="처리 중"
  icon only → aria-label 필수
```

### Input

```
Variants:  default · search(돋보기 아이콘) · password(눈 토글) · mono(JetBrains Mono, ASIN·API키용)

States:
  default:  border --color-border-base
  hover:    border --color-border-strong
  focus:    border --color-brand + --shadow-brand
  error:    border --color-error + --shadow-error + bg --color-error-tint
  disabled: border --color-border-light + bg --color-bg-base

검증 규칙:
  포커스 중 → 검증 안 함
  블러 시   → 검증 실행
  서버 오류 → 제출 후 표시
  글자수 카운터: "38/100" 형식

접근성:
  label 연결 필수 (htmlFor or aria-labelledby)
  error → aria-invalid="true" + aria-describedby → 에러 메시지
  필수  → aria-required="true" + 시각적 * 표시
```

### Badge / Status

```
상품 상태 variants:
  draft      → bg #F1F5F9  text #64748B  아이콘 Clock    "미생성"
  generating → bg --color-info-tint  text --color-info  아이콘 Loader2(spin)  "생성중"
  queued     → bg #FEF9C3  text #92400E  아이콘 Clock    "대기중"
  ready      → bg --color-success-tint  text --color-success  아이콘 CheckCircle2  "완료"
  deployed   → bg #EDE9FE  text #5B21B6  아이콘 Upload   "배포완료"
  error      → bg --color-error-tint  text #991B1B  아이콘 XCircle  "오류"

크기: xs(10px·18px) · sm(11px·22px) · md(12px·24px)
generating 상태: Loader2 360deg 1s linear infinite
```

### ProgressBar

```
Variants:
  brand(실행중): linear-gradient(90deg, #00C9A7, #2563EB) + shimmer
  success:       #10B981 (고정)
  error:         #EF4444 (고정)
  idle:          #E2E8F0 (대기)

Shimmer 애니메이션:
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  background-size: 200% 100%;
  animation: shimmer 1.8s linear infinite;

트랙: height 6px · border-radius 9999px · bg #E2E8F0
접근성: role="progressbar" aria-valuenow={value} aria-valuemin=0 aria-valuemax=100
prefers-reduced-motion: animation none 처리 필수

@media (prefers-reduced-motion: reduce) {
  .shimmer, .spin { animation: none; transition: none; }
}
```

### DataTable (상품 목록 핵심)

```
행 상태:
  default:     bg transparent     border-b #F1F5F9
  hover:       bg #F8FAFC         (transition 100ms)
  selected:    bg #E6FBF7         border-l 3px solid #00C9A7
  generating:  border-l 3px solid --color-info

열 정의:
  이미지:      width 64px
  상품명/ASIN: flex-1, 상품명 text-sm 500 2줄클램프, ASIN mono text-xs tertiary
  상태뱃지:    width 120px, Badge + inline ProgressBar(폭60px·높이4px) generating 시
  액션:        width 80px, 편집·배포 버튼

5,000개+ → react-window 가상 스크롤 필수

빈 상태 (Empty State):
  아이콘: PackageOpen 48px --color-text-tertiary
  제목:   "아직 등록된 상품이 없어요"  font-size 16px font-weight 600
  설명:   "아마존 URL을 입력하거나 엑셀 파일을 업로드해서 첫 상품을 추가하세요."  font-size 14px --color-text-secondary max-width 360px
  버튼:   [아마존 URL 소싱] [엑셀 파일 업로드] — primary · secondary
```

---

## 4. 레이아웃 시스템

```
전체 구조:
┌──────────────────────────────────────────────────────┐
│  TopBar (64px) — 로고·검색·환율2개·알림·계정        │
├────────────┬─────────────────────────────────────────┤
│            │                                          │
│  Sidebar   │         Main Content Area                │
│  (240px)   │  max-width 1440px · padding 24px        │
│  bg #0F1117│                                          │
│            │  [Page Header: 제목+브레드크럼+액션]     │
│ [대시보드] │                                          │
│ [상품검색] │  [Content Body: 카드·테이블·폼]         │
│ [상품관리] │                                          │
│  └상품등록 │                                          │
│ [상세페이지│                                          │
│ [카드뉴스] │                                          │
│ [판매관리] │                                          │
│ [마켓배포] │                                          │
│ [쇼츠생성] │                                          │
│ [자동화]   │                                          │
│ ────────── │                                          │
│ [설정]     │                                          │
│ [계정]     │                                          │
└────────────┴─────────────────────────────────────────┘

사이드바 메뉴 아이템:
  기본:    padding 9px 12px · font-size 13px · color #94A3B8
  hover:   bg rgba(255,255,255,.06) · color #E2E8F0
  active:  bg rgba(0,201,167,.12) · color #00C9A7
  서브메뉴: padding-left 34px · font-size 12.5px

반응형:
  >1280px: 240px 풀 사이드바
  1024-1280px: 이미지·ASIN 컬럼 숨김
  <768px: 사이드바 숨김 + 하단 탭바 전환 · 카드 레이아웃
```

---

## 5. 화면별 타이포그래피 계층

```
대시보드 KPI 카드:
  수치: Bebas Neue 40px #0F172A
  레이블: Noto Sans KR 11px 500 #64748B
  변화율: JetBrains Mono 12px, 색상 토큰

환율 위젯:
  통화 코드: Bebas Neue 13px #94A3B8
  환율 숫자: JetBrains Mono 18px 600 #0F172A
  등락: JetBrains Mono 12px, 색상 토큰
  금액: 세 자리 콤마 필수 (₩1,347.20 형식)

상품 목록 테이블:
  상품명: Noto Sans KR 14px 500 #0F172A (2줄 클램프)
  ASIN: JetBrains Mono 11px #94A3B8
  가격: JetBrains Mono 13px 600 #0F172A · 세 자리 콤마

Progress Bar:
  % 수치: JetBrains Mono 13px 500 #475569
  단계 텍스트: Noto Sans KR 12px #64748B

플랜 가격 표기:
  숫자: JetBrains Mono 600
  단위: Noto Sans KR 13px #64748B
  형식: "29,000원/월" "149,000원/월" (세 자리 콤마 필수)
```

---

## 6. 대시보드 레이아웃

```
KPI 카드 4개 (상단):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 오늘 등록    │ │ 처리중 주문  │ │ 이번달 수익  │ │ 활성 계정    │
│ 128개        │ │ 47건         │ │ ₩1,284,000  │ │ 6개          │
│ +23 어제대비 │ │ 쿠팡 12 외   │ │ +8.3% ▲     │ │ 3마켓        │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
카드: bg #FFF · border 1px #E2E8F0 · radius 8px · padding 20px · shadow-sm

환율 위젯 (5개 통화):
┌──────────────────────────────────────────────────────┐
│ 실시간 환율              갱신: 09:30 KST  [↻]       │
│ USD 🇺🇸  ₩1,347.20   ▲ +3.40   +0.25%              │
│ CAD 🇨🇦    ₩982.10   ─  -0.10   -0.01%              │
│ EUR 🇪🇺  ₩1,463.50   ▼ -5.20   -0.35%              │
│ JPY 🇯🇵      ₩8.92   ▲ +0.01   +0.12% (100엔 기준) │
│ CNY 🇨🇳    ₩185.70   ▲ +0.30   +0.16%              │
└──────────────────────────────────────────────────────┘
▲ → #10B981 / ▼ → #EF4444 / ─ → #94A3B8
갱신 주기: 30분 캐싱

하단 2열:
┌─────────────────────────┐  ┌─────────────────────────┐
│ 쿠팡 TOP10 (건강식품)   │  │ 네이버 급상승 트렌드     │
│ 1. 종합비타민 ─── 판매↑  │  │ ① 마그네슘 글리시네이트  │
│ ...          [더보기 →] │  │ ...        [소싱하기 →] │
└─────────────────────────┘  └─────────────────────────┘
```

---

## 7. 엑셀 업로드 카드 UI

```
┌──────────────────────────────────────────────────────────────┐
│  📥 대량 상품 등록                                           │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────┐│
│  │🏪 오너클랜│ │📦 도매꾹 │ │🛒 온채널 │ │🌐 아마존 │ │📄직│ │
│  │  [선택●] │ │ [선택○]  │ │ [선택○]  │ │  CSV [○] │ │접[○││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────┘│
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   📂 파일을 드래그하거나 클릭하여 선택                 │  │
│  │   오너클랜 .xlsx 지원 / 최대 5,000행 / 50MB           │  │
│  └────────────────────────────────────────────────────────┘  │
│  [양식 다운로드 ↓]                                            │
│                                                               │
│  선택: 2 / 전체: 247  ✅ 검증 통과                           │
│  [선택 항목 DB 등록 →]                                        │
└──────────────────────────────────────────────────────────────┘
파일종류 버튼: 선택 border 2px #00C9A7 bg #E6FBF7
드롭존: border 1.5px dashed #CBD5E1 · 드래그오버: border #00C9A7 bg #E6FBF7
오류 행: bg #FEF2F2 (필수컬럼 누락)
```

---

## 8. 상세페이지 생성 3-Mode 탭 모달

```
모달: width 720px(데스크탑)·100vw-32px(모바일) · max-height 80vh
      bg #FFF · radius-2xl · shadow-xl · overlay rgba(15,17,23,0.6)

탭 활성화 조건:
  0개 선택: 전체 disabled
  1개 선택: 개별생성(●) · 이미지로생성 · 다중등록 활성
  2개+: 개별생성 disabled(회색) · 이미지로생성 · 다중등록(●기본선택)

탭 스타일:
  비활성: border-bottom 2px transparent · color #94A3B8 · bg #F8FAFC
  활성:   border-bottom 2px #00C9A7 · color #00C9A7 · bg #FFFFFF
  조건미충족: opacity 0.4 · cursor not-allowed · 툴팁 표시

이미지슬롯 하위탭 그리드:
  슬롯 카드: 80×80px · radius 8px
  선택됨:    border 2px #00C9A7 · bg #E6FBF7 · ✓ 우상단
  비선택:    border 1.5px #E2E8F0 · bg #FFFFFF
  자동ON:    border 1.5px dashed #8B5CF6 · bg #F5F3FF · "자동" 레이블
  생성중:    border #3B82F6 animated pulse

[생성 시작] 버튼 disabled 조건:
  - 선택 상품 없음
  - 필수 슬롯(T-1·D-1·L-3) 하나도 미선택
  - 이미지로생성인데 소스 미선택

텍스트:
  1개: "생성 시작"
  N개: "생성 시작 ▶ N개 순차 처리"

Keyboard:
  Escape: 닫기(생성중 경고)  Tab: 탭 이동
  Arrow L/R: 탭 전환  Space: 슬롯 체크박스 토글
```

---

## 9. Progress Bar 큐 UI

```
단일 생성:
┌──────────────────────────────────────────────────────┐
│  🔄 상세페이지 생성 중                 [백그라운드▼] │
│  비타민C 1000mg 나우푸즈 90캡슐                      │
│  ██████████████░░░░░░  57%   약 1분 20초 남음        │
│  ✅ 상품 데이터 수집   완료  (0:08)                  │
│  ✅ AI 번역           완료  (0:22)                  │
│  🔄 상세설명 생성 중  ████████░░ 80%                │
│  ⏳ 이미지 생성       대기 중                        │
└──────────────────────────────────────────────────────┘

다중 큐:
┌──────────────────────────────────────────────────────┐
│  🔄 다중 생성 — 5개                    [전체취소 ✕] │
│  전체: ████████████░░░░  2/5 완료  (8분 32초 남음)  │
│                                                       │
│  1. 비타민C 1000mg        ████████████████  100% ✅  │
│  2. 오메가3 피쉬오일      ███████████░░░░░   74% 🔄  │
│     이미지 생성 중 D-3 (4/10)                        │
│  3. 프로바이오틱스        ░░░░░░░░░░░░░░░░    0% ⏳  │
│     [↑순서변경] [✕취소]   큐 대기중                  │
└──────────────────────────────────────────────────────┘

Progress Bar CSS:
  track: height 6px · bg #E2E8F0 · radius 9999px
  brand: linear-gradient(90deg,#00C9A7,#2563EB) + shimmer 1.8s
  완료:  #10B981 고정
  실패:  #EF4444 고정
  대기:  #E2E8F0

큐 순서 버튼: [↑][↓] 28×28px · border #E2E8F0 · hover bg #F1F5F9
```

---

## 10. 마켓 배포 UI

```
┌──────────────────────────────────────────────────────┐
│  마켓 배포   선택된 상품: 24개                       │
│                                                       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │☑ 쿠팡  │ │☑ 스마트│ │□ 지마켓│ │□ 11번가│        │
│  └────────┘ └────────┘ └────────┘ └────────┘        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │□ 옥션  │ │□ 롯데온│ │□ 카페24│ │□ 아임웹│        │
│  └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                       │
│  쿠팡: [1호점 ▼]  스마트스토어: [메인계정 ▼]         │
│                                                       │
│  [전송 시작]                                          │
│                                                       │
│  ██████████████░░░░  18/24 (75%)                    │
│  ✅ 쿠팡 1호점 ──────── 12건 성공 / 0건 실패        │
│  🔄 스마트스토어 ──── 처리 중... (6/12)              │
└──────────────────────────────────────────────────────┘
마켓 카드: width 120px · height 80px
선택: border 2px #00C9A7 · bg #E6FBF7
비선택: border 1.5px #E2E8F0
```

---

## 11. UX 카피 시스템

**어조:** 동사로 시작 · 결과 중심 · 해결책 제시 · 수치 구체적 · 존댓말 간결하게

### 빈 상태 (Empty States)
| 화면 | 제목 | 설명 | 주 CTA |
|-----|------|------|-------|
| 상품 목록(첫방문) | 아직 등록된 상품이 없어요 | 아마존 URL을 입력하거나 엑셀 파일을 업로드해서 첫 상품을 추가하세요. | 아마존 URL 소싱 |
| 상세페이지 목록 | 생성된 상세페이지가 없어요 | 상품 목록에서 상품을 선택하고 상세페이지 생성을 시작하세요. | 상품 목록으로 이동 |
| 쇼츠 목록 | 아직 만든 쇼츠가 없어요 | 상품을 선택하면 30초 안에 쇼츠 영상을 자동으로 만들어드려요. | 쇼츠 만들기 |
| 마켓 계정 없음 | 연결된 마켓 계정이 없어요 | 쿠팡·스마트스토어 API를 연결하면 상품을 바로 배포할 수 있어요. | 계정 연결하기 |

### 오류 메시지 (해결책 제시 필수)
| 상황 | 메시지 | 해결책 |
|-----|--------|-------|
| 아마존 URL 파싱 실패 | 상품 정보를 가져올 수 없어요 | URL을 확인하거나 ASIN을 직접 입력해보세요. |
| 엑셀 필수 컬럼 누락 | 파일에 '{컬럼명}' 항목이 없어요 | 양식을 다운로드해서 다시 업로드해보세요. |
| 이미지 생성 실패(슬롯) | D-3 슬롯 이미지 생성에 실패했어요 | 해당 슬롯만 재시도할까요? 다른 슬롯은 저장됐어요. |
| 쿠팡 반품비 초과 | 쿠팡 배포에 실패했어요 | 반품비가 허용 금액을 초과했어요. 자동으로 조정할게요. |
| 플랜 한도 초과 | 이번 달 생성 한도에 도달했어요 | 프로 플랜으로 업그레이드하면 월 500개를 만들 수 있어요. |

### 확인 다이얼로그 (구체적 결과 명시)
| 상황 | 제목 | 내용 | 확인 | 취소 |
|-----|------|------|-----|-----|
| 상품 삭제 | 상품을 삭제할까요? | 비타민C 1000mg과 연결된 상세페이지 1개·쇼츠 2개도 함께 삭제돼요. 되돌릴 수 없어요. | 삭제하기 | 취소 |
| 전체 큐 취소 | 생성을 모두 취소할까요? | 3개가 아직 처리되지 않았어요. 완료된 2개는 저장돼 있어요. | 모두 취소 | 계속 생성 |
| 계정 연결 해제 | 쿠팡 1호점 연결을 해제할까요? | 예약 배포 중인 상품이 있으면 배포가 중단돼요. | 연결 해제 | 취소 |

### 로딩 상태
| 상황 | 텍스트 | 부연 |
|-----|--------|-----|
| 아마존 소싱 | 아마존에서 상품 정보를 가져오는 중이에요 | 약 5~10초 |
| 이미지 D-3 생성 | 라이프스타일 이미지를 만드는 중이에요 (4/10) | DALL-E 3 생성 중 |
| 마켓 배포 | 쿠팡에 상품을 등록하는 중이에요 | 18/24 완료 |

### 성공 메시지 (후속 액션 제안)
| 상황 | 메시지 | 후속 액션 |
|-----|--------|---------|
| 상세페이지 완성 | 상세페이지가 완성됐어요! | [마켓에 바로 배포할까요?] |
| 엑셀 247개 등록 | 247개 상품이 등록됐어요 | [상세페이지 생성하기] |
| 쿠팡 배포 완료 | 쿠팡에 상품이 등록됐어요 | [쿠팡에서 확인하기 ↗] |

---

## 12. 접근성 (WCAG 2.1 AA)

### 색상 대비 검증
| 요소 | 전경 | 배경 | 비율 | 통과 |
|-----|------|------|------|-----|
| 본문 | #0F172A | #FFFFFF | 19.5:1 | ✅ |
| 서브 | #475569 | #FFFFFF | 6.4:1 | ✅ |
| 플레이스홀더 | #94A3B8 | #FFFFFF | 3.1:1 | ✅ |
| brand 버튼 텍스트 | #FFFFFF | #007A64 | 4.6:1 | ✅ |
| 사이드바 활성 | #00C9A7 | #0F1117 | 7.1:1 | ✅ |
| 에러 텍스트 | #991B1B | #FEE2E2 | 5.2:1 | ✅ |

⚠️ **주의:** `--color-brand (#00C9A7)` 위 흰 텍스트 비율 2.6:1 → **버튼 배경 반드시 #007A64 사용**

### 키보드 내비게이션
```
전역: [사이드바 메뉴] → [TopBar 검색] → [메인 콘텐츠]
상품 목록: [+ 등록] → [필터] → [검색] → 테이블행(체크→내용→액션)
모달: Escape=닫기 · Arrow L/R=탭전환 · Space=슬롯선택
큐패널: [전체취소] → 각 항목[취소]·[↑]·[↓]
```

### aria-live 전략
```
생성 진행: role="status" aria-live="polite" (단계 텍스트 업데이트)
배포 완료: role="alert"  aria-live="assertive"
환율 갱신: role="status" aria-live="off" (자동 공지 안 함, 너무 빈번)
```

### 터치 타깃
모든 인터랙티브 요소 최소 44×44px. 아이콘 버튼은 패딩으로 확장.

---

## 13. 아이콘 매핑 (lucide-react)

| 메뉴/기능 | 아이콘 | 크기 |
|---------|--------|-----|
| 대시보드 | LayoutDashboard | 20px |
| 상품 검색 | Search | 20px |
| 상품 관리 | Package | 20px |
| 상품 등록 | PackagePlus | 20px |
| 상세페이지 | FileText | 20px |
| 카드뉴스 | Layers | 20px |
| 판매 관리 | ShoppingCart | 20px |
| 마켓 배포 | Upload | 20px |
| 쇼츠 생성 | Video | 20px |
| 자동화 | Workflow | 20px |
| 설정 | Settings | 20px |
| 계정 | User | 20px |
| 생성중 | Loader2 (spin) | 16px |
| 완료 | CheckCircle2 | 16px |
| 오류 | XCircle | 16px |
| 대기 | Clock | 16px |
| 엑셀 업로드 | FileSpreadsheet | 20px |
| 큐 순서 | ListOrdered | 20px |
| 다중 생성 | Files | 20px |
| 슬롯 그리드 | LayoutGrid | 20px |
| 재시도 | RotateCcw | 16px |
| 백그라운드 | Minimize2 | 16px |
| 금지어 경고 | ShieldAlert | 16px |

---

## 14. 화면별 핵심 컴포넌트 맵

| 화면 | 주요 컴포넌트 |
|-----|------------|
| 대시보드 | KpiCard · ExchangeRateWidget · TrendTable · Badge |
| 상품 목록 | DataTable(가상스크롤) · Badge(상태+progress) · BulkActionBar |
| 상품 등록 | ExcelUploadCard(5종탭) · FileDrop · DataPreview · ColumnMapper |
| 상세페이지 생성 | Modal · Tabs(3) · Tabs(4/3/3하위) · SlotGrid(80px) · ProgressBar |
| 생성 큐 | ProgressBar(×N) · Badge · 드래그 재정렬 |
| 상세페이지 에디터 | TitleOptimizer(3안) · SlotGrid · ImagePreview · TemplateSelector |
| 마켓 배포 | MarketCheckboxCard(8개) · AccountSelect · DeployProgress |
| 쇼츠 생성 | ProductPicker · RadioGroup · AudioPicker · SnsChannelCard(5개) |
| 자동화 | ModeTabs(3) · ReactFlow · WebhookConfig · CodeInput(mono) |
| 설정 | TabsVertical · ApiKeyInput(mono) · OAuthButton · Switch |
