# DESIGN.md — NOMAD AI Factory
> Google Stitch AI 전용 디자인 시스템 파일

## Colors

- **Primary** (`#007A64`): 주요 CTA 버튼 배경, 핵심 액션 (WCAG AA: 흰 텍스트 4.6:1)
- **Primary Light** (`#00C9A7`): 아이콘, 사이드바 활성, 뱃지 강조색, 배경 틴트 아님
- **Primary Tint** (`#E6FBF7`): 선택된 행 배경, 활성 상태 배경
- **Primary Subtle** (`#F0FDF9`): 매우 연한 강조 배경
- **Secondary** (`#2563EB`): 링크, 보조 버튼, 정보 강조
- **Secondary Tint** (`#EFF6FF`): 정보 배경
- **Success** (`#10B981`): 완료 상태, 성공 토스트
- **Success Tint** (`#DCFCE7`): 성공 뱃지 배경
- **Warning** (`#F59E0B`): 경고, 환율 등락, 대기 상태
- **Warning Tint** (`#FEF9C3`): 경고 뱃지 배경
- **Error** (`#EF4444`): 오류, 삭제 액션, 실패 상태
- **Error Tint** (`#FEE2E2`): 오류 뱃지 배경
- **Info** (`#3B82F6`): 정보, 생성 중 상태
- **Info Tint** (`#EFF6FF`): 정보 뱃지 배경
- **Sidebar Background** (`#0F1117`): 좌측 사이드바 배경 (다크)
- **Sidebar Hover** (`rgba(255,255,255,0.06)`): 사이드바 메뉴 hover
- **Sidebar Active** (`rgba(0,201,167,0.12)`): 사이드바 활성 메뉴 배경
- **Page Background** (`#F8FAFC`): 메인 컨텐츠 영역 배경
- **Surface** (`#FFFFFF`): 카드, 테이블, 입력창 배경
- **Border Light** (`#F1F5F9`): 행 구분선 (가장 연함)
- **Border Base** (`#E2E8F0`): 카드·입력 테두리 (기본)
- **Border Strong** (`#CBD5E1`): hover 상태 테두리
- **Text Primary** (`#0F172A`): 본문, 제목 (대비 19.5:1)
- **Text Secondary** (`#475569`): 서브 레이블, 설명 (대비 6.4:1)
- **Text Tertiary** (`#94A3B8`): 플레이스홀더, 비활성 (대비 3.1:1)
- **Text Inverse** (`#FFFFFF`): 어두운 배경 위 텍스트

## Typography

- **Display Font**: Bebas Neue — KPI 숫자, 헤드라인 전용, letter-spacing 0.04em
- **Body Font**: Noto Sans KR — 한국어 본문 전체
- **Mono Font**: JetBrains Mono — 환율 수치, 금액, ASIN, API 키

- **Hero**: Bebas Neue, 56px, weight 900
- **Heading XL**: Bebas Neue, 40px, weight 900 — KPI 카드 수치
- **Heading LG**: Noto Sans KR, 24px, weight 700
- **Heading MD**: Noto Sans KR, 20px, weight 600
- **Heading SM**: Noto Sans KR, 16px, weight 600
- **Body Base**: Noto Sans KR, 14px, weight 400, line-height 1.6
- **Body SM**: Noto Sans KR, 13px, weight 400, line-height 1.5
- **Caption**: Noto Sans KR, 11px, weight 400, line-height 1.4
- **Mono Base**: JetBrains Mono, 14px, weight 500 — 금액 표시
- **Mono SM**: JetBrains Mono, 12px, weight 400 — 보조 수치

## Spacing

- Base unit: 4px
- xs: 4px
- sm: 8px
- md: 12px
- base: 16px
- lg: 20px
- xl: 24px
- 2xl: 32px
- 3xl: 40px
- 4xl: 48px
- 5xl: 64px

## Layout

- Sidebar width: 240px (다크 배경 #0F1117)
- TopBar height: 64px (흰색 배경)
- Content max-width: 1440px
- Content padding: 24px
- Card padding: 20px

## Components

### Button
- **Primary**: background #007A64, text white, font 14px 600, height 36px, padding 0 16px, border-radius 6px
- **Primary Hover**: background #006B56
- **Secondary**: background transparent, border 1.5px solid #E2E8F0, text #0F172A, height 36px
- **Ghost**: background transparent, text #00C9A7 — 어두운 배경 전용
- **Danger**: background #EF4444, text white
- **Disabled**: opacity 0.4, cursor not-allowed
- **Loading**: Loader2 스피너 중앙, 텍스트 숨김
- 레이블: 항상 동사로 시작 ("생성 시작", "저장하기") — "확인", "OK" 금지

### Input
- Height: 36px, border 1.5px solid #E2E8F0, border-radius 6px, padding 0 12px
- Font: 14px Noto Sans KR
- Focus: border-color #00C9A7, box-shadow 0 0 0 3px rgba(0,201,167,0.20)
- Error: border-color #EF4444, background #FEE2E2, box-shadow 0 0 0 3px rgba(239,68,68,0.15)
- Mono variant: JetBrains Mono 폰트 — ASIN, API 키 입력용
- Placeholder color: #94A3B8 (절대 #CBD5E1 사용 금지 — WCAG 실패)

### Badge (상품 상태)
- **미생성**: background #F1F5F9, text #64748B, icon Clock
- **생성중**: background #EFF6FF, text #3B82F6, icon Loader2 (spinning)
- **대기중**: background #FEF9C3, text #92400E, icon Clock
- **완료**: background #DCFCE7, text #15803D, icon CheckCircle2
- **배포완료**: background #EDE9FE, text #5B21B6, icon Upload
- **오류**: background #FEE2E2, text #991B1B, icon XCircle
- Size: font 11px, height 22px, padding 3px 8px, border-radius 9999px

### Card
- Background: #FFFFFF, border 1px solid #E2E8F0, border-radius 8px
- Padding: 20px
- Shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)

