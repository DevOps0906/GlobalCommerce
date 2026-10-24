# CLAUDE.md — NOMAD AI Factory 개발 규칙

> **버전:** v3.0.0 | **Claude Code / Cursor / Lovable / v0 즉시 적용 가능**  
> **참조 문서:** @MARKET_IMAGE_SPEC.md · @MARKET_REGISTER_FORM.md · @DETAIL_PAGE_SYSTEM.md · @NOMAD_AI_FACTORY_MASTER_SPEC.md

---

## 0. 절대 규칙 (위반 불가)

```
✗ React Flow 노드 미연결 상태에서 자동화 로직 백그라운드 실행
✗ localStorage / sessionStorage 사용 (아티팩트 내부 금지)
✗ API 키·시크릿 코드 하드코딩 (반드시 .env.local)
✗ 서버 액션에서 인증 체크 없이 DB 접근
✗ <form> 태그 사용 → onClick/onChange 핸들러로 대체
✗ DALL-E에 한글 텍스트 직접 생성 요청 (깨짐) → Sharp.js로 후합성
✗ 버튼 배경 #00C9A7(WCAG 실패) → 반드시 #007A64 사용
✗ 플레이스홀더 색상 #CBD5E1(WCAG 실패) → 반드시 #94A3B8 사용
```

---

## 1. 기술 스택 (확정)

```json
{
  "framework":       "Next.js 16.2.7 (App Router)",
  "react":           "19.x",
  "typescript":      "5.x",
  "styling":         "Tailwind CSS v4",
  "ui-library":      "Shadcn UI (latest)",
  "state":           "Zustand 5.x",
  "data-fetching":   "TanStack Query v5",
  "automation-canvas":"@xyflow/react v11",
  "database":        "Supabase (PostgreSQL + RLS + Auth + Storage + Realtime)",
  "excel":           "SheetJS (xlsx)",
  "image-process":   "Sharp.js",
  "puppeteer":       "puppeteer (인포그래픽 HTML→PNG 렌더링)",
  "payment":         "TossPayments"
}
```

---

## 2. 프로젝트 구조

