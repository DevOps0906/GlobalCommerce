# DETAIL_PAGE_SYSTEM.md — 상세페이지 유형 & 스토리라인→이미지 자동화

> **버전:** v3.0.0 | **연동:** PRD.md §6.2~6.4 · CLAUDE.md §9 · MARKET_IMAGE_SPEC.md §6  
> **핵심:** 스토리라인(GPT) → 슬롯별 프롬프트 → 엔진 선택(DALL-E/Puppeteer/Sharp) → 마켓변환

---

## 1. 상세페이지 유형 8가지

### 유형 선택 기준: "무엇으로 소비자를 설득하는가"

---

### 유형 1. 설득형 (Persuasion)
**논리·수치·근거로 증명한다**
```
구조: 문제 제기 → 해결책 → 근거 나열 → 결론(구매)
타깃: 이성적 소비자·비교 구매자·정보 탐색형
카테고리: 건강식품·기능성 생활용품
이미지 톤: 클린·화이트·데이터 시각화 중심
```
| # | 슬롯 | 역할 | 이미지 방향 |
|---|-----|------|-----------|
| 1 | T-1 | 대표 흰배경 | 제품 단독 순백 |
| 2 | T-2 | 라이프스타일 | 건강한 라이프 씬 |
| 3 | D-1 | 문제 훅 | 타깃 페인포인트 상황 |
| 4 | D-2 | 성분 근거 | 성분별 인포그래픽 |
| 5 | D-3 | 라이프스타일 씬 | 제품 사용 장면 |
| 6 | D-5 | 경쟁 비교 | 자사 vs 일반 비교표 |
| 7 | D-7 | 성분·사양표 | 전성분 공개 |
| 8 | D-9 | 인증 뱃지 | GMP·NSF·수상 |
| 9 | L-1 | 건기식 고지 | 법적 면책 문구 |
| 10 | L-3 | CTA | 구매 유도 + 보증 |

---

### 유형 2. 리뷰·사회적 증거형 (Social Proof)
**다른 사람들이 이미 검증했다**
```
구조: 실 구매자 후기 → 수치(판매량·평점) → 전문가 추천 → 신뢰도
타깃: 구매 확신이 필요한 소비자·커뮤니티 의존형
카테고리: 뷰티·건강식품·유아용품
이미지 톤: 실사 사진 중심·따뜻한 색온도·UGC 느낌
```
| # | 슬롯 | 역할 | 이미지 방향 |
|---|-----|------|-----------|
| 1 | T-1 | 대표 흰배경 | 제품 단독 |
| 2 | T-2 | 실 사용 씬 | 손에 들린 UGC 느낌 |
| 3 | D-1 | 누적 평점 배너 | "★4.8 / 2,847개" 숫자 강조 |
| 4 | D-2 | 후기 #1 | 사용자 프로필+리뷰+실사진 |
| 5 | D-3 | 후기 #2 | 다른 연령대 후기 |
| 6 | D-5 | 재구매율 | "재구매율 76%" 인포그래픽 |
| 7 | D-7 | 전문가 추천 | 전문가 프로필+추천 멘트 |
| 8 | D-9 | Q&A 해소 | 자주 묻는 질문 답변 |
| 9 | L-1 | 건기식 고지 | 법적 면책 |
| 10 | L-3 | CTA + 보증 | 만족보장 |

---

### 유형 3. 감성·라이프스타일형 (Lifestyle)
**이 제품을 쓰면 이런 삶을 살 수 있다**
```
구조: 이상적 장면 → 제품 역할 → 감성 카피 → 욕구 자극
타깃: MZ세대·감성 소비자·브랜드 팬
카테고리: 패션·뷰티·홈인테리어·취미
이미지 톤: 고채도 or 필름 감성·라이프스타일 씬·텍스트 최소화
```
| # | 슬롯 | 역할 | 이미지 방향 |
|---|-----|------|-----------|
| 1 | T-1 | 대표 흰배경 | — |
| 2 | T-2 | 감성 제품샷 | 자연광+소품 스타일링 |
| 3 | D-1 | 라이프스타일 히어로 | 이상적 공간에서 사용 |
| 4 | D-3 | 타깃 페르소나 씬 | "30대 직장 여성의 아침" |
| 5 | D-4 | 사용 순간 클로즈업 | 텍스처·색감 디테일 |
| 6 | D-5 | 특징 (최소 텍스트) | 이미지 중심 |
| 7 | D-6 | 계절·시즌 연출 | 계절감 배경+제품 |
| 8 | D-7 | 감성 카피 배너 | 짧은 문장+여백 |
| 9 | L-1 | 고지 (해당 시) | — |
| 10 | L-3 | 브랜드 마무리 | 로고+철학 카피 |

