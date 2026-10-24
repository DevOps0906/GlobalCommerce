# NOMAD_AI_FACTORY_MASTER_SPEC.md — 디자인 시스템 & UX 심화 스펙

> **버전:** v3.0.0 | **연동:** DESIGN.md (토큰 출처) · CLAUDE.md §코딩컨벤션  
> **적용 스킬:** /frontend-design · /design-system · /ux-copy · /design-handoff · /accessibility-review  
> **역할:** DESIGN.md의 축약 내용을 심화·확장. Claude Code가 세부 구현 시 참조.

---

## PART 1. 디자인 시스템 전체 토큰

```css
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COLOR TOKENS (전체)
   ⚠️ --color-brand (#00C9A7) 위 흰 텍스트 WCAG 실패
      버튼 배경은 반드시 --color-brand-hover (#007A64) 사용
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* Brand */
--color-brand:         #00C9A7;   /* 아이콘·사이드바·뱃지에서만 원색 사용 */
--color-brand-hover:   #007A64;   /* ✅ 버튼 배경 (WCAG AA 통과: 흰 텍스트 4.6:1) */
--color-brand-active:  #006B56;
--color-brand-tint:    #E6FBF7;   /* 선택 상태 배경 */
--color-brand-subtle:  #F0FDF9;   /* 매우 연한 강조 배경 */

--color-denim:         #2563EB;
--color-denim-hover:   #1D4ED8;
--color-denim-tint:    #EFF6FF;

/* Semantic */
--color-success:       #10B981;   --color-success-tint: #DCFCE7;
--color-warning:       #F59E0B;   --color-warning-tint: #FEF9C3;
--color-error:         #EF4444;   --color-error-tint:   #FEE2E2;
--color-info:          #3B82F6;   --color-info-tint:    #EFF6FF;

/* Neutral */
--color-sidebar:       #0F1117;
--color-sidebar-hover: rgba(255,255,255,.06);
--color-sidebar-active:rgba(0,201,167,.12);
--color-bg-base:       #F8FAFC;   /* 페이지 배경 */
--color-bg-surface:    #FFFFFF;   /* 카드·테이블 배경 */

/* Border */
--color-border-light:  #F1F5F9;   /* 행 구분선 */
--color-border-base:   #E2E8F0;   /* 카드·입력 테두리 */
--color-border-strong: #CBD5E1;   /* hover 테두리 */
--color-border-brand:  #00C9A7;
--color-border-error:  #EF4444;

/* Text */
--color-text-primary:      #0F172A;   /* 19.5:1 ✅ */
--color-text-secondary:    #475569;   /* 6.4:1 ✅ */
--color-text-tertiary:     #94A3B8;   /* 3.1:1 ✅ (플레이스홀더) */
--color-text-placeholder:  #94A3B8;   /* ⚠️ #CBD5E1 금지 (1.9:1 실패) */
--color-text-inverse:      #FFFFFF;
--color-text-brand:        #00C9A7;   /* 다크 배경 위에서만 */
--color-text-link:         #2563EB;

/* Typography */
--font-display: 'Bebas Neue', sans-serif;    /* KPI 숫자·헤드라인 전용 */
--font-body:    'Noto Sans KR', sans-serif;  /* 한국어 본문 전체 */
--font-mono:    'JetBrains Mono', monospace; /* 환율·금액·ASIN·API키 */

/* Type Scale */
--text-xs:   11px; --text-sm:   13px; --text-base: 14px;
--text-md:   16px; --text-lg:   20px; --text-xl:   24px;
--text-2xl:  32px; --text-hero: 56px;

/* Font Weight */
--fw-regular: 400; --fw-medium: 500; --fw-semibold: 600;
--fw-bold: 700; --fw-black: 900;

/* Spacing */
--space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
--space-5:20px; --space-6:24px; --space-8:32px;
--space-10:40px; --space-12:48px; --space-16:64px;

/* Radius */
--radius-sm:4px; --radius-md:6px; --radius-lg:8px;
--radius-xl:12px; --radius-2xl:16px; --radius-full:9999px;

/* Shadow */
--shadow-sm:    0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
--shadow-md:    0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.04);
--shadow-brand: 0 0 0 3px rgba(0,201,167,.20);
--shadow-error: 0 0 0 3px rgba(239,68,68,.15);

/* Motion */
--dur-fast: 100ms; --dur-base: 150ms; --dur-slow: 250ms; --dur-slower: 400ms;
--ease: cubic-bezier(.4,0,.2,1);
--ease-spring: cubic-bezier(.34,1.56,.64,1);
```