```
nomad-ai-factory/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # 인증 체크 + 사이드바/TopBar
│   │   │   ├── page.tsx                # 대시보드
│   │   │   ├── sourcing/page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx            # 상품 목록 (가상 스크롤)
│   │   │   │   ├── register/page.tsx   # 엑셀 업로드 카드 5종
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── detail-page/
│   │   │   │   ├── page.tsx            # 목록 + 3-Mode 모달 진입
│   │   │   │   └── [id]/page.tsx       # 에디터
│   │   │   ├── card-news/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── sales/page.tsx
│   │   │   ├── deploy/page.tsx         # 6-Step Wizard
│   │   │   ├── shorts/page.tsx
│   │   │   ├── automation/
│   │   │   │   ├── page.tsx            # 3-Mode 선택
│   │   │   │   ├── react-flow/page.tsx
│   │   │   │   ├── n8n/page.tsx
│   │   │   │   └── make/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── account/page.tsx
│   │   ├── api/
│   │   │   ├── sourcing/
│   │   │   │   ├── amazon/route.ts
│   │   │   │   └── excel/route.ts      # 5종 파서
│   │   │   ├── ai/
│   │   │   │   ├── storyline/route.ts  # 스토리라인 생성
│   │   │   │   ├── translate/route.ts
│   │   │   │   ├── optimize-title/route.ts
│   │   │   │   └── generate-detail/route.ts
│   │   │   ├── image/
│   │   │   │   ├── remove-bg/route.ts
│   │   │   │   ├── generate/route.ts   # DALL-E 3 / Flux
│   │   │   │   ├── composite/route.ts  # Sharp.js 텍스트 합성
│   │   │   │   ├── template/route.ts   # Puppeteer 렌더링
│   │   │   │   └── convert/route.ts    # 마켓별 변환
│   │   │   ├── detail-pages/
│   │   │   │   └── generate/route.ts   # SSE 스트림
│   │   │   ├── deploy/
│   │   │   │   ├── market/[type]/route.ts
│   │   │   │   └── sns/route.ts
│   │   │   ├── shorts/route.ts
│   │   │   ├── card-news/route.ts
│   │   │   ├── exchange-rate/route.ts  # 5개 통화
│   │   │   ├── automation/
│   │   │   │   ├── execute/route.ts    # React Flow 실행
│   │   │   │   └── emit/route.ts       # n8n/Make 이벤트 발송
│   │   │   └── webhook/
│   │   │       ├── n8n/callback/route.ts
│   │   │       └── make/callback/route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                         # Shadcn UI 기본
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx              # 환율 티커 2개
│   │   │   └── PageHeader.tsx
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx
│   │   │   ├── ExchangeRateWidget.tsx  # 5개 통화
│   │   │   └── TrendTable.tsx
│   │   ├── products/
│   │   │   ├── ProductTable.tsx        # 가상 스크롤
│   │   │   ├── BulkActionBar.tsx
│   │   │   ├── ExcelUploadCard.tsx     # 5종 탭
│   │   │   └── BannedWordAlert.tsx
│   │   ├── detail-page/
│   │   │   ├── GenerationModal.tsx     # 3-Mode 탭 모달
│   │   │   ├── SlotGrid.tsx            # 15슬롯 ON/OFF
│   │   │   ├── GenerationQueue.tsx     # 다중 큐 Progress
│   │   │   ├── DetailPageEditor.tsx
│   │   │   └── TemplateSelector.tsx
│   │   ├── deploy/
│   │   │   ├── MarketCheckboxCard.tsx
│   │   │   ├── AccountSelector.tsx
│   │   │   ├── DeployWizard.tsx        # 6-Step
│   │   │   └── DeployProgress.tsx
│   │   ├── automation/
│   │   │   ├── AutomationModeSelector.tsx
│   │   │   ├── FlowCanvas.tsx          # Mode A
│   │   │   ├── N8nConfig.tsx
│   │   │   ├── MakeConfig.tsx
│   │   │   └── nodes/
│   │   │       ├── SourcingNode.tsx · TranslateNode.tsx
│   │   │       ├── DetailPageNode.tsx · ShortsNode.tsx
│   │   │       └── MarketDeployNode.tsx · SnsDeployNode.tsx
│   │   └── shorts/
│   │       ├── ShortsGenerator.tsx
│   │       └── SnsDeployPanel.tsx
│   ├── lib/
│   │   ├── supabase/client.ts · server.ts · middleware.ts
│   │   ├── api/
│   │   │   ├── amazon.ts · naver-datalab.ts · exchange-rate.ts
│   │   │   ├── openrouter.ts · banned-words.ts
│   │   │   ├── image/
│   │   │   │   ├── remove-bg.ts · sharp-composite.ts
│   │   │   │   ├── puppeteer-renderer.ts   # HTML→PNG
│   │   │   │   └── market-converter.ts     # @MARKET_IMAGE_SPEC.md 기준
│   │   │   ├── sns/
│   │   │   │   └── youtube.ts · instagram.ts · facebook.ts · threads.ts · tiktok.ts
│   │   │   ├── automation/n8n.ts · make.ts
│   │   │   └── markets/
│   │   │       └── coupang.ts · smartstore.ts · gmarket.ts · auction.ts · street11.ts · lotteon.ts · cafe24.ts · imweb.ts
│   │   └── utils/
│   │       ├── excel-parser.ts         # 5종 지원
│   │       ├── currency-formatter.ts   # 세 자리 콤마
│   │       ├── price-calculator.ts     # USD→KRW 자동환산
│   │       └── geo.ts                  # JSON-LD 생성
│   ├── stores/
│   │   ├── useAuthStore.ts · useProductStore.ts
│   │   ├── useDetailPageGenStore.ts    # 생성 큐 핵심
│   │   ├── useDeployStore.ts · useSnsStore.ts
│   │   └── useWorkflowStore.ts
│   └── types/
│       ├── product.ts · market.ts · sns.ts
│       ├── detail-page-generation.ts  # GenerationJob·SubOptions
│       ├── automation.ts · supabase.ts
```

---

## 3. 환경변수 (.env.local — 절대 커밋 금지)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
OPENROUTER_API_KEY=
OPENAI_API_KEY=           # DALL-E 3
FAL_AI_KEY=               # Flux Pro

# 이미지
REMOVE_BG_API_KEY=

# 번역
DEEPL_API_KEY=

# TTS
ELEVENLABS_API_KEY=

# 환율 (5개 통화)
EXCHANGE_RATE_API_KEY=    # 한국수출입은행 or freecurrencyapi

