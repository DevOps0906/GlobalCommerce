# MARKET_IMAGE_SPEC.md — 마켓별 이미지 규격 & 자동변환 파이프라인

> **버전:** v3.0.0 | **연동:** PRD.md §6.3 · CLAUDE.md §10 · DETAIL_PAGE_SYSTEM.md §3  
> **원칙:** 마스터 소스 1장 → Sharp.js → 마켓별 자동파생. 텍스트는 항상 Sharp 후합성.

---

## 1. 핵심 원칙

```
[절대 규칙]
1. DALL-E / Flux로 한글 텍스트 직접 생성 금지 → 반드시 Sharp.js composite
2. 마스터 소스: 대표이미지 2000×2000px 투명 PNG / 상세이미지 1200px 폭 PNG
3. 마켓 변환은 항상 마스터에서 파생 (중간 변환본에서 재변환 금지)
4. 쿠팡 대표이미지: 텍스트·로고·배너 오버레이 전면 금지
5. 인포그래픽·법적고지: AI 생성 금지 → Puppeteer HTML 렌더링만 사용
```

---

## 2. 마켓별 대표이미지(썸네일) 규격

| 마켓 | 권장 | 최소 | 비율 | 배경 | 형식 | 최대용량 | 최대장수 |
|-----|------|------|------|------|------|---------|---------|
| **쿠팡** | 1,000×1,000 | 1,000×1,000 | 1:1 정사각 | #FFFFFF 순백 **필수** | JPG | 5MB | 10장 |
| **스마트스토어** | 1,000×1,000 | 500×500 | 1:1 권장 | 흰색 권장 | JPG·PNG | 10MB | 10장 |
| **지마켓** | 1,000×1,000 | 700×700 | 1:1 권장 | 흰색 권장 | JPG·PNG | 5MB | 9장 |
| **옥션** | 1,000×1,000 | 700×700 | 1:1 권장 | 흰색 권장 | JPG·PNG | 5MB | 9장 |
| **11번가** | 1,000×1,000 | 500×500 | 1:1 권장 | 흰색 권장 | JPG·PNG | **3MB** | 10장 |
| **롯데온** | 1,000×1,000 | 500×500 | 1:1 권장 | 흰색 권장 | JPG·PNG | 5MB | **5장** |
| **카페24** | 1,200×1,200 | 800×800 | 1:1 권장 | 자유 | JPG·PNG·WebP | 제한없음 | 제한없음 |
| **아임웹** | 1,200×1,200 | 600×600 | 1:1 권장 | 자유 | JPG·PNG·GIF | 제한없음 | 제한없음 |

### 쿠팡 대표이미지 금지 규칙 (위반 시 리스팅 삭제)
```
✗ 텍스트·문구 오버레이 (할인율, 브랜드명, 제품명 등)
✗ 브랜드 로고 추가 (원래 제품 패키지 로고 제외)
✗ 할인표시·프로모션 문구
✗ 그림자·테두리·장식효과
✓ 상품이 이미지 면적의 85% 이상 차지 필수
✓ 상품 중앙 정렬 필수
✓ 배경 순백색 (#FFFFFF) 필수
```

---

## 3. 마켓별 상세이미지 규격

| 마켓 | 권장 가로 | 장당 최대 세로 | 분할 임계값 | 최대용량 | 최대장수 | GIF | 특이사항 |
|-----|---------|-------------|-----------|---------|---------|-----|---------|
| **쿠팡** | 1,000px | 3,000px | 2,800px | 20MB | 20장 | ✗ | 모바일 80%+ 트래픽 |
| **스마트스토어** | 860px | 5,000px | 4,800px | 20MB | 무제한 | ✓ | HTML+이미지 혼합 가능 |
| **지마켓** | 860px | 4,000px | 3,800px | 10MB | 무제한 | ✗ | ESM+ 등록 |
| **옥션** | 860px | 4,000px | 3,800px | 10MB | 무제한 | ✗ | ESM+ 공통 |
| **11번가** | 831px | 제한없음 | 3,000px | 10MB | 무제한 | ✗ | 831px 실사용 권장 |
| **롯데온** | 860px | 3,000px | 2,800px | 10MB | 15장 | ✗ | 모바일/PC 공용 |
| **카페24** | 1,200px | 무제한 | 5,000px | 제한없음 | 무제한 | ✓ | 자동 리사이징 |
| **아임웹** | 1,200px | 무제한 | 5,000px | 제한없음 | 제한없음 | ✓ | 자유 설정 |