---

## PART 2. 컴포넌트 전체 스펙

### Button

```
Variants:
  primary   bg:#007A64  text:#FFFFFF  (⚠️ #00C9A7 배경 금지 — WCAG 실패)
  secondary bg:transparent  border:--color-border-base  text:--color-text-primary
  ghost     bg:transparent  text:--color-brand (다크배경용)
  danger    bg:--color-error  text:#FFFFFF
  outline   bg:transparent  border:--color-border-base  text:--color-text-secondary

Sizes: xs(28px·10px·12px) sm(32px·12px·13px) md(36px·16px·14px) lg(44px·20px·16px) xl(52px·24px·18px)

States:
  hover:    brightness -10%
  active:   brightness -15%, scale(0.99)
  focus:    --shadow-brand outline
  disabled: opacity 0.4, cursor not-allowed
  loading:  텍스트 숨김, Loader2 스피너 중앙, aria-busy="true"

레이블 규칙: 동사 시작 필수 ("생성 시작"·"저장하기") / "확인"·"OK" 금지

접근성:
  aria-disabled="true" + tabIndex=-1 (disabled)
  aria-busy="true" + aria-label="처리 중" (loading)
  아이콘만 → aria-label 필수
```

### Input

```
Variants: default · search(돋보기 좌측) · password(눈 우측 토글) · mono(JetBrains Mono)

States:
  default:   border --color-border-base
  hover:     border --color-border-strong
  focus:     border --color-brand-hover + --shadow-brand
  error:     border --color-error + --shadow-error + bg --color-error-tint
  disabled:  border --color-border-light + bg --color-bg-base
  
Sizes: sm(32px) md(36px) lg(44px)

검증: 포커스 중 검증 안함 → 블러 시 검증 → 서버오류는 제출 후 표시
글자수 카운터: "38/100" 형식 우측 하단

접근성: label(htmlFor) 필수 / error→aria-invalid="true"·aria-describedby / 필수→aria-required="true"
```

### Badge (Status)

```
상품 상태:
  draft:       bg #F1F5F9  text #64748B   아이콘 Clock      "미생성"
  generating:  bg --info-tint  text --info   아이콘 Loader2(spin) "생성중"
  queued:      bg #FEF9C3  text #92400E   아이콘 Clock      "대기중"
  ready:       bg --success-tint  text --success  아이콘 CheckCircle2 "완료"
  deployed:    bg #EDE9FE  text #5B21B6   아이콘 Upload     "배포완료"
  error:       bg --error-tint  text #991B1B  아이콘 XCircle   "오류"

Sizes: xs(10px·18px) sm(11px·22px) md(12px·24px)
generating → Loader2 spin: 1s linear infinite
```

### ProgressBar

```
Variants:
  brand(실행중): linear-gradient(90deg,#00C9A7,#2563EB) + shimmer 1.8s
  success:       #10B981 고정
  error:         #EF4444 고정
  idle:          #E2E8F0 대기

Shimmer:
  @keyframes shimmer { 0%{bg-position:-200% center} 100%{bg-position:200% center} }
  background-size: 200% 100%;
  animation: shimmer 1.8s linear infinite;

Track: height 6px · bg #E2E8F0 · radius 9999px

접근성: role="progressbar" aria-valuenow={value} aria-valuemin=0 aria-valuemax=100
prefers-reduced-motion: animation:none; transition:none; 처리 필수
```