# 네이버 데이터랩
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# SNS OAuth
YOUTUBE_CLIENT_ID= · YOUTUBE_CLIENT_SECRET=
META_APP_ID= · META_APP_SECRET=    # 인스타+페북+쓰레드 공통
TIKTOK_CLIENT_KEY= · TIKTOK_CLIENT_SECRET=

# 자동화
N8N_INSTANCE_URL= · N8N_API_KEY=
MAKE_API_KEY= · MAKE_TEAM_ID=
WEBHOOK_SECRET=           # HMAC 서명 검증용

# 마켓 API
COUPANG_ACCESS_KEY= · COUPANG_SECRET_KEY=
NAVER_COMMERCE_CLIENT_ID= · NAVER_COMMERCE_CLIENT_SECRET=

# 결제
TOSS_CLIENT_KEY= · TOSS_SECRET_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. Supabase 패턴

```typescript
// lib/supabase/client.ts — 클라이언트 컴포넌트용
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// lib/supabase/server.ts — Server Component / Route Handler용
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const createServerSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({name,value,options}) => cookieStore.set(name,value,options)) } }
  )
}
```

---

## 5. Route Handler 패턴 (인증 체크 필수)

```typescript
// 모든 Route Handler 공통 구조
export async function POST(req: NextRequest) {
  // 1. 인증 체크 (첫 번째)
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. 플랜 체크 (필요 시)
  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()

  // 3. 비즈니스 로직
  try {
    // ...
    return NextResponse.json({ data: result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

---

## 6. Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

---

## 7. 핵심 타입 정의

```typescript
// types/product.ts
export type SourceType = 'amazon' | 'ownerclan' | 'domeggook' | 'onchannel' | 'amazon_csv' | 'manual'
export type ProductStatus = 'draft' | 'generating' | 'queued' | 'ready' | 'deployed' | 'error'
export type MarketType = 'coupang' | 'smartstore' | 'gmarket' | 'auction' | 'street11' | 'lotteon' | 'cafe24' | 'imweb'
export type SnsPlatform = 'youtube' | 'instagram' | 'facebook' | 'threads' | 'tiktok'

export type PageType = 'persuasion' | 'social_proof' | 'lifestyle' | 'educational' | 'story' | 'comparison' | 'promotion' | 'bundle'

// types/detail-page-generation.ts
export type DetailPageGenMode = 'individual' | 'image_only' | 'bulk'

export interface GenerationJob {
  id: string
  product_id: string
  product_name: string
  mode: DetailPageGenMode
  sub_options: GenerationSubOptions
  status: 'queued' | 'running' | 'done' | 'failed'
  progress: number           // 0~100
  current_step: string       // "이미지 생성 중 D-3 (4/10)"
  queue_order: number
  started_at?: string
  finished_at?: string
  error?: string
  detail_page_id?: string
}

export interface GenerationSubOptions {
  page_type: PageType
  generate_title: boolean
  generate_description: boolean
  generate_images: boolean
  image_slots: string[]          // ['T-1','T-2','D-1',...]
  apply_template: string
  run_banned_word_check: boolean
  same_template_for_all?: boolean
  same_options_for_all?: boolean
}
```

---

## 8. 생성 큐 Zustand 스토어

```typescript
// stores/useDetailPageGenStore.ts
import { create } from 'zustand'

// 플랜별 동시 처리 수
export const PLAN_GENERATION_LIMITS = {
  free:       { maxConcurrent: 1, monthlyLimit: 10 },
  starter:    { maxConcurrent: 1, monthlyLimit: 100 },
  pro:        { maxConcurrent: 2, monthlyLimit: 500 },
  enterprise: { maxConcurrent: 5, monthlyLimit: null },
}