---

### 유형 4. 정보·교육형 (Educational)
**이 제품을 제대로 알고 사라**
```
구조: 배경 지식 → 카테고리 설명 → 제품 특징 → 선택 기준 → 구매
타깃: 첫 구매자·전문 지식 필요 카테고리
카테고리: 건강식품·의료기기·기술 제품
이미지 톤: 다이어그램·인포그래픽·클린 배경·텍스트 비중 높음
```
| # | 슬롯 | 역할 | 이미지 방향 |
|---|-----|------|-----------|
| 1 | T-1 | 대표 흰배경 | — |
| 2 | T-2 | 정보형 배경 | 클린 라이프스타일 |
| 3 | D-2 | 작용 원리 | 신체 내 작용 메커니즘 |
| 4 | D-5 | 성분 함량 비교 | 경쟁 대비 수치 그래프 |
| 5 | D-7 | 상세 성분·스펙 | 전성분 공개 |
| 6 | D-8 | 섭취 방법 STEP | 순서별 상세 방법 |
| 7 | D-9 | 올바른 선택 기준 | "이렇게 고르세요" 체크리스트 |
| 8 | L-1 | 건기식 고지 | — |
| 9 | L-2 | 원산지 정보 | — |
| 10 | L-3 | 구매 안내 | 용량·가격+CTA |

---

### 유형 5. 스토리텔링형 (Brand Story)
**우리가 이 제품을 만든 이유**
```
구조: 브랜드 탄생 배경 → 개발 스토리 → 차별화 → 철학 → 신뢰
타깃: 브랜드 가치를 중시하는 소비자·프리미엄 구매층
카테고리: 프리미엄 건강식품·핸드메이드·스타트업
이미지 톤: 따뜻한 필름 감성·스토리가 있는 장면
```
| # | 슬롯 | 역할 | 이미지 방향 |
|---|-----|------|-----------|
| 1 | T-1 | 대표 흰배경 | — |
| 2 | T-2 | 브랜드 감성샷 | 제품+자연 배경 |
| 3 | D-1 | 창업 스토리 도입 | 창업자 실루엣+감성 카피 |
| 4 | D-3 | 개발 과정 | 연구실·제조 현장 씬 |
| 5 | D-4 | 원재료 원산지 | 원료 생산지 자연 배경 |
| 6 | D-5 | 제조 품질 기준 | GMP 시설 스타일 |
| 7 | D-7 | 제품 탄생 결과 | 완성된 제품샷 |
| 8 | D-9 | 사회적 가치 | 친환경·윤리 요소 |
| 9 | L-1 | 건기식 고지 | — |
| 10 | L-3 | 약속 + CTA | "앞으로도 함께하겠습니다" |

---

### 유형 6. 비교·차별화형 (Comparison)
**다른 제품과 뭐가 다른가를 직접 보여준다**
```
구조: 시장 문제 → 기존 제품 한계 → 우리만의 차이 → 검증 → 구매
타깃: 이미 다른 제품을 써봤거나 가격 비교 중인 소비자
카테고리: 건강식품·생활용품·경쟁 치열 카테고리
이미지 톤: 비교 표·그래프 중심·대비 색상
```
| # | 슬롯 | 역할 | 이미지 방향 |
|---|-----|------|-----------|
| 1 | T-1 | 대표 흰배경 | — |
| 2 | T-2 | 제품 강조 | 당당한 제품샷 |
| 3 | D-1 | 기존 제품 문제 훅 | "이런 경험 있으셨나요?" |
| 4 | D-5 | 기술 차이 비교표 | 자사 vs 경쟁사 |
| 5 | D-6 | Before/After | 사용 전후 차이 |
| 6 | D-7 | 성분 함량 비교 | 수치 그래프 |
| 7 | D-8 | 가성비 계산 | "1일 비용으로 보면" |
| 8 | D-9 | 인증 차이 | 우리만 가진 인증·특허 |
| 9 | L-1 | 건기식 고지 | — |
| 10 | L-3 | 최종 선택 CTA | 선택 가이드+구매 |