### DataTable

```
행 상태:
  default:     bg transparent       border-b #F1F5F9
  hover:       bg #F8FAFC           transition 100ms
  selected:    bg #E6FBF7           border-l 3px solid #00C9A7
  generating:  border-l 3px solid --color-info

열 정의 패턴:
  이미지:   width 64px
  상품명:   flex-1, text-sm 500 2줄클램프 + ASIN mono text-xs tertiary
  상태:     width 120px, Badge + inline ProgressBar (60px·4px, generating시)
  액션:     width 80px

5,000개+: react-window 가상 스크롤 필수
  
빈 상태:
  아이콘: PackageOpen 48px --color-text-tertiary
  제목: 16px 600 (화면별 다름 — DESIGN.md §11 참조)
  설명: 14px --color-text-secondary max-width 360px
  CTA 버튼 최대 2개
```

---

## PART 3. 핵심 화면 개발 핸드오프

### 상품 목록 페이지 (/products)

```
레이아웃:
  최대폭: 1440px · 패딩: 24px · 헤더: 64px · 사이드바: 240px
  유효 콘텐츠폭: 1440 - 240 - 48 = 1152px

토큰:
  bg: --color-bg-base / 테이블bg: --color-bg-surface
  행구분: --color-border-light / 선택행bg: --color-brand-tint
  본문: --text-sm / 헤더: --text-xs 600 --color-text-tertiary bg --color-bg-base

인터랙션:
  행 hover:      bg #F8FAFC, 100ms ease
  행 선택:       bg #E6FBF7, border-l 3px #00C9A7
  체크박스:      accent-color: #00C9A7
  [상세페이지 생성] 버튼 → 0개: disabled / N개: "상세페이지 생성 (N개)" enabled

엣지케이스:
  5000개+:   react-window 가상스크롤 (최대 50행 DOM 렌더링)
  생성중 새로고침: SSE 재연결로 진행률 복원
  이미지 실패:    PackageOpen 아이콘 폴백
  긴 상품명:      line-clamp-2 + hover 툴팁 전문

애니메이션:
  행 선택:   background-color 100ms ease
  뱃지 spin:  Loader2 1000ms linear infinite
  배포 Progress: width 400ms ease-out
  Bulk action bar: slide-up 200ms ease-out
```

### 상세페이지 생성 모달

```
모달: width 720px(데스크탑)·100vw-32px(모바일)
      max-height 80vh · radius-2xl · shadow-xl
      overlay: rgba(15,17,23,0.6)

탭 활성화 조건:
  0개 선택:  전체 disabled
  1개 선택:  개별생성(●) · 이미지로생성 · 다중등록 모두 활성
  2개 이상:  개별생성 disabled(opacity 0.4) · 다중등록(● 기본선택)

탭 스타일:
  비활성:   border-b 2px transparent · color --color-text-tertiary · bg --color-bg-base
  활성:     border-b 2px #00C9A7 · color #00C9A7 · bg #FFFFFF
  조건미충족: opacity 0.4 · cursor not-allowed · hover 툴팁

이미지슬롯 그리드:
  카드: 80×80px · radius 8px
  선택됨:    border 2px #00C9A7 · bg #E6FBF7 · ✓ 우상단 (Noto Sans KR)
  비선택:    border 1.5px #E2E8F0 · bg #FFFFFF
  자동ON:    border 1.5px dashed #8B5CF6 · bg #F5F3FF · "자동" 레이블
  생성중:    border #3B82F6 pulse 애니메이션

[생성 시작] 버튼 disabled 조건:
  - 선택 상품 없음
  - 필수 슬롯(T-1·D-1·L-3) 하나도 미선택
  - 이미지로생성인데 소스 미선택

텍스트: 1개 "생성 시작" / N개 "생성 시작 ▶ N개 순차 처리"

닫기 시 생성 진행 중이면:
  다이얼로그: "생성이 백그라운드에서 계속 진행돼요. 닫아도 괜찮아요." [닫기] [취소]

Keyboard:
  Escape: 닫기 (생성중 경고)
  Arrow L/R: 탭 전환
  Tab: 포커스 이동
  Space: 슬롯 체크박스 토글
  Enter: 버튼 실행
```