export const useDetailPageGenStore = create<DetailPageGenStore>((set, get) => ({
  queue: [],
  isRunning: false,
  maxConcurrent: 1,
  selectedProductIds: [],

  enqueueJobs: (productIds, mode, opts) => {
    const jobs: GenerationJob[] = productIds.map((pid, idx) => ({
      id: `job_${pid}_${Date.now()}_${idx}`,
      product_id: pid, product_name: '',
      mode, sub_options: opts,
      status: 'queued', progress: 0,
      current_step: '대기 중', queue_order: idx,
    }))
    set(s => ({ queue: [...s.queue, ...jobs] }))
  },

  startQueue: async () => {
    set({ isRunning: true })
    const pending = get().queue.filter(j => j.status === 'queued')

    for (const job of pending) {
      set(s => ({ queue: s.queue.map(j =>
        j.id === job.id ? { ...j, status: 'running', started_at: new Date().toISOString() } : j
      )}))

      try {
        // SSE 스트림으로 진행률 수신
        const response = await fetch('/api/detail-pages/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: job.product_id, mode: job.mode, options: job.sub_options }),
        })
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value)
          const events = text.split('\n\n').filter(Boolean)
          for (const event of events) {
            const data = JSON.parse(event.replace('data: ', ''))
            set(s => ({ queue: s.queue.map(j =>
              j.id === job.id ? { ...j, progress: data.progress, current_step: data.step } : j
            )}))
          }
        }
        set(s => ({ queue: s.queue.map(j =>
          j.id === job.id ? { ...j, status: 'done', progress: 100, finished_at: new Date().toISOString() } : j
        )}))
      } catch (err) {
        set(s => ({ queue: s.queue.map(j =>
          j.id === job.id ? { ...j, status: 'failed', error: String(err) } : j
        )}))
      }
    }
    set({ isRunning: false })
  },

  cancelJob: (jobId) => set(s => ({
    queue: s.queue.map(j => j.id === jobId && j.status === 'queued'
      ? { ...j, status: 'failed', error: '취소됨' } : j)
  })),

  reorderQueue: (fromIdx, toIdx) => set(s => {
    const q = [...s.queue]
    const [moved] = q.splice(fromIdx, 1)
    q.splice(toIdx, 0, moved)
    return { queue: q }
  }),
}))
```

---

## 9. SSE 생성 API Route

```typescript
// app/api/detail-pages/generate/route.ts
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { product_id, mode, options } = await req.json()

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()
  const send = async (progress: number, step: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ progress, step })}\n\n`))
  }

  ;(async () => {
    try {
      await send(5,  '상품 데이터 수집 중...')
      // PHASE 1: 번역
      await send(10, '번역 중...')
      // PHASE 2: 스토리라인 생성 (→ @DETAIL_PAGE_SYSTEM.md STORYLINE_MASTER_PROMPT)
      await send(20, '스토리라인 생성 중...')
      // PHASE 3: 상품명 최적화
      await send(30, '상품명 최적화 중...')
      // PHASE 4: 상세설명
      await send(40, '상세설명 생성 중...')
      // PHASE 5: 이미지 슬롯별 생성
      const slots = options.image_slots
      for (let i = 0; i < slots.length; i++) {
        const pct = 45 + Math.round((i / slots.length) * 40)
        await send(pct, `이미지 생성 중... ${slots[i]} (${i+1}/${slots.length})`)
        // AI씬 슬롯 → DALL-E 3, 인포그래픽 슬롯 → Puppeteer
        // → @DETAIL_PAGE_SYSTEM.md 섹션 5 참조
      }
      await send(88, '금지어 검사 중...')
      await send(93, 'GEO JSON-LD 생성 중...')
      await send(97, '마켓별 이미지 변환 중...')  // → @MARKET_IMAGE_SPEC.md 기준
      await send(100, '완료!')
    } catch (err) {
      await send(-1, `오류: ${String(err)}`)
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

---

## 10. 이미지 파이프라인 패턴

```typescript
// lib/api/image/market-converter.ts
// → @MARKET_IMAGE_SPEC.md THUMBNAIL_SPECS · DETAIL_IMAGE_SPECS 기준

import sharp from 'sharp'
import type { MarketType } from '@/types/product'

export async function convertThumbnailForMarket(
  masterBuffer: Buffer,  // 2000×2000 투명배경 PNG
  market: MarketType
): Promise<Buffer> {
  const spec = THUMBNAIL_SPECS[market]  // → @MARKET_IMAGE_SPEC.md
  return sharp(masterBuffer)
    .resize(spec.width, spec.height, { fit: 'contain', background: { r:255,g:255,b:255,alpha:1 } })
    .flatten({ background: '#FFFFFF' })
    .jpeg({ quality: spec.quality, mozjpeg: true })
    .toBuffer()
}

