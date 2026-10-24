# GlobalCommerce

아마존 구매대행 AI 자동화 SaaS **NOMAD AI Factory V.2**의 기획·설계 문서 저장소입니다.
상품 소싱부터 AI 가공, 마켓 다계정 업로드, 숏폼·SNS 배포까지 15단계로 나눠 설계합니다.

- 기술 스택(목표): Next.js App Router · React 19 · Tailwind CSS v4 · shadcn/ui · Supabase · @xyflow/react
- 디자인 기준: DevOps0906/platform-docs `products/_design-guide` (화면 패턴 A~O, 업무 화면은 라이트 기본, 포인트 컬러 민트 1색)
- 반응형: 모바일 ~767px · 태블릿 768~1199px · 데스크탑 1200px~

## 폴더 구조

```
docs/
├── prd/
│   ├── 15-step-micro-prd.md     15단계 마이크로 PRD (Phase 1~6)
│   └── PRD.md                   전체 PRD v3.0.0
├── spec/
│   ├── CLAUDE.md                개발 규칙 (코드 저장소 루트로 옮겨 쓰는 용도)
│   ├── DESIGN.md                디자인 시스템
│   ├── DESIGN_FOR_STITCH.md     Stitch용 디자인 시스템 요약
│   ├── NOMAD_AI_FACTORY_MASTER_SPEC.md  디자인·UX 심화 스펙
│   ├── DETAIL_PAGE_SYSTEM.md    상세페이지 유형과 이미지 자동화
│   ├── MARKET_IMAGE_SPEC.md     마켓별 이미지 규격
│   ├── MARKET_REGISTER_FORM.md  마켓별 상품 등록 폼
│   ├── STITCH_UI_DESIGN_PLAN.md Stitch UI 디자인 기획서
│   └── LANDING_PAGE_STITCH_PROMPT.md  랜딩페이지 Stitch 프롬프트
└── design/
    ├── structure-map.html       15단계 → 화면·패턴 구조도 (브라우저로 바로 열림)
    └── dashboard/               대시보드 화면 디자인 원본 (Claude Design 캔버스)
```

## 15단계와 화면

| Phase | 단계 | 화면 (경로) | 패턴 |
|---|---|---|---|
| 1 인프라·수익화 | 1 DB·슈퍼 어드민 | 슈퍼 어드민 `/admin/users` | B · C · G |
| | 2 인증·4단계 플랜 결제 | 플랜·결제 `/billing` | H · I |
| | 3 통합 설정 | 설정 `/settings/[section]` | H |
| 2 시각적 워크플로우 | 4 노드 캔버스 | 워크플로우 `/workflows/[id]` | K |
| | 5 실행 엔진 | 실행 기록 `/runs` | N |
| 3 대시보드·수집 | 6 환율·트렌드 | 대시보드 `/dashboard` | C · L |
| | 7 소싱·위탁 수집 | 소싱·수집 `/sourcing` | B · O |
| 4 AI 콘텐츠 | 8 AI 상품명·금지어 | 상품 관리 `/products` | B · O |
| | 9 누끼·이미지 생성 | 상품 이미지 `/products/[id]/images` | G · M |
| | 10 상세페이지 조립 | 상세페이지 `/products/[id]/detail-page` | J |
| 5 마케팅·배포 | 11 블로그 발행 | 블로그 발행 `/content/blog` | B · J |
| | 12 숏폼 렌더링 | 숏폼 영상 `/content/shorts` | J · N · M |
| | 13 SNS 업로드 | SNS 배포 `/content/sns` | N · E |
| | 14 다계정 업로드 | 마켓 업로드 `/upload` | O · N |
| 6 고도화 | 15 벡터 검색·JSON-LD | 상품 검색·GEO `/insights/search` | L |

## 착수 전 확인할 것

- YouTube Data API는 댓글 고정을 지원하지 않는 것으로 알려져 있음 (13단계 고정 댓글은 수동 단계로 둘지 결정)
- 네이버 로그인은 Supabase 기본 제공이 아니라 커스텀 OAuth 연동 필요 (2단계)
- 아마존 수집 방식 결정 (PA-API 자격 조건 확인, 7단계)
- PRD의 DALL-E 3가 착수 시점에 지원되는 이미지 모델인지 확인 (9단계)