---

## PART 4. UX 카피 — 전체 패턴

### 어조 원칙
```
- 동사로 시작: "생성 시작" "저장하기" "배포하기"
- 결과 중심: 버튼이 무엇을 할지 명시
- 오류는 사과 말고 해결책 제시
- 수치는 구체적으로
- 한국어 존댓말: 공손하되 간결 ("~해주세요" X → "~하세요" O)
```

### 빈 상태 전체 목록
| 화면 | 아이콘 | 제목 | 설명 | 주 CTA | 보조 CTA |
|-----|--------|------|------|-------|---------|
| 상품 목록 (첫방문) | PackageOpen | 아직 등록된 상품이 없어요 | 아마존 URL을 입력하거나 엑셀 파일을 업로드해서 첫 상품을 추가하세요. | 아마존 URL 소싱 | 엑셀 파일 업로드 |
| 상품 목록 (검색결과 없음) | Search | 검색 결과가 없어요 | 다른 키워드로 검색하거나 필터를 초기화해보세요. | 필터 초기화 | — |
| 상세페이지 목록 | FileText | 생성된 상세페이지가 없어요 | 상품 목록에서 상품을 선택하고 상세페이지 생성을 시작하세요. | 상품 목록으로 이동 | — |
| 카드뉴스 목록 | Layers | 아직 만든 카드뉴스가 없어요 | 상품을 선택하면 AI가 카드뉴스를 자동으로 만들어드려요. | 카드뉴스 만들기 | — |
| 쇼츠 목록 | Video | 아직 만든 쇼츠가 없어요 | 상품을 선택하면 30초 안에 쇼츠 영상을 자동으로 만들어드려요. | 쇼츠 만들기 | — |
| 마켓 계정 없음 | Link | 연결된 마켓 계정이 없어요 | 쿠팡·스마트스토어 API를 연결하면 상품을 바로 배포할 수 있어요. | 계정 연결하기 | — |
| SNS 계정 없음 | Share2 | 연결된 SNS 계정이 없어요 | 유튜브·인스타그램 계정을 연결하면 쇼츠를 바로 올릴 수 있어요. | SNS 연결하기 | — |
| 배포 이력 없음 | Upload | 아직 배포한 상품이 없어요 | 상품을 준비하고 마켓 배포를 시작해보세요. | 상품 목록으로 | — |