// lib/api/image/puppeteer-renderer.ts
// 인포그래픽·법적고지 슬롯 → HTML 템플릿 → Puppeteer → PNG
// ※ 한글 폰트 완벽 지원, 텍스트 정확도 AI보다 100배 높음
export async function renderSlotFromTemplate(
  slotCode: string,       // 'D-2', 'D-5', 'L-1' 등
  data: TemplateData,
  width = 1200,
  height = 900
): Promise<Buffer> {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 2 })
  const html = buildSlotHTML(slotCode, data)  // Noto Sans KR 로드
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const buffer = await page.screenshot({ type: 'png', fullPage: false })
  await browser.close()
  return buffer as Buffer
}

// 텍스트 합성 (AI 이미지 + 한글 카피)
// ※ DALL-E 이미지 위에 Sharp로 한글 카피 후합성 → 깨짐 없음
export async function compositeText(
  bgBuffer: Buffer,
  text: string,
  options: { x: number; y: number; font: string; fontSize: number; color: string }
): Promise<Buffer> {
  // SVG 텍스트 레이어 생성 → Sharp composite
  const svg = `<svg>...</svg>` // Noto Sans KR 경로 기반
  return sharp(bgBuffer).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).toBuffer()
}
```

---

## 11. 엑셀 파서 (5종)

```typescript
// lib/utils/excel-parser.ts
export const EXCEL_UPLOAD_TYPES = {
  ownerclan:   { label:'오너클랜', extensions:['.xlsx'] },
  domeggook:   { label:'도매꾹',   extensions:['.xlsx','.xls'] },
  onchannel:   { label:'온채널',   extensions:['.xls','.xlsx'] },
  amazon_csv:  { label:'아마존CSV', extensions:['.csv'] },
  custom:      { label:'직접업로드', extensions:['.xlsx','.xls','.csv'] },
}

const FIELD_MAPS: Record<string, Record<string, string>> = {
  ownerclan:  { '상품코드':'asin', '상품명':'title_original', '소비자가':'price_sell', '공급가':'price_source', '이미지URL':'images' },
  domeggook:  { '상품ID':'asin',  '상품명':'title_original', '판매가':'price_sell', '도매가':'price_source' },
  onchannel:  { '상품번호':'asin','상품명':'title_original', '도매가':'price_source' },
  amazon_csv: { 'ASIN':'asin',  'Title':'title_original', 'Price':'price_source', 'Image URL':'images' },
}
```

---

## 12. 통화 포맷 유틸

```typescript
// lib/utils/currency-formatter.ts

// 세 자리 콤마 필수 — 모든 금액 표시에 사용
export const formatKRW = (amount: number, style: 'symbol'|'unit' = 'symbol') => {
  const formatted = new Intl.NumberFormat('ko-KR').format(Math.round(amount))
  return style === 'symbol' ? `₩${formatted}` : `${formatted}원`
}
// formatKRW(29000)          → "₩29,000"
// formatKRW(149000, 'unit') → "149,000원"

export const formatPlanPrice = (amount: number, period: 'monthly'|'yearly') => {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount)
  return period === 'monthly' ? `${formatted}원/월` : `${formatted}원/년`
}
// formatPlanPrice(69000, 'monthly') → "69,000원/월"

export const formatExchangeRate = (rate: number, currency: string) =>
  new Intl.NumberFormat('ko-KR', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(rate)
// JPY는 100엔 기준 표시
```

---

## 13. 자동화 이벤트 발송

```typescript
// lib/api/automation/emit.ts
type AutomationEvent = 'product.sourced' | 'detail_page.created' | 'shorts.rendered' | 'card_news.created' | 'market.uploaded'

export async function emitAutomationEvent(
  userId: string,
  event: AutomationEvent,
  data: Record<string, unknown>
) {
  const supabase = await createServerSupabase()
  const { data: config } = await supabase
    .from('automation_configs')
    .select('*').eq('user_id', userId).eq('is_active', true).single()
  if (!config?.webhook_url) return

  const payload = { event, user_id: userId, data, timestamp: new Date().toISOString() }
  const signature = await generateHmacSignature(JSON.stringify(payload), process.env.WEBHOOK_SECRET!)

  try {
    await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'X-Nomad-Signature':signature, 'X-Nomad-Event':event },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error(`[AutomationEmit] ${event} 실패:`, err)
    // 발송 실패는 메인 플로우를 중단시키지 않음
  }
}
```

---

## 14. React Flow 캔버스 규칙

```typescript
// components/automation/FlowCanvas.tsx — Mode A