### SNS 콘텐츠 규격 (참고)
| 채널 | 피드/카드뉴스 | 쇼츠·릴스 커버 |
|-----|------------|-------------|
| 인스타그램 | 1,080×1,080 (1:1) | 1,080×1,920 (9:16) |
| 페이스북 | 1,200×630 (1.91:1) | 1,080×1,920 (9:16) |
| 쓰레드 | 1,080×1,080 (1:1) | — |
| 틱톡 | — | 1,080×1,920 (9:16) |
| 유튜브 쇼츠 | 썸네일 1,280×720 | 1,080×1,920 (9:16) |

---

## 4. 15슬롯 전체 정의

### 슬롯 코드 체계
```
T = Thumbnail (대표이미지 그룹)   → T-1 ~ T-5
D = Detail    (상세이미지 그룹)   → D-1 ~ D-10
L = Legal     (법적고지 그룹)     → L-1 ~ L-3
```

### T 그룹 (대표이미지 5슬롯)

| 코드 | 이름 | 설명 | 생성 방식 | 마스터 규격 | 필수 |
|-----|------|------|---------|-----------|-----|
| **T-1** | 메인 대표 (흰배경) | 제품 단독 순백 배경 정면샷. 전 마켓 공통 | Remove.bg + Sharp (흰배경 합성) | 2000×2000 PNG | ✅ 필수 |
| **T-2** | 라이프스타일 대표 | 제품 + 감성 배경 씬. 추가이미지 1번 | DALL-E 3 (배경 생성 + 제품 합성) | 2000×2000 PNG | ✅ 필수 |
| **T-3** | 각도 2컷 | 45도 또는 후면 컷. 추가이미지 2번 | Sharp (원본 회전·크롭) | 2000×2000 PNG | ⬜ 선택 |
| **T-4** | 구성품 전체 컷 | 패키지 구성품 나열 | AI 생성 + 배치 | 2000×2000 PNG | ⬜ 선택 |
| **T-5** | 인증 강조 컷 | NSF·GMP·수상 뱃지 포함 | Puppeteer 템플릿 | 2000×2000 PNG | ⬜ 선택 |

### D 그룹 (상세이미지 10슬롯)

| 코드 | 이름 | 설명 | 생성 방식 | 마스터 가로 | 최대 세로 | 필수 |
|-----|------|------|---------|-----------|---------|-----|
| **D-1** | 훅 배너 | 페인포인트 → 솔루션. 스크롤 첫 진입 | DALL-E 3 씬 + Sharp 텍스트합성 | 1,200px | 1,200px | ✅ 필수 |
| **D-2** | 성분 인포그래픽 | 핵심 성분 3~5개 시각화 (아이콘+수치) | **Puppeteer HTML 렌더링** | 1,200px | 2,400px | ✅ 필수 |
| **D-3** | 라이프스타일 씬 #1 | 사용 상황 연출 | DALL-E 3 / Flux Pro | 1,200px | 1,800px | ✅ 필수 |
| **D-4** | 라이프스타일 씬 #2 | 다른 각도·상황 연출 | DALL-E 3 / Flux Pro | 1,200px | 1,800px | ⬜ 선택 |
| **D-5** | 특징 비교 인포그래픽 | 자사 vs 경쟁 비교표 | **Puppeteer HTML 렌더링** | 1,200px | 2,400px | ✅ 필수 |
| **D-6** | Before/After 비교 | 사용 전후 효과 | DALL-E 3 각씬 + Sharp 분할합성 | 1,200px | 2,400px | ⬜ 선택 |
| **D-7** | 상세 성분표·사양표 | 전성분 또는 상세스펙 | **Puppeteer HTML 렌더링** | 1,200px | 3,000px | ✅ 필수 |
| **D-8** | 섭취·사용방법 | STEP 1/2/3 인포그래픽 | **Puppeteer HTML 렌더링** | 1,200px | 2,400px | ⬜ 선택 |
| **D-9** | 인증·수상 뱃지 | NSF·USP·GMP·특허 | SVG 템플릿 → PNG | 1,200px | 1,200px | ⬜ 선택 |
| **D-10** | 배송 안내 | 해외배송 안내 (조건부) | **Puppeteer HTML 렌더링** | 1,200px | 1,800px | 조건부 |