### Progress Bar
- Track: height 6px, background #E2E8F0, border-radius 9999px
- **실행 중**: gradient left-to-right #00C9A7 → #2563EB + shimmer animation
- **완료**: solid #10B981
- **실패**: solid #EF4444
- **대기**: solid #E2E8F0

### DataTable (상품 목록)
- Row height: 56px, border-bottom 1px solid #F1F5F9
- Row hover: background #F8FAFC
- Row selected: background #E6FBF7, border-left 3px solid #00C9A7
- Row generating: border-left 3px solid #3B82F6
- Header: font 11px 600 #64748B, background #F8FAFC

### Modal
- Max-width: 720px, border-radius 16px
- Overlay: rgba(15,17,23,0.6)
- Padding: 24px

### Sidebar Navigation
- Background: #0F1117
- Item default: padding 9px 12px, font 13px 500, color #94A3B8, border-radius 6px
- Item hover: background rgba(255,255,255,0.06), color #E2E8F0
- Item active: background rgba(0,201,167,0.12), color #00C9A7
- Sub-item: padding-left 34px, font 12.5px

### KPI Card
- KPI 수치: Bebas Neue 40px #0F172A
- 레이블: Noto Sans KR 11px 500 #64748B
- 변화율(상승): JetBrains Mono 12px #10B981 + ▲
- 변화율(하락): JetBrains Mono 12px #EF4444 + ▼
- 보합: JetBrains Mono 12px #94A3B8 + ─

### Exchange Rate Widget (환율 위젯)
- 통화 코드: Bebas Neue 13px #94A3B8
- 환율 숫자: JetBrains Mono 18px 600 #0F172A
- 금액 표기: 세 자리 콤마 필수 (₩1,347.20 형식)
- 상승: #10B981 / 하락: #EF4444 / 보합: #94A3B8

### File Upload / Drop Zone
- Border: 1.5px dashed #CBD5E1, border-radius 8px, background #F8FAFC
- Drag over: border-color #00C9A7, background #E6FBF7
- Tab button 선택됨: border 2px solid #00C9A7, background #E6FBF7

### Slot Grid Card (이미지 슬롯 선택 UI)
- Size: 80×80px, border-radius 8px
- 선택됨: border 2px solid #00C9A7, background #E6FBF7
- 비선택: border 1.5px solid #E2E8F0, background #FFFFFF
- 자동ON: border 1.5px dashed #8B5CF6, background #F5F3FF
- 생성중: border #3B82F6 pulse animation

## Border Radius

- xs: 2px
- sm: 4px
- md: 6px — 버튼, 입력창
- lg: 8px — 카드, 테이블
- xl: 12px
- 2xl: 16px — 모달
- full: 9999px — 뱃지, Progress Bar

## Shadows

- xs: 0 1px 2px rgba(0,0,0,0.05)
- sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04) — 카드 기본
- md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)
- brand-focus: 0 0 0 3px rgba(0,201,167,0.20) — 입력창 포커스
- error-focus: 0 0 0 3px rgba(239,68,68,0.15) — 오류 상태

## Do's and Don'ts

### ✅ Do
- 버튼 배경: 반드시 #007A64 사용 (WCAG AA 통과)
- 플레이스홀더: 반드시 #94A3B8 사용
- 환율·금액 수치: JetBrains Mono 폰트 사용
- KPI 숫자: Bebas Neue 폰트 사용
- 금액 표시: 세 자리 콤마 + 원화 기호 (₩29,000원)
- 버튼 레이블: 동사로 시작 ("생성 시작", "배포하기")
- Progress Bar 실행 중: shimmer 그라디언트 애니메이션 (#00C9A7 → #2563EB)
- 사이드바: 다크 배경 (#0F1117) 고수
- 빈 상태: 항상 다음 행동을 안내하는 CTA 버튼 포함
- 오류 메시지: 항상 해결책 포함

### ❌ Don't
- 버튼 배경에 #00C9A7 사용 금지 (흰 텍스트 WCAG 실패 — 비율 2.6:1)
- 플레이스홀더에 #CBD5E1 사용 금지 (WCAG 실패 — 비율 1.9:1)
- "확인", "OK", "Submit" 같은 모호한 버튼 레이블 금지
- 로딩 중 피드백 없는 버튼 (반드시 Loader2 스피너 표시)
- 금액에 세 자리 콤마 없는 표시 금지 (예: 29000 → 29,000)
- 인포그래픽 이미지에 AI가 직접 한글 생성 금지 (항상 별도 합성)