### 오류 메시지 전체 목록 (해결책 필수)
| 상황 | 메시지 제목 | 해결책 | 레벨 |
|-----|-----------|--------|------|
| 아마존 URL 파싱 실패 | 상품 정보를 가져올 수 없어요 | URL을 확인하거나 ASIN을 직접 입력해보세요. | error |
| 아마존 일시 차단 | 아마존 접근이 잠시 제한됐어요 | 5분 후 다시 시도해보세요. | warning |
| 엑셀 필수 컬럼 누락 | '{컬럼명}' 항목이 없어요 | 양식을 다운로드해서 다시 업로드해보세요. | error |
| 엑셀 파일 형식 오류 | 지원하지 않는 파일 형식이에요 | .xlsx .xls .csv 파일만 업로드 가능해요. | error |
| 이미지 생성 실패 (슬롯) | D-3 슬롯 이미지 생성에 실패했어요 | 해당 슬롯만 재시도할까요? 다른 슬롯은 저장됐어요. | warning |
| 쿠팡 배포 실패 (반품비) | 쿠팡 배포에 실패했어요 | 반품비가 허용 금액을 초과했어요. 자동으로 조정할게요. | error |
| 쿠팡 대표이미지 규칙 위반 | 이미지에 텍스트가 감지됐어요 | 쿠팡 대표이미지에는 텍스트 오버레이가 금지돼요. | warning |
| 11번가 이미지 용량 초과 | 이미지 용량이 너무 커요 | 11번가는 3MB 이하 이미지만 등록 가능해요. 자동 압축할까요? | warning |
| API 키 만료 | {마켓} 연결이 끊겼어요 | API 키를 설정에서 다시 연결해주세요. | error |
| 플랜 한도 초과 | 이번 달 생성 한도에 도달했어요 | 프로 플랜으로 업그레이드하면 월 500개를 만들 수 있어요. | warning |
| SNS 토큰 만료 | {채널} 연결이 끊겼어요 | SNS 계정을 설정에서 다시 연결해주세요. | error |
| 자동화 Webhook 실패 | n8n 연결에 실패했어요 | Webhook URL과 API 키를 확인해보세요. | error |
| 네트워크 오류 | 연결이 불안정해요 | 인터넷 연결을 확인하고 다시 시도해보세요. | error |

### 확인 다이얼로그 (구체적 결과 명시)
| 상황 | 제목 | 내용 | 확인 버튼 | 취소 버튼 |
|-----|------|------|---------|---------|
| 상품 삭제 | 상품을 삭제할까요? | [상품명]과 연결된 상세페이지 N개·쇼츠 N개도 함께 삭제돼요. 되돌릴 수 없어요. | 삭제하기 | 취소 |
| 전체 큐 취소 | 생성을 모두 취소할까요? | N개가 아직 처리되지 않았어요. 완료된 N개는 저장돼 있어요. | 모두 취소 | 계속 생성 |
| 모달 닫기 (생성중) | 창을 닫아도 괜찮아요 | 생성이 백그라운드에서 계속 진행돼요. 상단 알림에서 확인할 수 있어요. | 닫기 | 취소 |
| 템플릿 덮어쓰기 | 기존 설정을 덮어쓸까요? | '{템플릿명}' 설정을 새 설정으로 바꿔요. 이전 설정은 복구할 수 없어요. | 덮어쓰기 | 취소 |
| 계정 연결 해제 | {마켓} N호점 연결을 해제할까요? | 예약 배포 중인 상품이 있으면 배포가 중단돼요. | 연결 해제 | 취소 |
| 워크플로우 삭제 | 워크플로우를 삭제할까요? | '{이름}' 워크플로우가 삭제돼요. 실행 이력도 함께 삭제돼요. | 삭제하기 | 취소 |

### 로딩 메시지
| 상황 | 메시지 | 부연 |
|-----|--------|-----|
| 아마존 소싱 | 아마존에서 상품 정보를 가져오는 중이에요 | 약 5~10초 |
| 번역 중 | 상품 정보를 한국어로 번역하는 중이에요 | — |
| 스토리라인 생성 | 상세페이지 스토리를 구성하는 중이에요 | — |
| 이미지 생성 (슬롯별) | {슬롯명} 이미지를 만드는 중이에요 ({N}/{total}) | DALL-E 3 생성 중 |
| Puppeteer 렌더링 | 인포그래픽을 렌더링하는 중이에요 | — |
| 마켓 배포 | {마켓}에 상품을 등록하는 중이에요 | {N}/{total} 완료 |
| 엑셀 파싱 | 파일을 읽는 중이에요 | {N}개 행 확인 중 |
| SNS 업로드 | {채널}에 영상을 올리는 중이에요 | — |