### L 그룹 (법적고지 3슬롯 — 항상 Puppeteer)

| 코드 | 이름 | 설명 | 조건 | 생성 방식 |
|-----|------|------|------|---------|
| **L-1** | 건기식 필수 고지 | 식약처 고시 면책문구 | 건강식품 카테고리 자동 ON | **Puppeteer HTML 렌더링** |
| **L-2** | 원산지·제조사 정보 | 원산지·제조사·수입원 고시 | 해외상품 자동 ON | **Puppeteer HTML 렌더링** |
| **L-3** | 브랜드 마무리 CTA | 구매 유도 + 브랜드 | 항상 ON | **Puppeteer HTML 렌더링** |

---

## 5. 10장 vs 15장 슬롯 배분

### 10장 구성 (표준형 — 기본값)
```
#1  T-1  대표이미지 흰배경         → 마켓 메인 썸네일
#2  T-2  라이프스타일 대표          → 추가이미지 #1
#3  D-1  훅 배너 (페인포인트)       → 스크롤 첫인상
#4  D-2  성분 인포그래픽            → 핵심 정보
#5  D-3  라이프스타일 씬 #1         → 감성 연출
#6  D-5  특징 비교 인포그래픽       → 경쟁 우위
#7  D-7  상세 성분표·사양표         → 신뢰도
#8  D-8  섭취·사용방법              → 구매 후 안내
#9  D-9  인증·수상 뱃지             → 최종 신뢰
#10 L-3  CTA 마무리                 → 전환 유도

적합: 단가 3만원 이하 · 오픈마켓 위주 · 테스트 상품 · 빠른 제작
```

### 15장 구성 (풀패키지형)
```
#1  T-1  대표이미지 흰배경
#2  T-2  라이프스타일 대표
#3  T-3  각도 2컷
#4  D-1  훅 배너
#5  D-2  성분 인포그래픽
#6  D-3  라이프스타일 씬 #1
#7  D-4  라이프스타일 씬 #2
#8  D-5  특징 비교 인포그래픽
#9  D-6  Before/After 비교
#10 D-7  상세 성분표·사양표
#11 D-8  섭취·사용방법
#12 D-9  인증·수상 뱃지
#13 D-10 배송 안내 (해외직구)
#14 L-1  건기식 필수 고지
#15 L-3  CTA 마무리

적합: 단가 5만원 이상 · 카페24·아임웹 자체몰 · 건강식품 주력 · 경쟁 치열 카테고리
```

---

## 6. 슬롯별 생성 엔진 선택 기준

```
AI 이미지 생성 (DALL-E 3 / Flux Pro):
  T-2  라이프스타일 대표     씬·배경 생성
  D-1  훅 배너              씬 생성 (텍스트는 Sharp 후합성)
  D-3  라이프스타일 씬 #1   씬 생성
  D-4  라이프스타일 씬 #2   씬 생성
  D-6  Before/After        각 씬 생성

Sharp.js 이미지 처리:
  T-1  흰배경 대표          Remove.bg 누끼 + 흰배경 합성 + 마켓 리사이즈
  T-3  각도 2컷             원본 회전·크롭 처리
  ALL  텍스트 합성          AI 이미지 + 한글 카피 후합성 (DALL-E 한글 금지)

Puppeteer HTML → PNG 렌더링:
  D-2  성분 인포그래픽       HTML 3열 레이아웃
  D-5  비교 인포그래픽       HTML 비교표
  D-7  성분표·사양표         HTML 테이블
  D-8  섭취·사용방법         HTML STEP 레이아웃
  D-9  인증 뱃지             SVG 뱃지 배열
  D-10 배송 안내             HTML 안내 레이아웃
  L-1  건기식 고지           HTML 텍스트 블록
  L-2  원산지 정보           HTML 텍스트 블록
  L-3  CTA 마무리            HTML CTA 레이아웃

Puppeteer 선택 이유:
  - Noto Sans KR 폰트 완벽 로드 (한글 깨짐 없음)
  - HTML/CSS = 픽셀 완벽 제어
  - 텍스트·표·인포그래픽 정확도 AI보다 월등
  - deviceScaleFactor:2 → 레티나 해상도 자동
```