---

### 유형 7. 프로모션·특가형 (Promotion)
**지금 당장 사야 할 이유를 만든다**
```
구조: 한정 조건 강조 → 혜택 나열 → 긴급성·희소성 자극 → 즉시 구매
타깃: 가격 민감형·쿠폰·할인 반응형
카테고리: 세일 시즌 모든 카테고리
이미지 톤: 강렬한 대비색·숫자 강조·타이머 요소
슬롯: T-1·T-2 / D-1·D-2·D-5·D-7 / L-3
```

---

### 유형 8. 세트·번들형 (Bundle)
**이것들을 같이 사면 더 가치있다**
```
구조: 조합의 이유 → 각 구성품 설명 → 시너지 → 가성비 → 구매
타깃: 한 번에 해결하고 싶은 소비자·선물 구매자
카테고리: 건강식품 세트·스킨케어 세트·선물 세트
이미지 톤: 구성품 전체 레이아웃·깔끔한 배열·선물 감성
슬롯: T-1·T-2 / D-1·D-2·D-5·D-7·D-8 / L-1·L-3
```

---

## 2. 유형 자동 추천 로직

```typescript
export function recommendPageType(product: {
  price_sell: number
  category: string
  is_health_food: boolean
  source_type: string
  has_certifications?: boolean
  is_bundle?: boolean
}): PageType {
  const { price_sell, is_health_food, source_type, has_certifications, is_bundle } = product

  if (is_bundle) return 'bundle'
  if (price_sell >= 100000 && has_certifications) return 'story'
  if (is_health_food && source_type === 'amazon') {
    return price_sell >= 50000 ? 'educational' : 'persuasion'
  }
  if (['beauty', 'home', 'fashion'].some(c => product.category.includes(c))) return 'lifestyle'
  return 'persuasion'
}

// 유형별 기본 슬롯 (→ MARKET_IMAGE_SPEC.md PAGE_TYPE_DEFAULT_SLOTS와 동일)
export const PAGE_TYPE_DEFAULT_SLOTS: Record<string, string[]> = {
  persuasion:   ['T-1','T-2','D-1','D-2','D-3','D-5','D-7','D-9','L-1','L-3'],
  social_proof: ['T-1','T-2','D-1','D-2','D-3','D-5','D-7','D-9','L-1','L-3'],
  lifestyle:    ['T-1','T-2','D-1','D-3','D-4','D-5','D-7','L-1','L-3'],
  educational:  ['T-1','T-2','D-2','D-5','D-7','D-8','D-9','L-1','L-2','L-3'],
  story:        ['T-1','T-2','D-1','D-3','D-4','D-5','D-7','L-1','L-3'],
  comparison:   ['T-1','T-2','D-1','D-5','D-6','D-7','D-9','L-1','L-3'],
  promotion:    ['T-1','T-2','D-1','D-2','D-5','D-7','L-3'],
  bundle:       ['T-1','T-2','D-1','D-2','D-5','D-7','D-8','L-1','L-3'],
}
```

---

## 3. 스토리라인 → 이미지 프롬프트 변환 메커니즘

### 핵심 원리
```
스토리라인 = 텍스트 대본 (GPT-4o 생성)
이미지 프롬프트 = 각 슬롯의 장면을 그리는 감독 지시서

변환 공식: [장면목적(A)] + [비주얼형식(B)] + [구도(C)] + [스타일(D)] + [기술스펙(E)]

[예시 — D-1 훅 배너]
A: 피곤한 40대 직장인의 오후 장면으로 공감 유발
B: 라이프스타일 씬 (와이드 배너, 제품 우측)
C: 인물 좌측 60%, 제품 우측 40%
D: 따뜻한 오후 오피스 조명, 사실적 사진 스타일
E: 1200x800px, 텍스트 없음, 흰 배경 호환
→ "Korean male office worker in his 40s, tired expression, sitting at desk,
   afternoon warm office lighting, realistic photography, vitamin C bottle right side,
   No Korean text in image, 1200x800px banner composition"
```