### 성공 메시지 (후속 액션 제안)
| 상황 | 메시지 | 후속 액션 |
|-----|--------|---------|
| 상세페이지 완성 | 상세페이지가 완성됐어요! | [마켓에 바로 배포할까요?] |
| 엑셀 N개 등록 | {N}개 상품이 등록됐어요 | [상세페이지 생성하기] |
| 쿠팡 배포 완료 | 쿠팡에 상품이 등록됐어요 | [쿠팡에서 확인하기 ↗] |
| 쇼츠 업로드 완료 | {채널}에 영상이 올라갔어요 | [{채널}에서 확인하기 ↗] |
| 카드뉴스 배포 완료 | 카드뉴스가 게시됐어요 | [인스타그램에서 확인하기 ↗] |
| 자동화 저장 | 워크플로우가 저장됐어요 | — |
| API 연결 성공 | {마켓} 계정이 연결됐어요 | [첫 상품 배포하기] |

### 온보딩 문구 (첫 방문 유저)
```
Step 1 — 소싱
  헤드라인: "첫 상품을 아마존에서 가져와볼까요?"
  설명:     URL만 붙여넣으면 상품 정보를 자동으로 가져와요.
  힌트:     예시: https://www.amazon.com/dp/B001G7QR5A

Step 2 — 상세페이지
  헤드라인: "AI가 상세페이지를 만들어드려요"
  설명:     이미지 10~15장, 한국어 카피, 금지어 검사까지 자동이에요.
  힌트:     보통 2~3분 걸려요.

Step 3 — 배포
  헤드라인: "쿠팡·스마트스토어에 한번에 올려요"
  설명:     마켓 계정만 연결하면 클릭 한 번으로 전송돼요.
  힌트:     먼저 설정에서 쿠팡 Wing API를 연결해주세요.
```

---

## PART 5. 접근성 완전 검증

### WCAG 2.1 AA 색상 대비 전체
| 요소 | 전경 | 배경 | 비율 | 기준 | 통과 |
|-----|------|------|------|------|-----|
| 본문 텍스트 | #0F172A | #FFFFFF | 19.5:1 | 4.5:1 | ✅ |
| 서브 텍스트 | #475569 | #FFFFFF | 6.4:1 | 4.5:1 | ✅ |
| 플레이스홀더 | #94A3B8 | #FFFFFF | 3.1:1 | 3.0:1 | ✅ |
| brand 버튼 텍스트 | #FFFFFF | #007A64 | 4.6:1 | 4.5:1 | ✅ |
| 사이드바 활성 | #00C9A7 | #0F1117 | 7.1:1 | 4.5:1 | ✅ |
| 사이드바 비활성 | #94A3B8 | #0F1117 | 4.7:1 | 4.5:1 | ✅ |
| 에러 텍스트 | #991B1B | #FEE2E2 | 5.2:1 | 4.5:1 | ✅ |
| 성공 뱃지 텍스트 | #15803D | #DCFCE7 | 5.8:1 | 4.5:1 | ✅ |
| 경고 뱃지 텍스트 | #92400E | #FEF9C3 | 5.3:1 | 4.5:1 | ✅ |

**❌ 금지 조합:**
- `#FFFFFF` 텍스트 on `#00C9A7` 배경 → 2.6:1 (실패) → `#007A64` 사용
- `#CBD5E1` 텍스트 on `#FFFFFF` → 1.9:1 (실패) → `#94A3B8` 사용

### 키보드 내비게이션 맵
```
전역 Tab 순서: [사이드바] → [TopBar 검색] → [메인 콘텐츠]

상품 목록:
  [+ 상품등록] → [필터] → [검색] → [정렬 헤더]
  → [테이블 행: 체크박스→상품명→상태→액션] → [Bulk 액션 바]
  
상세페이지 생성 모달:
  Escape: 닫기 / Arrow L·R: 탭 전환
  슬롯 그리드: Arrow키 이동 + Space 선택·해제
  [취소] → [생성 시작]

Progress 큐 패널:
  [전체취소] → 각 항목 [↑순서] [↓순서] [✕취소]

자동화 React Flow:
  Tab: 노드 간 포커스 / Space·Enter: 노드 선택
  Delete: 선택 노드 삭제 / Arrow: 노드 이동 (1px)
```