// 핵심 규칙: 엣지(연결선)가 없으면 실행 버튼 비활성화
const canExecute = edges.length > 0 && nodes.length > 1

// 연결 안내 메시지 (노드 있지만 연결 없을 때)
{nodes.length > 0 && edges.length === 0 && (
  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200
                  rounded-lg px-4 py-2 text-sm text-amber-700">
    ⚠️ 노드를 연결해야 워크플로우가 활성화됩니다
  </div>
)}

// 실행 버튼
<button
  onClick={executeWorkflow}
  disabled={!canExecute || isRunning}
  className="px-4 py-2 bg-[#007A64] text-white rounded-md font-semibold
             disabled:opacity-40 disabled:cursor-not-allowed"
>
  {isRunning ? '실행 중...' : '▶ 실행'}
</button>
```

---

## 15. 코딩 컨벤션

```
[네이밍]
  컴포넌트: PascalCase (ProductTable.tsx)
  훅: camelCase + use 접두사 (useProducts.ts)
  상수: UPPER_SNAKE_CASE
  타입/인터페이스: PascalCase

[컴포넌트]
  Server Component 우선, 클라이언트 상태 필요 시만 'use client'
  cn() 유틸리티 사용 (clsx + tailwind-merge)

[금액 표시]
  모든 금액: formatKRW() 또는 formatPlanPrice() 함수 반드시 사용
  직접 숫자 표시 금지 (세 자리 콤마 누락 방지)

[버튼 텍스트]
  반드시 동사로 시작: "생성 시작" "저장하기" "배포하기"
  모호한 레이블 금지: "확인" "OK"

[이미지 처리]
  마켓별 변환: → @MARKET_IMAGE_SPEC.md THUMBNAIL_SPECS 기준
  인포그래픽 슬롯: Puppeteer 렌더링 (AI 생성 금지)
  한글 텍스트: Sharp.js composite (DALL-E 직접 생성 금지)

[접근성]
  버튼 배경 #007A64 사용 (WCAG AA)
  플레이스홀더 #94A3B8 사용 (WCAG AA)
  Progress Bar: role="progressbar" aria-valuenow 필수
  prefers-reduced-motion: 모든 animation 처리 필수

[상태 관리]
  서버 데이터: TanStack Query (useQuery·useMutation)
  클라이언트 전역: Zustand
  폼 상태: React 로컬 useState

[성능]
  DataTable 5,000개+: react-window 가상 스크롤 필수
  이미지: next/image 컴포넌트 필수
  polling 금지: SSE 또는 Supabase Realtime 사용
```

---

## 16. 초기 세팅 명령어

```bash
npx create-next-app@latest nomad-ai-factory \
  --typescript --tailwind --app --src-dir --import-alias "@/*"

npm install @supabase/ssr @supabase/supabase-js \
  zustand @tanstack/react-query @xyflow/react \
  xlsx sharp puppeteer \
  lucide-react clsx tailwind-merge \
  react-window

npx shadcn@latest init

npx shadcn@latest add \
  button card input label select textarea \
  table badge checkbox progress tabs \
  dialog sheet popover tooltip \
  dropdown-menu separator toast form switch avatar slider

npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

---

## 17. MVP 체크리스트

```
Phase 1 (필수):
□ 멀티테넌트 DB + RLS 설계
□ Supabase Auth (이메일·소셜)
□ TossPayments 구독 결제 (4플랜)
□ 대시보드 (KPI + 5개 환율)
□ 아마존 URL 소싱 → 상품DB 저장만
□ 엑셀 5종 파서 + 업로드 카드
□ 상세페이지 3-Mode 생성 + 큐 시스템
□ AI 이미지 10~15장 (DALL-E + Puppeteer + Sharp)
□ 금지어 필터 (건기식)
□ 쿠팡 Wing API 배포
□ 스마트스토어 API 배포
□ 마켓별 6-Step 배포 폼
□ Progress Bar + SSE 스트림

Phase 2 (고도화):
□ 카드뉴스 생성 (5/8/10장)
□ 쇼츠 자동 생성 (15/30/50초)
□ SNS 5채널 배포
□ 지마켓·옥션·11번가·롯데온·카페24·아임웹
□ Mode A: React Flow 자동화
□ Mode B: n8n Webhook
□ Mode C: Make Webhook
□ 네이버 TOP100 트렌드 연동
□ Vector DB 임베딩 + GEO JSON-LD
```