### 프롬프트 생성 규칙
```
1. 항상 영문으로 작성 (DALL-E 한국어 품질 저하)
2. "No Korean text in image" 반드시 포함
3. 인포그래픽·표 슬롯: DALL-E 사용 금지 → Puppeteer
4. 씬 슬롯: 인물은 Korean/Asian 명시
5. 배경 색상: 브랜드 컬러 (#00C9A7) 참조 지시 포함
6. 해상도: 슬롯별 마스터 규격 명시 (→ MARKET_IMAGE_SPEC.md §4)
```

---

## 4. 마스터 스토리라인 생성 GPT 프롬프트

```typescript
export const STORYLINE_MASTER_PROMPT = (params: {
  title_ko: string
  key_features: string
  category: string
  price: number
  origin: string
  brand: string
  is_health_food: boolean
  page_type: PageType
  slot_count: number
  selected_slots: string[]
  target_persona: string
  color_palette: string[]
}) => `
당신은 한국 이커머스 상세페이지 기획 전문가입니다.
아래 상품 정보와 조건에 맞는 상세페이지 스토리라인을 JSON으로 생성하세요.

[상품]
- 상품명: ${params.title_ko}
- 핵심 성분·특징: ${params.key_features}
- 카테고리: ${params.category}
- 가격: ${params.price.toLocaleString('ko-KR')}원
- 원산지: ${params.origin} / 브랜드: ${params.brand}
- 건강식품: ${params.is_health_food}

[생성 조건]
- 페이지 유형: ${params.page_type}
- 이미지 장수: ${params.slot_count}장
- 슬롯 목록: ${params.selected_slots.join(', ')}
- 타깃: ${params.target_persona}
- 브랜드 컬러: ${params.color_palette.join(', ')}

[유형별 핵심 지시]
${PAGE_TYPE_INSTRUCTIONS[params.page_type]}

[절대 규칙]
1. image_prompt_en에 한국어 직접 생성 요청 금지 → "No Korean text in image" 필수
2. 인포그래픽·표·법적고지 슬롯 → render_method: "puppeteer"
3. 라이프스타일·씬 슬롯 → render_method: "dalle3" or "flux"
4. T-1 → render_method: "sharp" (Remove.bg + 흰배경)
5. 건기식 금지어 금지: 치료·효능·의약품·항암·살균

[출력 — JSON만, 다른 텍스트 없음]
{
  "concept": "...",
  "tone": "...",
  "color_palette": ["#...", "..."],
  "slots": [
    {
      "slot_code": "T-1",
      "role": "메인 대표이미지",
      "scene_ko": "순백 배경, 제품 정면, 중앙 정렬",
      "copy_ko": null,
      "image_prompt_en": "Product photo of [BRAND] [PRODUCT] bottle, centered, pure white #FFFFFF background, studio lighting, sharp focus, no shadows, No Korean text in image, 1000x1000px",
      "render_method": "sharp",
      "template_data": null
    },
    {
      "slot_code": "D-2",
      "role": "성분 인포그래픽",
      "scene_ko": "비타민C 3대 효능 3열 인포그래픽",
      "copy_ko": "비타민C 1,000mg 3가지 핵심 작용",
      "image_prompt_en": null,
      "render_method": "puppeteer",
      "template_data": {
        "title": "비타민C 1,000mg 3가지 핵심 작용",
        "items": [
          { "icon": "🛡️", "title": "면역력 강화", "desc": "백혈구 활성화\\n면역 세포 보호" },
          { "icon": "✨", "title": "콜라겐 생성", "desc": "피부 탄력 유지\\n혈관 건강" },
          { "icon": "🌿", "title": "항산화 작용", "desc": "활성산소 제거\\n세포 노화 방지" }
        ],
        "accent_color": "#00C9A7"
      }
    }
  ]
}
`

const PAGE_TYPE_INSTRUCTIONS: Record<string, string> = {
  persuasion: `