### aria-live 공지 전략
```typescript
const ARIA_LIVE_REGIONS = {
  // 생성 진행 단계 (폴링 아님 — SSE 수신 시 업데이트)
  generation_status: {
    role: 'status', 'aria-live': 'polite', 'aria-atomic': 'false',
    // "이미지 생성 중... D-3 완료 (4/10)"
  },
  // 배포 완료 토스트
  deploy_result: {
    role: 'alert', 'aria-live': 'assertive',
    // "쿠팡 배포 완료: 18개 상품이 등록됐어요"
  },
  // 환율 갱신 (30분마다, 자동 공지 안 함)
  exchange_rate: {
    role: 'status', 'aria-live': 'off',
    'aria-label': '환율 정보. 30분마다 갱신됩니다.',
  },
  // 오류 메시지
  error_message: {
    role: 'alert', 'aria-live': 'assertive',
  },
}
```

### 터치 타깃
- 모든 인터랙티브 요소: 최소 44×44px
- 아이콘 버튼: 시각 크기 24px + 패딩으로 44px 확장
- 큐 순서 버튼 [↑][↓]: 최소 44×44px (시각 28px + 패딩)

### prefers-reduced-motion (전체 적용)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
/* 특히: Progress shimmer·Loader2 spin·모달 fade·토스트 slide */
```

---

## PART 6. 모션 시스템

### 사용하는 곳 (5가지)
```
1. Progress Bar shimmer — "생산 중" 느낌 핵심 (1.8s linear infinite)
2. 행 선택 배경 전환 — 즉각적 피드백 (100ms ease)
3. 모달 열기/닫기 — scale(0.96)→scale(1), opacity 0→1, 150ms ease-out
4. 토스트 슬라이드 — translateY(16px)→0, opacity 0→1, 200ms ease-out
5. 사이드바 메뉴 활성 — background 전환 100ms
```

### 사용하지 않는 곳 (3가지)
```
1. 데이터 테이블 행 로드 — 속도 우선, 스켈레톤만
2. 폼 검증 메시지 — 즉각 표시 필요
3. 진행률 % 숫자 — 애니메이션이 오히려 방해
```

---

## PART 7. 디자인 QA 체크리스트

구현 완료 후 각 화면 QA 시 체크:
```
시각 계층:
□ 모든 버튼: 동사로 시작하는가?
□ 모든 금액: 세 자리 콤마 적용 (formatKRW() 사용)?
□ 환율·금액 숫자: JetBrains Mono 폰트인가?
□ KPI 수치: Bebas Neue 폰트인가?
□ 텍스트 오버플로우: line-clamp or 말줄임 처리?
□ 이미지 fallback: 기본 아이콘 표시?

색상·접근성:
□ 버튼 배경: #007A64 사용 (#00C9A7 금지)?
□ 플레이스홀더: #94A3B8 사용 (#CBD5E1 금지)?
□ 모든 aria-label: 아이콘 전용 버튼에 적용?
□ 모든 input: label 연결?
□ 모든 터치 타깃: 44px 이상?

인터랙션:
□ 모든 오류: 해결책 제시?
□ 모든 빈 상태: 다음 행동 안내?
□ 로딩 중: 진행 상황 표시 (SSE)?
□ 위험한 액션: 확인 다이얼로그?
□ 선택 피드백: 100ms 이내 즉각 반응?
□ prefers-reduced-motion: animation 처리?

데이터:
□ Progress Bar: role="progressbar" aria-valuenow?
□ 생성 큐: aria-live="polite" 업데이트?
□ 배포 완료: aria-live="assertive" 공지?
```