---

## 7. TypeScript 규격 정의

```typescript
// lib/api/image/market-image-specs.ts

export type MarketType = 'coupang' | 'smartstore' | 'gmarket' | 'auction' | 'street11' | 'lotteon' | 'cafe24' | 'imweb'

export interface ThumbnailSpec {
  width: number
  height: number
  format: 'jpeg' | 'png' | 'webp'
  quality: number
  background: string
  maxFileSizeMB: number
  maxCount: number
  rules: string[]
}

export interface DetailImageSpec {
  width: number
  maxHeight: number | null
  format: 'jpeg' | 'png'
  quality: number
  maxFileSizeMB: number
  maxCount: number | null
  splitAt: number
  gifAllowed: boolean
}

export const THUMBNAIL_SPECS: Record<MarketType, ThumbnailSpec> = {
  coupang: {
    width: 1000, height: 1000, format: 'jpeg', quality: 92,
    background: '#FFFFFF', maxFileSizeMB: 5, maxCount: 10,
    rules: [
      '텍스트·문구 오버레이 금지',
      '브랜드 로고 추가 금지 (제품 원래 로고 제외)',
      '할인표시·프로모션 문구 금지',
      '그림자·테두리·장식효과 금지',
      '상품이 면적의 85% 이상 차지 필수',
      '상품 중앙 정렬 필수',
      '배경 순백색(#FFFFFF) 필수',
    ],
  },
  smartstore: {
    width: 1000, height: 1000, format: 'jpeg', quality: 90,
    background: '#FFFFFF', maxFileSizeMB: 10, maxCount: 10,
    rules: ['1000px↑ 시 줌인 기능 자동 활성화'],
  },
  gmarket: {
    width: 1000, height: 1000, format: 'jpeg', quality: 90,
    background: '#FFFFFF', maxFileSizeMB: 5, maxCount: 9,
    rules: ['ESM+ 등록 기준', '최소 700×700px'],
  },
  auction: {
    width: 1000, height: 1000, format: 'jpeg', quality: 90,
    background: '#FFFFFF', maxFileSizeMB: 5, maxCount: 9,
    rules: ['ESM+ 공통 (지마켓과 동일)'],
  },
  street11: {
    width: 1000, height: 1000, format: 'jpeg', quality: 90,
    background: '#FFFFFF', maxFileSizeMB: 3, maxCount: 10,
    rules: ['최대 3MB 엄격 적용', '최소 500×500px'],
  },
  lotteon: {
    width: 1000, height: 1000, format: 'jpeg', quality: 90,
    background: '#FFFFFF', maxFileSizeMB: 5, maxCount: 5,
    rules: ['대표 1장 + 추가 최대 4장'],
  },
  cafe24: {
    width: 1200, height: 1200, format: 'png', quality: 95,
    background: '#FFFFFF', maxFileSizeMB: 99, maxCount: 999,
    rules: ['카페24 자동 리사이징 지원'],
  },
  imweb: {
    width: 1200, height: 1200, format: 'png', quality: 95,
    background: '#FFFFFF', maxFileSizeMB: 99, maxCount: 999,
    rules: ['자유 설정'],
  },
}

export const DETAIL_IMAGE_SPECS: Record<MarketType, DetailImageSpec> = {
  coupang:      { width: 1000, maxHeight: 3000, format: 'jpeg', quality: 88, maxFileSizeMB: 20, maxCount: 20,   splitAt: 2800, gifAllowed: false },
  smartstore:   { width: 860,  maxHeight: 5000, format: 'jpeg', quality: 88, maxFileSizeMB: 20, maxCount: null, splitAt: 4800, gifAllowed: true },
  gmarket:      { width: 860,  maxHeight: 4000, format: 'jpeg', quality: 85, maxFileSizeMB: 10, maxCount: null, splitAt: 3800, gifAllowed: false },
  auction:      { width: 860,  maxHeight: 4000, format: 'jpeg', quality: 85, maxFileSizeMB: 10, maxCount: null, splitAt: 3800, gifAllowed: false },
  street11:     { width: 831,  maxHeight: null, format: 'jpeg', quality: 85, maxFileSizeMB: 10, maxCount: null, splitAt: 3000, gifAllowed: false },
  lotteon:      { width: 860,  maxHeight: 3000, format: 'jpeg', quality: 85, maxFileSizeMB: 10, maxCount: 15,   splitAt: 2800, gifAllowed: false },
  cafe24:       { width: 1200, maxHeight: null, format: 'png',  quality: 90, maxFileSizeMB: 99, maxCount: null, splitAt: 5000, gifAllowed: true },
  imweb:        { width: 1200, maxHeight: null, format: 'png',  quality: 90, maxFileSizeMB: 99, maxCount: null, splitAt: 5000, gifAllowed: true },
}
```