설득형: 논리·수치·근거 중심
1. D-1: 타깃 페인포인트 장면 → 강한 공감 유발
2. D-2·D-3: 성분·수치로 해결책 증명
3. D-5·D-6: 경쟁 대비 우위 시각화
4. D-7·D-9: 전문성·신뢰도 강화
카피 톤: 논리적·전문적·수치 강조`,

  lifestyle: `
감성형: 이미지 중심·감성 카피
1. D-1: 이상적 라이프스타일 씬으로 욕구 자극
2. D-3·D-4: 아름다운 삶의 장면 2컷
3. 텍스트 최소화·이미지가 90% 이상
카피 톤: 감성적·짧고 시적·여백 활용`,

  educational: `
정보형: 교육·설명 중심
1. 카테고리 배경 지식부터 시작
2. 작용 원리·성분 상세 분석
3. 선택 기준·적합 대상 설명
카피 톤: 전문적·설명적·신뢰감`,

  comparison: `
비교형: 차별화 직접 증명
1. D-1: 기존 제품 문제점 공감
2. D-5: 직접 비교표 (경쟁 대비 우위)
3. D-6: 수치·수상으로 검증
카피 톤: 자신감 있는·데이터 기반`,
}
```

---

## 5. 자동화 파이프라인 전체 순서

```
[INPUT]
  상품DB (product_id) + 생성 옵션 (mode·slots·page_type·template)
        ↓
PHASE 1 — 데이터 수집·번역 (5~10초)
  1.1 products 테이블에서 상품 로드
  1.2 DeepL API → title_original 한국어 번역
  1.3 bullet_points → 핵심 성분·효능 5개 추출
  SSE: progress=5~10, step="번역 중..."

PHASE 2 — 마스터 스토리라인 생성 (8~15초)
  2.1 STORYLINE_MASTER_PROMPT 빌드
  2.2 GPT-4o API 호출 → slots JSON 반환
      {slot_code, scene_ko, copy_ko, image_prompt_en, render_method, template_data}
  SSE: progress=20, step="스토리라인 생성 중..."

PHASE 3 — 상품명 최적화 (3~5초)
  3.1 GEO 키워드 조합으로 상품명 3안 생성
  3.2 DB 저장 (title_optimized)
  SSE: progress=30, step="상품명 최적화 중..."

PHASE 4 — 상세설명 4단 구조 생성 (5~8초)
  4.1 훅·설명·증명·CTA 4단 텍스트 생성
  4.2 금지어 필터 통과 확인
  SSE: progress=40, step="상세설명 생성 중..."

PHASE 5 — 슬롯별 이미지 생성 (40~90초, 슬롯 수에 비례)
  각 슬롯의 render_method에 따라:

  render_method = "sharp":
    5A-1. Remove.bg API → 누끼(투명 배경) 생성
    5A-2. Sharp.js → 흰배경 합성 + 마켓별 리사이즈
    SSE: "T-1 처리 중..."

  render_method = "dalle3" or "flux":
    5B-1. image_prompt_en → DALL-E 3 / Flux Pro API
    5B-2. Sharp.js → copy_ko 한글 텍스트 합성 (해당 슬롯만)
    SSE: "D-3 이미지 생성 중 (5/10)..."

  render_method = "puppeteer":
    5C-1. template_data → buildSlotHTML() → Puppeteer 렌더링
    5C-2. PNG 버퍼 → Supabase Storage 업로드
    SSE: "D-2 인포그래픽 렌더링 중..."

  ※ 진행률: 45% + (완료 슬롯 / 전체 슬롯 × 40%)

PHASE 6 — 품질 검증 (3~5초)
  6.1 각 슬롯: 해상도·비율·용량 검증
      → MARKET_IMAGE_SPEC.md validateThumbnail() 함수
  6.2 합성된 텍스트 금지어 재검사
  6.3 쿠팡 대표이미지: 텍스트 오버레이 경고 발생
  SSE: progress=88, step="품질 검증 중..."

PHASE 7 — 마켓별 자동변환 (5~10초)
  7.1 선택된 마켓 × 각 슬롯 병렬 변환
      → MARKET_IMAGE_SPEC.md convertThumbnailForMarket()
      → MARKET_IMAGE_SPEC.md convertDetailImagesForMarket() + 자동분할
  7.2 market_converted_images 테이블 저장
  SSE: progress=97, step="마켓별 이미지 변환 중..."

PHASE 8 — 조립 & 저장 (3~5초)
  8.1 detail_pages 테이블 생성
      html_content: 슬롯 순서대로 HTML 조립
      images JSONB: [{slot_code, master_url, market_urls{}}]
      geo_jsonld: Product 스키마 자동생성
      status: 'ready'
  8.2 products.status → 'ready' 업데이트
  SSE: progress=100, step="완료!"

[OUTPUT]
  상세페이지 HTML (마켓 배포용)
  이미지 패키지 (마켓별 변환본, Supabase Storage)
  마켓 배포 폼 자동완성 데이터
  GEO JSON-LD 마크업
```

