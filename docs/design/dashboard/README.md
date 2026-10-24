# 대시보드 화면 디자인 원본

Claude Design 캔버스에서 만든 화면 20개의 원본 파일입니다. `canvas.json`이 캔버스 배치(위치·크기·제목)이고, 나머지 `.dc.html`이 화면 하나씩입니다.

- 이 파일들은 캔버스 런타임(`support.js`, `<x-dc>`, `<dc-import>`)을 전제로 해서 브라우저에서 단독으로 열면 레이아웃이 깨집니다. 화면을 보려면 캔버스 아티팩트에서 보고, 여기 있는 파일은 구현할 때 마크업·문구·수치를 참고하는 용도로 씁니다.
- 모든 숫자와 상품은 예시 데이터입니다. 플랜 한도도 예시 값이고, 추가 슬롯 가격은 `[추가 슬롯 가격]`으로 비워 두었습니다.

## 화면 목록

| 파일 | 화면 | 단계 |
|---|---|---|
| Main.dc.html | 대시보드 | 6 |
| Sourcing.dc.html | 소싱·수집 | 7 |
| Products.dc.html | 상품 관리 (AI 상품명·금지어) | 8 |
| ProductImages.dc.html | 상품 이미지 | 9 |
| DetailPage.dc.html | 상세페이지 어셈블러 | 10 |
| Upload.dc.html | 마켓 업로드 | 14 |
| Blog.dc.html | 블로그 발행 | 11 |
| Shorts.dc.html | 숏폼 영상 | 12 |
| Sns.dc.html | SNS 배포 | 13 |
| Workflows.dc.html | 워크플로우 캔버스 | 4 |
| Runs.dc.html | 실행 기록 | 5 |
| Search.dc.html | 상품 검색·GEO | 15 |
| Settings.dc.html | 설정 | 3 |
| Billing.dc.html | 플랜·결제 | 2 |
| Admin.dc.html | 슈퍼 어드민 | 1 |
| TabletDashboard.dc.html | 태블릿 대시보드 (834×1194) | 6 |
| MobileDashboard.dc.html | 모바일 대시보드 (390×844) | 6 |
| MobileUpload.dc.html | 모바일 마켓 업로드 (390×844) | 14 |
| Sidebar.dc.html | 공용 사이드바 | – |
| TopBar.dc.html | 공용 상단 바 | – |

## 디자인 토큰

| 역할 | 값 |
|---|---|
| 바탕 | #F2F6F6 |
| 표면 | #FFFFFF |
| 구분선 | #E2E8F0 / 진한 구분선 #CBD5E1 |
| 본문 | #0F172A / 보조 #475569 / 흐린 글자 #64748B |
| 포인트 (채움) | #00C9A7 |
| 포인트 (글자·버튼, AA) | #007A64 |
| 포인트 틴트 | #E6FBF7 |
| 상태 | 성공 #15803D · 진행 #1D4ED8 · 실패 #B91C1C · 경고 #B45309 |
| 서체 | Noto Sans KR (본문) · Bebas Neue (핵심 숫자) · JetBrains Mono (로그·코드만) |

핵심 숫자는 Bebas Neue가 폭이 좁아 데스크탑 68px · 태블릿 52px · 모바일 44px로 키웠습니다.