---

## 8. 자동변환 구현 (Sharp.js)

```typescript
// lib/api/image/market-converter.ts
import sharp from 'sharp'
import { THUMBNAIL_SPECS, DETAIL_IMAGE_SPECS } from './market-image-specs'

/** 마스터 대표이미지(2000×2000 투명PNG) → 마켓별 썸네일 */
export async function convertThumbnailForMarket(
  masterBuffer: Buffer,
  market: MarketType
): Promise<Buffer> {
  const spec = THUMBNAIL_SPECS[market]
  return sharp(masterBuffer)
    .resize(spec.width, spec.height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: '#FFFFFF' })
    .jpeg({ quality: spec.quality, mozjpeg: true })
    .toBuffer()
}

/** 마스터 상세이미지(1200px폭 PNG) → 마켓별 리사이즈 + 자동분할 */
export async function convertDetailImagesForMarket(
  masterBuffers: Buffer[],
  market: MarketType
): Promise<{ index: number; buffer: Buffer; width: number; height: number }[]> {
  const spec = DETAIL_IMAGE_SPECS[market]
  const results: { index: number; buffer: Buffer; width: number; height: number }[] = []
  let idx = 0

  for (const masterBuffer of masterBuffers) {
    const resized = await sharp(masterBuffer)
      .resize(spec.width, undefined, { fit: 'inside', withoutEnlargement: false })
      .jpeg({ quality: spec.quality })
      .toBuffer()

    const { height = 0 } = await sharp(resized).metadata()

    if (spec.splitAt && height > spec.splitAt) {
      const chunks = Math.ceil(height / spec.splitAt)
      for (let i = 0; i < chunks; i++) {
        const top = i * spec.splitAt
        const chunkH = Math.min(spec.splitAt, height - top)
        const chunk = await sharp(resized)
          .extract({ left: 0, top, width: spec.width, height: chunkH })
          .jpeg({ quality: spec.quality })
          .toBuffer()
        results.push({ index: idx++, buffer: chunk, width: spec.width, height: chunkH })
      }
    } else {
      results.push({ index: idx++, buffer: resized, width: spec.width, height })
    }
  }
  return results
}

/** 전 마켓 썸네일 일괄 생성 */
export async function generateAllMarketThumbnails(
  masterBuffer: Buffer,
  targetMarkets: MarketType[]
): Promise<Record<MarketType, Buffer>> {
  const results: Partial<Record<MarketType, Buffer>> = {}
  await Promise.all(
    targetMarkets.map(async (market) => {
      results[market] = await convertThumbnailForMarket(masterBuffer, market)
    })
  )
  return results as Record<MarketType, Buffer>
}
```

---

## 9. Puppeteer 인포그래픽 렌더러