### 소요 시간 예측
| 구성 | 예상 시간 |
|-----|---------|
| 10장 생성 | 80 ~ 165초 (약 2~3분) |
| 15장 생성 | 120 ~ 240초 (약 2~4분) |
| 단계별 병목 | PHASE 5 (AI 이미지 생성) = 전체의 60% |

---

## 6. 상세페이지 유형 선택 가이드 (빠른 참조)

| 상황 | 추천 유형 | 이유 |
|-----|---------|------|
| 건강식품 기능성 상품 | 설득형 + 정보형 | 성분·근거가 구매 결정 핵심 |
| 경쟁 상품 많은 카테고리 | 비교형 | 차별화 포인트 직접 증명 필요 |
| MZ·감성 소비자 타깃 | 감성형 | 이미지가 욕구를 자극해야 함 |
| 브랜드 인지도 낮은 신규 | 리뷰형 | 타인 검증으로 구매 장벽 제거 |
| 프리미엄·고가 상품 | 스토리텔링형 | 가격 저항을 브랜드 가치로 극복 |
| 세일·이벤트 시즌 | 프로모션형 | 긴급성·희소성 자극 |
| 구성품 여러 개 상품 | 세트·번들형 | 가성비와 조합의 논리 |
| 처음 구매하는 카테고리 | 정보·교육형 | 배경 지식으로 구매 확신 부여 |

---

## 7. GEO JSON-LD 자동 생성

```typescript
// lib/utils/geo.ts
export function generateProductJsonLd(
  product: { title_optimized?: string; title_ko: string; description_ko: string; images: string[]; price_sell: number },
  url: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title_optimized ?? product.title_ko,
    description: product.description_ko,
    image: product.images,
    offers: {
      '@type': 'Offer',
      price: product.price_sell,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url,
    },
    brand: { '@type': 'Brand', name: 'NOMAD AI Factory' },
  }
}

// 페이지에 주입
export const injectJsonLd = (jsonLd: object) =>
  `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`
```

---

## 8. 금지어 필터 (건기식)

```typescript
// lib/api/banned-words.ts
const HEALTH_BANNED_WORDS = [
  '치료','치유','치료제','효능','효과가 있는','의약품','약품',
  '항암','항균','살균','멸균','탈모치료','발모','혈압강하',
  '당뇨치료','관절치료','면역치료','암예방','암치료',
  '콜레스테롤 낮추는','혈당 낮추는',
]

const REPLACEMENTS: Record<string, string> = {
  '치료': '관리에 도움을 줄 수 있는',
  '효능': '기능성',
  '효과': '도움',
  '항균': '청결 유지',
  '살균': '위생 관리',
}

export function filterBannedWords(text: string): {
  hasBannedWords: boolean; found: string[]; sanitized: string
} {
  const found: string[] = []
  let sanitized = text
  for (const word of HEALTH_BANNED_WORDS) {
    if (text.includes(word)) {
      found.push(word)
      sanitized = sanitized.replaceAll(word, REPLACEMENTS[word] ?? `[${word}→검토필요]`)
    }
  }
  return { hasBannedWords: found.length > 0, found, sanitized }
}

export function highlightBannedWords(text: string): string {
  let result = text
  for (const word of HEALTH_BANNED_WORDS)
    result = result.replaceAll(word, `<mark class="bg-red-100 text-red-700">${word}</mark>`)
  return result
}
```