```typescript
// lib/api/image/puppeteer-renderer.ts
import puppeteer from 'puppeteer'

export interface SlotTemplateData {
  title?: string
  items?: { icon: string; title: string; desc: string }[]
  rows?: string[][]
  columns?: string[]
  steps?: { no: number; title: string; desc: string }[]
  badges?: string[]
  disclaimer?: string[]
  cta_text?: string
  cta_sub?: string
  accent_color?: string   // 기본 #00C9A7
}

/** 슬롯 코드 → HTML 템플릿 → PNG 버퍼 */
export async function renderSlotTemplate(
  slotCode: string,
  data: SlotTemplateData,
  width = 1200,
  height = 900
): Promise<Buffer> {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 2 })

  const html = buildSlotHTML(slotCode, data)
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const buffer = await page.screenshot({ type: 'png', fullPage: false }) as Buffer
  await browser.close()
  return buffer
}

function buildSlotHTML(slotCode: string, data: SlotTemplateData): string {
  const accent = data.accent_color ?? '#00C9A7'
  const baseStyle = `
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Noto Sans KR',sans-serif; background:#fff; }
      .wrap { display:flex; align-items:center; justify-content:center;
              width:1200px; min-height:900px; padding:60px; }
    </style>`

  const templates: Record<string, string> = {
    'D-2': `<!DOCTYPE html><html><head>${baseStyle}<style>
      .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:32px; width:100%; }
      .item { text-align:center; padding:40px 24px; border-radius:16px; background:#F8FAFC; }
      .icon { font-size:52px; margin-bottom:16px; }
      .ttl  { font-size:22px; font-weight:700; color:${accent}; margin-bottom:10px; }
      .dsc  { font-size:15px; color:#475569; line-height:1.6; }
      h2    { text-align:center; font-size:30px; font-weight:900; color:#0F172A; margin-bottom:48px; }
    </style></head><body><div class="wrap"><div style="width:100%">
      <h2>${data.title ?? ''}</h2>
      <div class="grid">${(data.items ?? []).map(i => `
        <div class="item">
          <div class="icon">${i.icon}</div>
          <div class="ttl">${i.title}</div>
          <div class="dsc">${i.desc.replace(/\n/g,'<br>')}</div>
        </div>`).join('')}
      </div></div></div></body></html>`,

    'D-5': `<!DOCTYPE html><html><head>${baseStyle}<style>
      table { width:100%; border-collapse:collapse; }
      th { background:${accent}; color:#fff; padding:16px 20px; font-size:16px; font-weight:700; }
      td { padding:14px 20px; font-size:15px; border-bottom:1px solid #E2E8F0; }
      tr:nth-child(even) td { background:#F8FAFC; }
      td:first-child { color:#94A3B8; }
      td:last-child { color:#0F172A; font-weight:500; }
      h2 { text-align:center; font-size:28px; font-weight:900; color:#0F172A; margin-bottom:36px; }
    </style></head><body><div class="wrap"><div style="width:100%">
      <h2>${data.title ?? ''}</h2>
      <table>
        <tr>${(data.columns ?? []).map(c => `<th>${c}</th>`).join('')}</tr>
        ${(data.rows ?? []).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
      </table></div></div></body></html>`,

    'D-8': `<!DOCTYPE html><html><head>${baseStyle}<style>
      .steps { display:flex; gap:24px; align-items:flex-start; width:100%; }
      .step  { flex:1; text-align:center; }
      .no    { width:52px; height:52px; border-radius:50%; background:${accent};
               color:#fff; font-size:22px; font-weight:900; display:flex;
               align-items:center; justify-content:center; margin:0 auto 16px; }
      .ttl   { font-size:18px; font-weight:700; color:#0F172A; margin-bottom:8px; }
      .dsc   { font-size:14px; color:#475569; line-height:1.6; }
      .arrow { font-size:28px; color:#CBD5E1; padding-top:10px; flex-shrink:0; }
      h2     { text-align:center; font-size:28px; font-weight:900; color:#0F172A; margin-bottom:48px; }
    </style></head><body><div class="wrap"><div style="width:100%">
      <h2>${data.title ?? '섭취 방법'}</h2>
      <div class="steps">${(data.steps ?? []).map((s, i, arr) => `
        <div class="step">
          <div class="no">${s.no}</div>
          <div class="ttl">${s.title}</div>
          <div class="dsc">${s.desc}</div>
        </div>${i < arr.length - 1 ? '<div class="arrow">→</div>' : ''}`).join('')}
      </div></div></div></body></html>`,

    'L-1': `<!DOCTYPE html><html><head>${baseStyle}<style>
      .box  { border:2px solid #E2E8F0; border-radius:12px; padding:40px; width:100%; }
      .head { font-size:20px; font-weight:900; color:#0F172A; margin-bottom:24px;
              padding-bottom:16px; border-bottom:2px solid ${accent}; }
      .item { font-size:15px; color:#475569; line-height:1.8; padding:6px 0;
              border-bottom:1px solid #F1F5F9; }
      .item:last-child { border-bottom:none; }
    </style></head><body><div class="wrap">
      <div class="box">
        <div class="head">⚠️ 구매 전 반드시 확인하세요</div>
        ${(data.disclaimer ?? []).map(d => `<div class="item">• ${d}</div>`).join('')}
      </div></div></body></html>`,

    'L-3': `<!DOCTYPE html><html><head>${baseStyle}<style>
      .cta  { text-align:center; width:100%; }
      .main { font-size:40px; font-weight:900; color:#0F172A; margin-bottom:16px; }
      .sub  { font-size:18px; color:#475569; margin-bottom:40px; }
      .btn  { display:inline-block; background:${accent}; color:#fff;
              padding:18px 48px; border-radius:9999px; font-size:20px;
              font-weight:700; margin-bottom:24px; }
    </style></head><body><div class="wrap">
      <div class="cta">
        <div class="main">${data.cta_text ?? '지금 바로 시작하세요'}</div>
        <div class="sub">${data.cta_sub ?? ''}</div>
        <div class="btn">구매하기</div>
        ${(data.disclaimer ?? []).map(d => `<div style="font-size:12px;color:#94A3B8;margin-top:4px">${d}</div>`).join('')}
      </div></div></body></html>`,
  }

  return templates[slotCode] ?? `<!DOCTYPE html><html><head>${baseStyle}</head>
    <body><div class="wrap"><p style="color:#94A3B8">슬롯 ${slotCode} 템플릿 없음</p></div></body></html>`
}
```

---

## 10. 규격 위반 자동 감지

```typescript
// lib/api/image/validator.ts
export function validateThumbnail(
  buffer: Buffer, width: number, height: number, market: MarketType
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const spec = THUMBNAIL_SPECS[market]
  const errors: string[] = []
  const warnings: string[] = []
  const fileSizeMB = buffer.byteLength / (1024 * 1024)

  if (width < spec.width || height < spec.height)
    errors.push(`해상도 부족: ${width}×${height}px (필요: ${spec.width}×${spec.height}px 이상)`)
  if (Math.abs(width / height - 1) > 0.02)
    errors.push(`비율 오류: ${width}:${height} (1:1 필수)`)
  if (fileSizeMB > spec.maxFileSizeMB)
    errors.push(`용량 초과: ${fileSizeMB.toFixed(1)}MB (최대 ${spec.maxFileSizeMB}MB)`)

  if (market === 'coupang') {
    warnings.push('텍스트·로고 오버레이 없는지 수동 확인 필요')
    warnings.push('상품이 이미지 면적의 85% 이상인지 확인')
  }
  if (market === 'street11' && fileSizeMB > 3)
    errors.push(`11번가 용량 초과: ${fileSizeMB.toFixed(1)}MB (최대 3MB)`)

  return { isValid: errors.length === 0, errors, warnings }
}
```

---

## 11. 유형별 기본 슬롯 세트

```typescript
// 상세페이지 유형별 기본 슬롯 선택 (10장 기준)
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

// 필수 슬롯 (항상 포함 — 최소 완성 기준)
export const MANDATORY_SLOTS = ['T-1', 'D-1', 'L-3']

// 카테고리별 자동 ON 슬롯
export const CATEGORY_AUTO_SLOTS: Record<string, string[]> = {
  health_food: ['L-1', 'L-2'],   // 건기식: 면책고지 + 원산지 자동
  overseas:    ['D-10', 'L-2'],  // 해외배송: 배송안내 + 원산지 자동
}
```
