# GlobalCommerce 개발 방법

작성일 2026-10-25. 이 문서는 `products/`의 기획서를 바탕으로 이 저장소 루트에서 GlobalCommerce 코드를 만들기 시작하는 방법을 처음부터 끝까지 안내합니다. "무엇을 만드는가"는 기획서가 정본이고, 이 문서는 "어떤 순서로, 누가, 어떻게 확인하며 만드는가"를 다룹니다. 결정과 ID는 `products/00_DECISIONS.md`(이하 00장)를 따르고, 문서끼리 다르면 00장이 이깁니다. 근거가 없는 값은 "제안", 외부 사실을 확인하지 않은 값은 "미확인"으로 씁니다.

벤치마크는 DevOps0906/platform-docs `develop/nomad-commerce/`(개발 안내서·산출물 등록부)와 DevOps0906/tablet-kiosk-core(`docs/11-multi-agent.md`, `tasks/README.md`의 팀·작업 흐름)입니다.

## 0. 한눈에 보기

**설치 스크립트는 없습니다.** 기획서(`products/`)와 코드(`apps/`, `services/`, `packages/`, `supabase/`)가 한 저장소에 있으므로 복사·붙여넣기 단계가 없고, 산출물 등록부(`develop/docs/file/_index.md`)는 실제 파일 경로를 그대로 가리킵니다.

| 단계 | 내용 | 절 |
|---|---|---|
| 준비 | 도구 설치, 웨이브별 계정·키 준비 | 2 |
| 1 | 저장소 구조 확인, 팀 구성 점검(`/agent-check`) | 3 |
| 2 | 로컬 DB 기동, 기획 SQL을 마이그레이션으로 적용 | 4 |
| 3 | 열린 결정(O-01~O-08) 중 다음 웨이브에 필요한 것 확정 | 5 |
| 4 | 작업 GC-06-001~049를 `tasks/task-###.md`로 변환 | 6 |
| 5 | 웨이브별 개발 사이클(W0 → W5가 R1) | 7 |
| - | 디자인 반영, AI 계층, 외부 연동 순서 | 8~10 |
| - | 검증과 완료 정의, 위험, 체크리스트 | 11~13 |
| - | 인증 단계(Mock → Google·이메일 → 카카오·네이버) | 14 |
| - | R2·R3 착수 체크리스트 | 부록 |

**지금 할 일**

1. 2절 도구를 설치하고 `claude` 실행 후 `/agent-check`로 팀 구성(11개 에이전트, 팀장 Opus 5.5)을 확인합니다.
2. O-03(추가 슬롯 가격)을 W1 전에 정할 수 있게 일정을 잡습니다. W0에는 막는 결정이 없습니다.
3. `tasks/README.md`에 49개 작업 표를 만들고 W0 작업 7개(001~007)의 task 파일을 씁니다(6절).
4. `/next-task 001`로 첫 작업(모노레포·CI)을 시작합니다.

## 1. 개요

| 항목 | 내용 |
|---|---|
| 제품 | 아마존·국내 위탁 상품을 수집해 AI로 상품명·대표 이미지·상세페이지를 만들고, 쿠팡·스마트스토어 여러 계정에 한 번에 올린 뒤 블로그·숏폼·SNS로 홍보까지 자동화하는 구매대행 셀러용 SaaS(00장 2절) |
| 화면 표기 브랜드 | NOMAD AI Factory(최종은 O-01) |
| 코어 앱 id | `globalcommerce` |
| DB | Supabase 프로젝트 1개, 코어 lite + 도메인 테이블 모두 `public` 스키마(00장 2절) |
| 릴리스 | R1(MVP) = W0~W5, R2 = W6(노드 캔버스, 실행 엔진, 블로그, 숏폼, SNS, 인증 C), R3 = W7(벡터 검색, JSON-LD)(GC-D-02) |
| 작업 수 | 49개(GC-06-001~049), 정본 `products/06_AGENT_PLAN.md` 2장 |
| 개발 근거 | 산출물 등록부 `develop/docs/file/_index.md`에 등록된 문서. task의 "참고 문서"는 여기 있는 ID와 경로만 씁니다 |
| 팀 | 팀장(주 세션 Opus 5.5)이 분해·위임·검토·커밋. 운영 규칙 정본은 `develop/MULTI_AGENT.md` |
| AI 범위(R1) | 서버 전용 `packages/ai`(OpenAI 기본, Anthropic 대체, fal 이미지). FastAPI·LangGraph·Dify·RAG·음성은 R1에 없음(GC-D-08) |

nomad-commerce와 다른 점은 00장 3절 "nomad-commerce와 차이" 열에 있습니다. 개발 방식에서 다른 점은 다음 세 가지입니다.

| 항목 | nomad-commerce | GlobalCommerce |
|---|---|---|
| 시작 방법 | 베이스 레포 복사 + setup 스크립트 + `build_root.py`로 묶음 생성 | 이 저장소에서 바로 시작. 스크립트 없음 |
| 산출물 위치 | `docs/file/01-관리/...`에 복사본 | 원래 위치(`products/`, `docs/`, `.claude/`)를 등록부가 가리킴 |
| 작업 기록 | `tasks/<ID>/task.md·context.md·log.md`, `gate.sh`·`scope_check.sh` 승인 게이트 | `tasks/README.md` 표 + `tasks/task-###.md` + 커밋(tablet-kiosk-core 방식) |

## 2. 사전 준비

### 2.1 로컬 도구

| 도구 | 용도 | 필요 시점 | 확인 |
|---|---|---|---|
| git, GitHub CLI(`gh`) | 저장소, PR | 처음부터 | `git --version`, `gh --version` |
| Node.js 22 LTS | `apps/web`, `services/worker`, `packages/*` | W0 | `node -v` |
| pnpm(corepack, 버전은 루트 `package.json`의 `packageManager`로 고정, 제안) | 모노레포 | W0 | `pnpm -v` |
| Docker Desktop(기준 환경, GC-D-26) | 로컬 Supabase 스택 + web·worker 컨테이너(`docker compose`) | W0 | `docker version`, `docker compose version` |
| Supabase CLI | `supabase start`, `db reset`, `test db`, `gen types` | W0 | `supabase --version` |
| Playwright 브라우저 | E2E(GC-06-033), 반응형 스크린샷(035) | W5 | `pnpm exec playwright --version` |
| FFmpeg | 숏폼 렌더 워커(GC-06-040) | R2(W6) | `ffmpeg -version` |
| Claude Code | 팀장 세션과 에이전트 | 처음부터 | `claude --version` |

Python은 R1에 필요하지 않습니다(FastAPI 없음, GC-D-08).

### 2.3 Docker Desktop 기준 로컬 환경(GC-D-26)

로컬 테스트의 기준은 Docker Desktop입니다. 명령 하나로 Supabase 로컬 스택, 웹, 워커가 함께 뜨고 시드 계정으로 바로 화면을 확인할 수 있어야 합니다(GC-06-001, 007 수용 기준).

| 구성 | 실행 방식 | 포트(기본) |
|---|---|---|
| Supabase(Postgres, Auth, Storage, Realtime, Studio) | Supabase CLI가 Docker 컨테이너로 기동(`supabase start`) | API 54321, DB 54322, Studio 54323 |
| 웹 `apps/web` | `docker-compose.yml`의 `web` 서비스(개발 모드, 소스 마운트로 즉시 반영) | 3000 |
| 워커 `services/worker` | `docker-compose.yml`의 `worker` 서비스(`services/worker/Dockerfile`, Sharp·Puppeteer·Noto Sans KR 포함, FFmpeg는 R2) | 없음(헬스체크만) |
| 외부 API(마켓, 결제, AI, 환율, 데이터랩) | 로컬 기본값은 가짜 어댑터(`*_PROVIDER=fake`). 키를 `.env.local`에 넣으면 실제 호출 | - |

| 순서 | 명령 | 설명 |
|---|---|---|
| 1 | `cp .env.example .env.local` | 로컬 값만. 실제 키는 넣지 않아도 가짜 어댑터로 동작 |
| 2 | `pnpm dev:docker` | `supabase start` → `supabase db reset` → 페르소나 시드 → `docker compose up` 순서를 묶은 스크립트(제안 이름) |
| 3 | `http://localhost:3000/login` | 개발용 로그인 패널에서 페르소나(owner, pro 등) 선택 |
| 4 | `pnpm dev:docker:down` | 컨테이너 정지(`docker compose down` + `supabase stop`) |

| 주의 | 내용 |
|---|---|
| Windows | Docker Desktop의 WSL2 백엔드를 쓰고, 저장소를 WSL 파일 시스템(예: `~/work/GlobalCommerce`)에 둔다. `D:\` 같은 Windows 드라이브에 두면 파일 감시와 빌드가 느리다(제안) |
| 컨테이너에서 Supabase 접속 | 웹·워커 컨테이너는 `host.docker.internal:54321`로 Supabase에 접속한다. 브라우저는 `localhost:54321` |
| 비밀 값 | `.env.local`은 커밋하지 않는다. 이미지에 키를 굽지 않는다(빌드 인자 금지, 런타임 env만) |
| 배포와의 관계 | 배포는 Vercel(web)·Railway(worker)다(02장 7절). 워커 Docker 이미지는 로컬과 Railway가 같은 Dockerfile을 쓴다 |
| 이 저장소를 만든 클라우드 작업 환경 | Docker 이미지 저장소 접근이 막혀 있어 컨테이너 기동은 확인하지 못한다. 설정 문법 검사(`docker compose config`)까지만 하고, 실제 기동 확인은 Docker Desktop에서 한다 |

### 2.2 계정·키 체크리스트(웨이브별)

키는 모두 서버 환경변수로만 둡니다. 공개되는 값은 Supabase URL·공개 키, 앱 URL, Toss 클라이언트 키뿐입니다. 변수 이름·위치·누락 시 동작의 정본은 `products/02_ARCHITECTURE.md` 8절이고, GC-06-001이 같은 이름으로 `.env.example`을 만듭니다.

| 웨이브 | 계정·키 | 변수(제안) | 쓰는 곳 | 비고 |
|---|---|---|---|---|
| W0 | 로컬 Supabase(키는 `supabase start` 출력) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `APP_ID=globalcommerce` | web, worker | service role은 web 서버와 워커 전용 |
| W0 | Mock 로그인 비밀번호 | `AUTH_MODE=mock`, `DEV_SEED_PASSWORD` | web(로컬만) | 14.2절 |
| W1 | Toss Payments 테스트 키 | `TOSS_CLIENT_KEY`(공개), `TOSS_SECRET_KEY`, `TOSS_WEBHOOK_SECRET` | web 서버, 워커(정기 청구) | 라이브 키는 가맹 심사 후(10절) |
| W1 | 자격 증명 암호화 키(AES-256-GCM) | `CREDENTIALS_KEY_V<n>`, `CREDENTIALS_KEY_VERSION` | web 서버, worker | 코어 `encrypted_credentials`(GC-06-011). 0키 폴백 금지 |
| W1 | 이메일 발송(알림) | `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM` | worker | 제공자 미정(제안 Resend). 없으면 인앱 알림만(GC-06-012) |
| W2 | 한국수출입은행 현재환율 API 인증키 | `KOREAEXIM_API_KEY` | worker | GC-D-16 |
| W2 | 네이버 개발자센터 애플리케이션(데이터랩 검색어 트렌드) | `NAVER_DATALAB_CLIENT_ID`, `NAVER_DATALAB_CLIENT_SECRET` | worker | 일 호출 한도 미확인 |
| W2 | 아마존 상품 데이터 공급자 | `AMAZON_DATA_PROVIDER`, `AMAZON_DATA_API_KEY` | worker | O-02로 공급자 확정 후. 없으면 엑셀 수집만 동작 |
| W3 | OpenAI | `OPENAI_API_KEY` | `packages/ai`(web 서버, worker) | 상품명·이미지·임베딩(R3) |
| W3 | Anthropic(대체 LLM) | `ANTHROPIC_API_KEY` | `packages/ai` | 없으면 대체 경로 비활성 |
| W3 | fal, 합성 제공자 선택 | `FAL_KEY`, `IMAGE_COMPOSE_PROVIDER`(`openai-image` / `fal-flux`) | worker | 누끼(birefnet, 제안), 합성은 O-04 |
| W4 | 쿠팡 Wing Open API 테스트 셀러 계정 | 앱 설정 화면에서 입력(셀러 본인 키) | worker(복호화 후 사용) | env에 넣지 않음. 개발용 계정 확보 필요 |
| W4 | 네이버 커머스API 애플리케이션 | 앱 설정 화면에서 입력 | worker | 발급 형태(셀러 직접 / 솔루션사) 미확인 |
| W5 | 운영 Supabase 프로젝트, Vercel(web), Railway(worker), 도메인 | 배포 env | web, worker | `02_ARCHITECTURE.md` 7절 |
| W5 | Google Cloud OAuth 클라이언트(G1 후) | Supabase 대시보드·`config.toml`에만 | Supabase Auth | 14.4절 |
| W6 | YouTube Data API(OAuth), Meta 앱(Instagram Graph API), WordPress 애플리케이션 비밀번호, TTS | `GOOGLE_OAUTH_CLIENT_ID`·`SECRET`, `META_APP_ID`·`SECRET`(web 서버). WordPress는 `encrypted_credentials` | web 서버, worker | YouTube OAuth는 로그인용 Google OAuth와 별개. 앱 검수 리드타임 미확인 |
| W6 | 카카오 디벨로퍼스 앱, 네이버 로그인 애플리케이션(G2 후) | Supabase에만 | Supabase Auth | 14.6절 |
| W7 | OpenAI 임베딩(`text-embedding-3-small`) | `OPENAI_API_KEY` 재사용 | worker | GC-D-15 |

## 3. 저장소 구조와 최종 트리

### 3.1 지금 있는 것과 앞으로 생기는 것

| 경로 | 내용 | 누가 만드나 |
|---|---|---|
| `docs/prd/`, `docs/spec/`, `docs/design/` | 입력 자료(PRD, 스펙, 디자인 캔버스). 고치지 않음 | 이미 있음 |
| `products/` | 기획서 9종 + `CLAUDE.md` + `supabase/monolith/` | 기획 작업 |
| `develop/` | 이 안내서, `README.md`, `MULTI_AGENT.md`, `docs/file/_index.md` | 기획 작업 |
| `.claude/`, 루트 `CLAUDE.md`, `tasks/README.md`, `tasks/TEMPLATE.md` | 멀티에이전트 팀 설정과 작업 목록 | 팀 이식 작업 |
| `apps/`, `services/`, `packages/`, `supabase/`, `scripts/`, `tests/` | 코드 | GC-06-001 이후 task |

### 3.2 최종 트리(R1 완료 시점. 코드 폴더 정본은 `products/02_ARCHITECTURE.md` 2절, 파일을 처음 만드는 작업 번호는 06장 소유 경계가 정본)

```
GlobalCommerce/
├── CLAUDE.md                       루트 운영 규칙(팀장·팀원 공통, 커밋 형식)
├── README.md
├── package.json  pnpm-workspace.yaml  .env.example        [001]
├── docker-compose.yml  .dockerignore  apps/web/Dockerfile.dev   Docker Desktop 로컬 실행(GC-D-26)   [001]
├── .github/workflows/ci.yml        lint · typecheck · test · supabase test db      [001]
├── .claude/
│   ├── settings.json               팀장(주 세션) 모델 claude-opus-5-5
│   ├── agents/                     advisor, sub-agent-1, sub-agent-2,
│   │                               nextjs-expert, supabase-expert, worker-expert,
│   │                               plan-challenger, review-expert, contract-reviewer,
│   │                               security-auditor, test-writer
│   ├── commands/                   agent-check, check, next-task, sync-design
│   └── skills/                     nextjs-expert, supabase-expert, worker-expert
├── products/                       기획서(정본)
│   ├── README.md  00_DECISIONS.md  01_PRD.md  02_ARCHITECTURE.md  03_SCREENS_UX.md
│   ├── 04_API.md  05_DATA_MODEL.md  06_AGENT_PLAN.md  07_SOURCE_MIGRATION.md  CLAUDE.md
│   └── supabase/monolith/0001_core_lite.sql  0002_globalcommerce_domain.sql  seed.sql
├── develop/
│   ├── README.md  globalcommerce_develop.md  MULTI_AGENT.md
│   └── docs/file/_index.md         산출물 등록부
├── docs/
│   ├── prd/  spec/                 입력 자료
│   └── design/structure-map.html  dashboard/(*.dc.html 20개, canvas.json, README.md)
├── tasks/
│   ├── README.md                   작업 표(상태: 대기 → 진행 → 완료, 보류)
│   ├── TEMPLATE.md
│   └── task-001.md ~ task-049.md
├── apps/web/                       Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui   [001]
│   ├── app/                        (auth)/login, (app)/dashboard, sourcing, products, upload, runs,
│   │                               settings, billing, admin, api/ ...
│   ├── components/                 shell(사이드바·상단 바·하단 탭), ui
│   ├── lib/auth/  lib/session/     단계 분기는 lib/auth/에만, requireSession은 lib/session/   [006]
│   ├── proxy.ts                    세션 갱신·경로 보호        [006]
│   └── styles/tokens.css           디자인 토큰 정답(@theme)  [004]
├── services/worker/                Node 22 + TypeScript 잡 워커(Railway, WORKER_ROLE=main, R2 media)   [007]
│   └── src/runtime/  jobs/<큐>/  cron/
├── packages/
│   ├── domain/                     상수, zod, 플랜 features, CREDIT_COST, 마진 계산, 생성 타입(제안)   [005]
│   ├── compliance/                 금지어 매처·verdict, rules/*.json, fixtures/   [021]
│   ├── ai/                         서버 전용 AI 라우터(providers/, features/, routing.ts)   [020]
│   ├── net/                        안전 fetch(허용 목록, 사설 IP 차단)
│   ├── sourcing/                   amazon/(ASIN, 공급자 어댑터), excel/(열 매핑)   [017, 018]
│   ├── markets/                    coupang/, smartstore/, 플레이오토 엑셀 행 변환   [027, 028, 031]
│   └── render/                     Sharp 합성, 상세페이지 HTML 템플릿, FFmpeg 명령 생성(R2)   [023, 025]
├── supabase/
│   ├── config.toml
│   ├── migrations/20261025000001_core_lite.sql  20261025000002_globalcommerce_domain.sql   [002]
│   ├── seed.sql                                                                         [002]
│   └── tests/                      pgTAP RLS 회귀       [003]
├── scripts/dev/seed-users.mjs      개발용 로그인 페르소나 시드   [006]
└── tests/e2e/                      Playwright 핵심 흐름   [033]
```

`[숫자]`는 그 파일을 처음 만드는 GC-06 작업입니다. R2에서는 `apps/web/app/(app)/workflows`, `content/*`, `services/worker/src/jobs/content`, R3에서는 `insights/search`가 더해집니다.

## 4. 로컬 DB

GC-06-002가 이 절차를 처음 수행하고, 그 뒤 모든 개발자가 같은 순서로 로컬 DB를 띄웁니다.

| 순서 | 명령 | 설명 |
|---|---|---|
| 1 | `supabase init` | 저장소 루트에 `supabase/config.toml`이 없을 때만(002가 1회) |
| 2 | `products/supabase/monolith/0001_core_lite.sql` → `supabase/migrations/20261025000001_core_lite.sql`, `0002_globalcommerce_domain.sql` → `20261025000002_globalcommerce_domain.sql`, `seed.sql` → `supabase/seed.sql` 복사 | 002가 1회. 타임스탬프 이름은 제안 |
| 3 | `supabase start` | Docker Desktop에서 로컬 Supabase 기동(`http://127.0.0.1:54321`). 평소에는 2.3절 `pnpm dev:docker`가 3~7번을 함께 한다 |
| 4 | `supabase db reset` | 마이그레이션을 이름순으로 적용하고 `seed.sql`(플랜 4종, 크레딧팩, 기본 금지어 사전, `apps` 행 등)을 넣음 |
| 5 | `supabase gen types typescript --local > packages/domain/src/database.ts` | 타입 생성(경로 제안, 02장에 지정이 없음). 스키마를 바꾼 task는 반드시 다시 생성 |
| 6 | `supabase test db` | RLS 회귀(003 이후) |
| 7 | `node scripts/dev/seed-users.mjs --app globalcommerce` | 개발용 로그인 페르소나 시드. 006이 만들기 전에는 건너뜀(14.2절) |

- **기획 SQL과 마이그레이션의 관계(제안)**: 002가 복사한 뒤 `products/supabase/monolith/`는 기획 시점 스냅샷으로 두고 고치지 않습니다. 이후 스키마 변경은 새 마이그레이션 파일 + `products/05_DATA_MODEL.md` 갱신으로 처리합니다. 등록부에서 DB 정본 경로를 `supabase/migrations/`로 바꾸는 것도 002의 할 일입니다.
- 코어 lite 절은 platform-docs `MONOLITH_CORE_LITE.sql`에서 복사한 것이라 수정하지 않습니다(00장 5.3). 코어에 필요한 변경은 도메인 마이그레이션에서 덧붙입니다.
- 기획 단계에서 SQL을 실제 Postgres로 돌려 보지 않았다면 첫 `db reset` 오류가 나올 수 있습니다. 그 수정이 002의 수용 기준에 들어갑니다(미확인).
- R3의 pgvector(`product_embeddings`, 1536차원)는 W7 마이그레이션에서 추가합니다. Supabase는 확장을 `extensions` 스키마에 만듭니다.
- 원격 DB에 적용하는 `supabase db push`는 에이전트가 실행하지 않습니다. 사람이 확인 후 실행합니다.

## 5. 착수 전 결정 확정

열린 결정은 00장 4절이 정본입니다. 정하기 전까지는 "기본안"으로 개발하고, 다르게 정하면 해당 기획서를 고치는 task를 따로 만든 뒤 00장 변경 이력에 남깁니다.

| ID | 질문 | 기본안 | 확정해야 하는 시점 | 막는 작업 |
|---|---|---|---|---|
| O-01 | 제품 브랜드 | NOMAD AI Factory | 랜딩(GC-S-17) 구현 전, 늦어도 W5 | 랜딩, 메타데이터, 이메일 문구 |
| O-02 | 아마존 데이터 수집 방식 | 서드파티 상품 데이터 API, 스크래핑 금지 | W2 전 | 017 |
| O-03 | 추가 슬롯 가격 | `[추가 슬롯 가격]` 자리 표시 | W1 전 | 010(플랜 seed 값, 결제 금액) |
| O-04 | 대표 이미지 생성 제공자 | 어댑터로 둘 다, 기본은 비용·품질 비교 | W3 전 | 020, 023 |
| O-05 | 숏폼 렌더 한도·크레딧 단가 | GC-D-04 제안값 | R2 착수 전 | 040, 041 |
| O-06 | YouTube 댓글 고정 | 수동 안내 | R2 착수 전(API 문서 확인) | 042, 043 |
| O-07 | 자체 블로그 도메인 | `/b/` 하위 경로 | R2(W6) 전 | 039 |
| O-08 | 다크 테마 출시 시점 | R2(R1은 라이트만, 토큰은 두 벌) | W0(토큰 구조), 출시는 R2 | 004, 035 |

**웨이브 진입 전 확인 순서(제안)**

1. 다음 웨이브가 막히는 결정이 위 표에 있는지 봅니다.
2. 결정이 나면 00장 4절 행을 3절 확정 결정으로 옮기고(새 GC-D 번호), 영향을 받는 기획서 갱신 task를 만듭니다.
3. 등록부(`develop/docs/file/_index.md`)에서 바뀐 산출물의 버전·상태를 갱신하고 변경 이력에 적습니다.

산출물 상태가 "초안"이어도 W0는 시작할 수 있습니다. W1 전까지 01~05장을 "승인"으로 바꾸는 것을 권합니다(제안).

## 6. 작업을 task로 변환

### 6.1 작업과 웨이브(정본: `products/06_AGENT_PLAN.md` 2~3장, 요약: 00장 5.6)

| 웨이브 | 릴리스 | 작업 | 진입 조건 | 필요한 결정 | 끝나면 되는 것 |
|---|---|---|---|---|---|
| W0 기반 | R1 | 001~007 | 없음 | O-08(토큰 구조만) | 모노레포·CI, DB·타입, RLS 테스트, 토큰·셸, 도메인 패키지, Mock 로그인, 워커 런타임 |
| W1 플랫폼 | R1 | 008~013 | W0 | O-03 | 플랜·크레딧, Toss 구독·크레딧팩, 추가 슬롯, 마켓 계정, 설정, 슈퍼 어드민 |
| W2 데이터 | R1 | 014~019 | W1(최소 008, 011) | O-02 | 환율, 트렌드, 대시보드, 아마존·엑셀 수집, 소싱 화면 |
| W3 AI 가공 | R1 | 020~026 | W2 | O-04 | AI 라우터, 금지어, 상품명, 누끼·합성, 상세페이지 |
| W4 업로드 | R1 | 027~032 | W3 | - | 쿠팡·스마트스토어 전송, 진행률, 엑셀·ZIP, 실행 기록 |
| W5 R1 마감 | R1 | 033~035, 036(G1 후) | W4 | O-01 | E2E, 보안 점검, 반응형 점검 → **MVP 완료**. G1 판정 후 036(Google·이메일) → **공개 베타** |
| W6 | R2 | 037~043, 044(G2 후) | R1 출시 + R2 착수 판정(부록 A) | O-05, O-06, O-07 | 노드 캔버스, 실행 엔진, 블로그, 숏폼, SNS, 링크 삽입, 카카오·네이버 |
| W7 | R3 | 045~047 | W6 | - | 임베딩·하이브리드 검색, JSON-LD, 검색 화면 |

웨이브 안의 순서와 작업별 선행은 06장이 정본입니다. 06장이 아직 없거나 다르면 06장을 따릅니다.

### 6.2 팀 구성과 모델(정본: `develop/MULTI_AGENT.md`, `.claude/agents/*.md` frontmatter)

| 분류 | 에이전트 | 모델 | 맡는 일 |
|---|---|---|---|
| 고문 | `advisor` | Fable 5.1 | 같은 문제로 2회 이상 막힌 문제 진단. 06장 모델 열이 Fable인 작업(결제, 권한, RLS, 데이터 모델)은 착수 전 설계안 1회 검토(00장 5.6, 제안) |
| 팀장 | 주 세션 | Opus 5.5(`.claude/settings.json`) | task 해석, 분해, 위임, 검토, 커밋 |
| 대리 | `sub-agent-1` | Sonnet 5.5 | 분야 밖 실무, 여러 영역에 걸친 작은 수정, 리뷰 지적 반영, 문서 |
| 사원 | `sub-agent-2` | Haiku 5.5 | 탐색, 캔버스·스펙에서 값 추출, 시드 정리, task 파일 초안, 형식 점검 |
| 분야 | `nextjs-expert` | frontmatter 기준 | `apps/web`(화면, Route Handler, `proxy.ts`) |
| 분야 | `supabase-expert` | frontmatter 기준 | `supabase/`(마이그레이션, RLS, RPC, pgTAP, seed) |
| 분야 | `worker-expert` | frontmatter 기준 | `services/worker`, 잡 핸들러, 외부 API 어댑터 |
| 검증 | `plan-challenger` | frontmatter 기준 | 착수 전 계획 공격 |
| 검증 | `review-expert` | frontmatter 기준 | 변경 후 리뷰, 요구사항 → 설계 → 구현 → 테스트 추적성 |
| 검증 | `contract-reviewer` | frontmatter 기준 | web ↔ DB ↔ worker ↔ `packages/*` 경계 계약 대조(04장 API, 05장 테이블, 00장 5.4 잡 타입) |
| 검증 | `security-auditor` | frontmatter 기준 | 결제, 크레딧, 권한, 키 보관, 외부 URL, 개인정보 |
| 검증 | `test-writer` | frontmatter 기준 | 테스트 작성·실행(테스트 파일만 씀) |

06장의 작업별 "권장 모델" 열과의 대응(제안): Fable = 팀장이 설계 → 고문 검토 → plan-challenger → 분야 에이전트 구현. Opus = 팀장이 설계 → 분야 에이전트 구현. Sonnet = 분야 에이전트 또는 대리. Haiku = 사원.

### 6.3 작업별 기본 배치(제안, 06장과 다르면 06장이 정본)

| 작업 | 착수 전 | 구현 | 변경 후 |
|---|---|---|---|
| 001 모노레포·CI | - | 대리(루트 설정·CI) + nextjs-expert(앱 골격) + worker-expert(워커 골격) | review |
| 002 DB 마이그레이션 | plan-challenger | supabase-expert(+사원: 파일 복사·이름) | review · security |
| 003 RLS 테스트 | plan-challenger | supabase-expert, test-writer | review · security |
| 004 토큰·공용 셸 | - | nextjs-expert(+사원: 캔버스 값 추출) | review |
| 005 도메인 패키지 | plan-challenger | 대리 | review · contract |
| 006 인증 Stage A | plan-challenger | nextjs-expert + supabase-expert | review · security |
| 007 워커 런타임 | plan-challenger | worker-expert | review · contract |
| 008 플랜·크레딧 API | plan-challenger | supabase-expert → nextjs-expert | review · security · contract · test-writer |
| 009 Toss 구독·크레딧팩 | plan-challenger | nextjs-expert(+supabase-expert: 웹훅·멱등) | review · security · contract · test-writer |
| 010 추가 슬롯 | plan-challenger | nextjs-expert | review · security · test-writer |
| 011 마켓 계정 | plan-challenger | supabase-expert + nextjs-expert + worker-expert(검증 잡) | review · security · contract |
| 012 배송·음원·알림 설정 | - | nextjs-expert | review · contract |
| 013 슈퍼 어드민 | plan-challenger | supabase-expert + nextjs-expert | review · security |
| 014 환율 / 015 트렌드 | - | worker-expert → nextjs-expert(위젯) | review · contract |
| 016 대시보드 화면 | - | nextjs-expert(+사원: 문구) | review |
| 017 아마존 수집 어댑터 | plan-challenger | worker-expert | review · security(허용 도메인, GC010) · contract |
| 018 엑셀 파서 | - | worker-expert | review · test-writer |
| 019 소싱 화면 | - | nextjs-expert | review · contract |
| 020 `packages/ai` | plan-challenger | 대리 | review · security · contract |
| 021 금지어 매처(`packages/compliance`) | - | 대리 | review · test-writer |
| 022 상품명 잡·상품 화면 | - | worker-expert → nextjs-expert | review · contract |
| 023 누끼·합성 잡 | plan-challenger | worker-expert | review · contract |
| 024 상품 이미지 화면 | - | nextjs-expert | review |
| 025 상세페이지 조립·마켓 이미지 | plan-challenger | worker-expert | review · contract · test-writer |
| 026 상세페이지 에디터 | - | nextjs-expert | review · contract |
| 027 쿠팡 / 028 스마트스토어 어댑터 | plan-challenger | worker-expert | review · security · contract · test-writer |
| 029 업로드 배치·진행률 API | plan-challenger | supabase-expert + nextjs-expert | review · security · contract |
| 030 업로드 화면 / 032 실행 기록 화면 | - | nextjs-expert | review · contract |
| 031 엑셀·ZIP 내보내기 | - | worker-expert | review · test-writer |
| 033 E2E 핵심 흐름 | - | test-writer(팀장 지휘) | review |
| 034 보안 점검 | - | security-auditor 전체 감사 → 지적은 분야 에이전트 | review |
| 035 반응형 3구간 점검 | - | nextjs-expert(+사원: 스크린샷 대조표) | review |
| 036 인증 Stage B | plan-challenger | nextjs-expert + supabase-expert | review · security |
| 037 노드 캔버스 | plan-challenger | nextjs-expert | review · contract |
| 038 실행 엔진 | plan-challenger | worker-expert | review · contract · test-writer |
| 039 블로그 원고·발행 | - | worker-expert → nextjs-expert | review · security(공개 페이지 XSS) |
| 040 숏폼 렌더 워커 / 041 숏폼 화면 | plan-challenger(040) | worker-expert / nextjs-expert | review · test-writer(040) |
| 042 SNS 연동 / 043 링크 삽입 | plan-challenger(042) | worker-expert + nextjs-expert | review · security · contract |
| 044 인증 Stage C | plan-challenger | nextjs-expert + supabase-expert | review · security |
| 045 임베딩·검색 / 046 JSON-LD / 047 검색 화면 | plan-challenger(045) | supabase-expert + worker-expert / worker-expert / nextjs-expert | review · contract |
| 048 랜딩·약관 페이지(R1, W5) | - | nextjs-expert | review |
| 049 18슬롯 상세페이지(R2, W6) | plan-challenger | worker-expert | review · contract · test-writer |

### 6.4 task 파일 만들기

| 순서 | 할 일 | 담당 |
|---|---|---|
| 1 | `tasks/README.md` 표에 049까지 한 줄씩(작업, 웨이브, 제목, 선행, 상태 `대기`). R2·R3 작업은 상태 `대기`, 비고 "R2 착수 판정 후" | 사원 초안 → 팀장 확인 |
| 2 | 다음 웨이브 작업만 `tasks/TEMPLATE.md`를 복사해 `tasks/task-###.md`로 작성(번호는 GC-06 뒤 세 자리) | 사원 초안 → 팀장 확인 |
| 3 | "참고 문서"에 등록부 ID + 경로 + 장을 적습니다(문서 내용을 붙여 넣지 않음) | 팀장 |
| 4 | "완료 조건"은 06장 수용 기준을 그대로 옮기고, 확인 명령을 붙입니다 | 팀장 |
| 5 | "안 할 것"에 다음 작업의 범위를 적어 넘치지 않게 합니다 | 팀장 |
| 6 | 6.3 배치를 "배치" 칸에 적습니다 | 팀장 |

웨이브 단위로 쓰는 이유는 앞 웨이브 결과와 결정(5절)이 다음 웨이브 task 내용을 바꾸기 때문입니다(제안). 칸 이름은 `tasks/TEMPLATE.md`가 정본입니다.

task 파일 "참고 문서" 예시(task-002):

```
- DOC-DES-004 products/05_DATA_MODEL.md (전체, 특히 RLS 절)
- DOC-DES-005 products/supabase/monolith/ (0001, 0002, seed)
- DOC-MGT-002 products/00_DECISIONS.md 5.3 테이블 정본 이름
- DOC-MGT-003 products/06_AGENT_PLAN.md GC-06-002 수용 기준
- 이 안내서 4절
```

### 6.5 요청 프롬프트 예시(W0 첫 작업)

보통은 `/next-task 001`로 충분합니다. 명령을 쓰지 않을 때나 범위를 더 좁히고 싶을 때는 아래처럼 요청합니다.

```
팀장으로 진행한다. 팀 구성과 위임 기준은 develop/MULTI_AGENT.md, 저장소 규칙은 루트 CLAUDE.md.

[작업] tasks/task-001.md (GC-06-001 모노레포·CI)
참고 문서는 task 파일에 적힌 장만 읽는다. products/00_DECISIONS.md 2절(코드 위치)과
develop/globalcommerce_develop.md 3.2절(최종 트리)을 구조 기준으로 쓴다.

[완료 조건]
① pnpm install 후 pnpm -r lint / typecheck / test 가 빈 프로젝트에서 녹색
② apps/web(Next.js 16 App Router, React 19, Tailwind CSS v4), services/worker(Node 22 TS),
   packages/domain 빈 패키지가 워크스페이스로 잡힘
③ .github/workflows/ci.yml 이 같은 명령을 돌림
④ .env.example 에 2.2절 변수 이름만 있고 값은 없음, .env* 는 .gitignore
⑤ 06_AGENT_PLAN.md 의 GC-06-001 수용 기준 충족

[안 할 것] DB(002), 토큰·셸(004), 인증(006), 워커 잡 루프(007). 버전은 latest 로 두지 않고 lockfile 로 고정.

[배치] 구현: 대리(루트 설정·CI), nextjs-expert(apps/web 골격), worker-expert(services/worker 골격).
변경 후 review-expert. 계획을 먼저 보여 주고 승인 후 위임한다.
끝나면 /check 결과 표, tasks/README.md 상태 완료, 루트 CLAUDE.md 형식으로 커밋.
```

## 7. 웨이브별 개발 사이클

`/next-task`가 아래 순서를 따릅니다(정본: `.claude/commands/next-task.md`, `develop/MULTI_AGENT.md`).

| 순서 | 내용 | 누가 / 도구 |
|---|---|---|
| 1 | 웨이브 진입 확인: 앞 웨이브 완료, 필요한 결정(5절) 확정, 게이트(G1·G2) 해당 여부 | 팀장 |
| 2 | 다음 task 선택: `tasks/README.md`에서 `대기`이고 선행이 모두 `완료`인 가장 앞 번호 | `/next-task` |
| 3 | task 파일과 참고 문서의 필요한 장만 읽기. 값 추출은 사원 | 팀장, 사원 |
| 4 | 구현 계획(바꿀 파일, 순서, 맡길 에이전트, 확인 방법)을 사용자에게 보여 주고 승인 | 팀장 |
| 5 | 위험 task(6.3 "착수 전" 칸)는 plan-challenger로 계획 공격. 06장 Fable 작업은 고문 검토 1회(제안) | plan-challenger, advisor |
| 6 | 구현 위임. 지시에는 범위, 대상 파일, 완료 조건, "안 할 것", 문서 경로(내용이 아니라 경로)를 넣음 | 분야 에이전트, 대리, 사원 |
| 7 | 변경 후 리뷰. 경계 변경이면 contract-reviewer, 결제·크레딧·권한·키·개인정보면 security-auditor를 형제로 함께 | review-expert(+) |
| 8 | "검증 근거 없음"이면 test-writer가 테스트를 만들고 review-expert 재실행 | test-writer |
| 9 | 지적은 해당 에이전트에게 돌려 고침. 같은 문제로 2회 이상 막히면 고문 | 팀장, advisor |
| 10 | `/check`(lint, typecheck, test, `supabase test db`) 녹색 확인 | `/check` |
| 11 | 완료 조건을 하나씩 확인해 task 파일 "완료 보고" 표 작성 | 팀장 |
| 12 | `tasks/README.md` 상태 `완료`, 루트 `CLAUDE.md` 형식으로 커밋. 커밋은 팀장만 | 팀장 |
| 13 | `/clear` 후 다음 task(맥락 비용 줄이기) | 사용자 |

**게이트**

| 게이트 | 위치 | 판정 | 통과하면 |
|---|---|---|---|
| G1 | W5의 033~035 완료 후, 036 전 | 사람(14.3 체크리스트) | 036(Google·이메일) → 공개 베타 |
| R2 착수 판정 | R1 출시 후 | 사람(부록 A, 매출 검증, GC-D-02) | W6 시작 |
| G2 | 공개 베타 운영 후, 044 전 | 사람(14.5 체크리스트) | 044(카카오·네이버) |

- 구현이 기획서와 달라져야 하면 코드를 조용히 맞추지 않습니다. 기획서 갱신 task를 먼저 만들고, 00장이나 해당 장을 고친 뒤 구현합니다.
- 범위 밖 문제를 발견하면 `tasks/README.md` "발견한 문제" 표에 적고 넘어갑니다.

## 8. 디자인 반영

### 8.1 흐름

| 순서 | 할 일 | 정본 | 작업 |
|---|---|---|---|
| 1 | 캔버스에서 값 추출: 토큰 표, 화면별 문구·수치·상태 표현 | `docs/design/dashboard/README.md`, `*.dc.html` | 사원(004부터 화면 task마다) |
| 2 | 00장 7절의 "고칠 곳"을 반영: 슬롯 4/10, 플랜 비교표 수치, 크레딧 사용량 표현 | 00장 7절 | 화면 task 구현 시. 캔버스 값보다 00장이 우선 |
| 3 | `apps/web/styles/tokens.css`에 Tailwind CSS v4 `@theme`으로 토큰 정의(라이트 기본, 다크는 두 번째 벌만 정의, O-08) | GC-D-19 | 004 |
| 4 | 공용 셸(사이드바·상단 바·모바일 하단 탭)과 기본 컴포넌트 | `Sidebar.dc.html`, `TopBar.dc.html`, `03_SCREENS_UX.md` | 004 |
| 5 | 화면 구현: 화면 ID(GC-S-##) → 경로·패턴·디자인 파일은 00장 5.2 | `03_SCREENS_UX.md` | 화면 task |
| 6 | 차이 점검: `/sync-design`으로 캔버스와 구현 비교(코드는 고치지 않고 차이 표만) | `.claude/commands/sync-design.md` | 화면 task 끝, 035 |

- 캔버스 `.dc.html`은 캔버스 런타임 전용이라 브라우저 단독으로 열면 깨집니다. 마크업·문구·수치 참고용으로만 씁니다.
- 숫자와 상품은 예시 데이터입니다. 실제 값은 DB에서 오고, 플랜 한도는 GC-D-04 값입니다.
- R2·R3 메뉴는 해당 릴리스 전까지 렌더하지 않습니다(숨김). 플랜 잠금은 배지로 표시합니다(00장 5.2).
- 토큰 외의 색·글자 크기를 화면 코드에 직접 쓰지 않습니다. 포인트 컬러는 민트 1색(채움 `#00C9A7`, 글자·버튼 `#007A64`)입니다.

### 8.2 반응형 3구간과 글자 크기(GC-D-20)

| 구간 | 폭 | 셸 | 본문 | 표 | 페이지 제목 | 섹션 제목(제안) | 보조·캡션(제안) | 핵심 숫자(Bebas Neue) |
|---|---|---|---|---|---|---|---|---|
| 모바일 | ~767px | 하단 탭 5개 | 14px | 13px | 20px | 16px | 12px | 44px |
| 태블릿 | 768~1199px | 아이콘 레일 64px + 햄버거 | 14px | 13px | 22px | 17px | 12px | 52px |
| 데스크탑 | 1200px~ | 사이드바 240px | 14px | 13px | 24px | 18px | 12px | 68px |

- Tailwind 기본 구간(md 768, lg 1024, xl 1280)과 다르므로 `@theme`에 `--breakpoint-tablet: 768px`, `--breakpoint-desktop: 1200px`처럼 이 제품 구간을 정의합니다(이름은 제안).
- 서체: 본문 Noto Sans KR, 핵심 숫자 Bebas Neue, 로그·코드만 JetBrains Mono.
- 디자인 기준 화면: 데스크탑 `Main.dc.html`, 태블릿 `TabletDashboard.dc.html`(834×1194), 모바일 `MobileDashboard.dc.html`·`MobileUpload.dc.html`(390×844).
- 035 점검 폭(제안): 390, 767, 768, 834, 1199, 1200, 1440px. 가로 스크롤 0, 표는 모바일에서 카드 목록 또는 가로 스크롤 영역으로 전환(방식은 03장 정본).

## 9. AI 계층(R1, `packages/ai`)

정본: GC-D-08·09·11, `products/02_ARCHITECTURE.md` 4.2절(잡 표)·5절(AI 라우팅)·6절(v1 결함 차단), `products/04_API.md`.

| 구성 | 내용 | 작업 |
|---|---|---|
| 패키지 경계 | `packages/ai`는 서버 전용. `apps/web`에서는 Route Handler·Server Action에서만 import하고 `server-only`로 클라이언트 번들 유입을 막음. 워커는 직접 import | 020 |
| 제공자 어댑터 | `providers/openai.ts`(기본 LLM GPT-4o, 이미지 모델은 착수 시 확인, 미확인), `anthropic.ts`(대체), `fal.ts`(누끼 birefnet 제안, 합성 대안). 라우팅은 `routing.ts` 상수 한 곳, 요청 바디·쿠키의 모델 값은 무시. 테스트용 가짜 어댑터(키 없이 CI 통과, 제안) | 020, 023 |
| 기능 체인 | `title.generate`(번역 + GEO 키워드), `image.cutout`, `image.compose`(1080×1080, 한글은 Sharp 후합성), `detail.assemble`(4단 블록 카피) | 022, 023, 025 |
| 크레딧 | 잡 생성 시 서버가 선차감, 실패 시 환불(코어 RPC). 클라이언트는 과금 판단을 하지 않음(GC-D-21). 원가는 `ai_usage`에 기록 | 008, 020 |
| 출력 검사 | 생성 결과는 `packages/compliance`(021) 규칙 판정 → `compliance.judge`를 반드시 통과. 후기·평점·"전문가 추천", "단순 변심 반품 불가", 건기식 부정 문구를 만들지 않도록 프롬프트와 후검사 둘 다 | 021, 022, 025 |
| 실행 위치 | 오래 걸리는 생성은 모두 잡(`gc.ai`, `gc.detail`)으로 워커에서. Route Handler는 잡 등록·상태 조회와 저장 시 판정처럼 짧은 동기 기능만(함수 실행 시간 안, 02장 5.1·7절) | 007, 022 |

**키 규칙**

- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`는 web 서버(Vercel)와 워커(Railway) env에만, `FAL_KEY`는 워커에만 둡니다. `NEXT_PUBLIC_` 금지, localStorage 금지, 공개 AI 프록시 금지(v1 결함, GC-D-21).
- 034 보안 점검에서 `NEXT_PUBLIC_.*(KEY|SECRET)`, `localStorage`에 키 저장, CORS `*`, 쿠키로 역할 판정하는 코드를 grep으로 0건 확인합니다.
- 키 값을 로그, 커밋, task 파일, 리뷰 결과에 쓰지 않습니다.

## 10. 외부 연동 순서

리드타임이 긴 승인은 필요한 웨이브보다 먼저 신청합니다. 리드타임은 모두 미확인이고, 아래 "신청 시점"은 제안입니다.

| 연동 | 필요한 작업 | 신청 시점(제안) | 승인 전 대체 | 비고 |
|---|---|---|---|---|
| Toss Payments 라이브 | 009, 010(출시) | W1 시작 | 테스트 키로 개발·E2E | 가맹 심사에 사업자 정보·약관·환불 정책 페이지 필요(미확인) |
| 한국수출입은행 환율 API | 014 | W1 | 고정 샘플 값 + 기준 시각 표시 | 실패 시 마지막 값(GC-D-16) |
| 네이버 데이터랩 | 015 | W1 | 시드 키워드 | 상대 지수(GC-D-17) |
| 아마존 데이터 공급자 | 017 | O-02 확정 직후, W2 전 | 고정 응답 픽스처 | 직접 스크래핑 금지 |
| OpenAI, Anthropic, fal | 020~025 | W2 | 가짜 어댑터 | 이미지 모델 제공 여부 착수 시 확인 |
| 쿠팡 Wing Open API | 027 | W2 | 엑셀·ZIP 내보내기(031) | 셀러 본인 키. 개발용 테스트 셀러 계정과 샌드박스 유무 미확인. 호출 IP 등록을 요구하면 Railway 고정 아웃바운드 IP(02장 7절, 미확인) |
| 네이버 커머스API | 028 | W2 | 엑셀·ZIP 내보내기 | 애플리케이션 등록 형태 미확인 |
| Google OAuth(로그인) | 036 | G1 직전 | Mock 로그인 | 동의 화면에 개인정보처리방침·약관 URL 필요 |
| YouTube Data API | 042 | R2 착수 판정 직후 | 다운로드 후 수동 업로드 | OAuth 앱 검증·업로드 쿼터 미확인. 댓글 고정은 O-06 |
| Instagram Graph API(Meta 앱) | 042 | R2 착수 판정 직후 | 수동 업로드 | 비즈니스 계정, 앱 검수 필요(미확인) |
| WordPress REST API | 039 | W6 | 자체 블로그만 | 사용자 사이트의 애플리케이션 비밀번호 |
| TTS 제공자 | 040 | W6 | 자막만 | 제공자 미정(미확인) |
| 카카오, 네이버 로그인 | 044 | G2 직전 | Google·이메일 | 네이버는 검수 필요 |

마켓 키와 SNS 토큰은 사용자 자격 증명이라 env가 아니라 코어 `encrypted_credentials`에 암호화해 둡니다. 화면에는 마지막 4자리와 검증 상태·만료일만 보입니다(GC-F-008).

## 11. 검증과 완료 정의

| 수준 | 완료 조건 |
|---|---|
| task | ① task 파일 완료 조건(06장 수용 기준) 전부 충족 ② review-expert 통과(차단 지적 0건)와 해당 형제 리뷰 통과 ③ `/check` 녹색 ④ 스키마를 바꿨으면 타입 재생성과 `supabase test db` 녹색 ⑤ "완료 보고" 표 작성 ⑥ `tasks/README.md` 상태 `완료`, 커밋 |
| 웨이브 | 웨이브의 모든 task `완료` + 웨이브 끝 `/sync-design`(화면이 있는 웨이브) + 발견한 문제 표 정리 |
| R1(MVP) | W0~W4 완료, 033 E2E 녹색, 034 보안 점검 지적 0, 035 반응형 3구간 통과, 06장 완료 정의 충족 |
| 공개 베타 | R1 + G1 통과 + 036 완료 + 운영 env에서 Mock 차단 확인 |

- 리뷰 추적성: review-expert는 기능 ID(GC-F-###) → 화면 ID(GC-S-##) → API(04장) → 테이블(05장) → 테스트가 끊기지 않았는지 봅니다.
- E2E(033) 최소 흐름(제안): 로그인(Mock) → 아마존 URL 수집 → 상품명 생성 → 누끼·합성 → 상세페이지 확정 → 쿠팡 전송(가짜 어댑터) → 실행 기록 확인 → 엑셀 내보내기. 금지어 FAIL이면 전송이 GC004로 막히는지 포함.
- RLS 회귀(003): 모든 도메인 테이블에서 다른 조직 행 읽기·쓰기 거부, `outsider` 페르소나 교차 테넌트 거부.

## 12. 위험과 주의

| 위험 | 대응 |
|---|---|
| 마켓 API 승인 지연 | R1은 엑셀(플레이오토 호환)·ZIP으로도 등록 가능하게 둠(GC-D-03). 031을 027·028과 같은 웨이브에 둠 |
| 아마존 데이터 약관 | 공식·서드파티 API만, 스크래핑 금지(O-02). 공급자 약관의 재판매·저장 조건 확인(미확인) |
| AI·이미지 비용 | 크레딧 선차감, `ai_usage` 원가 기록, 동시 생성 한도(GC-D-04). 운영 원가로 단가(제안값) 재확정 |
| 표시광고법·마켓 반려 | 금지어 FAIL 차단, WARN 확인 기록(GC-D-11). 승인을 보장하는 문구를 만들지 않음 |
| v1 결함 재발 | CORS `*`, 클라이언트 과금 판단, localStorage 키, 공개 AI 프록시, 쿠키 역할 판정 금지(GC-D-21). 034에서 grep |
| 비밀키 유출 | `.env*` 커밋 금지, 키는 서버 env 또는 `encrypted_credentials`. 로그·문서·task에 값 금지 |
| 범위 확장 | R2·R3 기능을 R1 웨이브에 넣지 않음. 메뉴도 숨김 |
| AI에게 범위 없이 맡기기 | 작업 1개 = 검증 가능한 크기. 지시에 버전을 적음(예: "Tailwind CSS v4") |
| 기획 변경 | 기획서 갱신 task → 00장 변경 이력 → 등록부 버전 갱신 → 코드 순서 |
| 원격 DB 사고 | `supabase db push`와 운영 대시보드 설정은 사람만 |
| 토큰 비용 | 탐색은 사원, 문서는 필요한 장만, task 하나 끝나면 `/clear`, 고문은 마지막 수단 |

## 13. 체크리스트

- [ ] 2.1 도구 설치(Node 22, pnpm, Docker, Supabase CLI, Claude Code)
- [ ] `claude` 실행 후 `/agent-check`로 팀 구성 확인
- [ ] 등록부(`develop/docs/file/_index.md`)의 경로가 모두 열리는지 확인
- [ ] `tasks/README.md` 49개 표, W0 task 파일 7개 작성(6.4)
- [ ] W0: 001 → 002(`supabase db reset` 성공) → 003~007
- [ ] O-03 확정 → W1
- [ ] O-02 확정, 환율·데이터랩·아마존 공급자 키 → W2
- [ ] O-04 확정, OpenAI·fal 키 → W3
- [ ] 쿠팡·네이버 커머스 개발용 계정 → W4
- [ ] O-01 확정 → W5(033~035), MVP 완료
- [ ] G1 판정(14.3) → Google 외부 설정(14.4) → 036 → 공개 베타
- [ ] R2 착수 판정(부록 A) → W6
- [ ] G2 판정(14.5) → 044
- [ ] W7(부록 B)

## 14. 인증 단계: Mock → Google·이메일 → 카카오·네이버

정본: GC-D-07, `products/01_PRD.md` GC-F-001, `02_ARCHITECTURE.md` 인증 절, `03_SCREENS_UX.md` GC-S-16, `05_DATA_MODEL.md` 페르소나 절. 외부 콘솔 절차는 platform-docs `products/_platform-core/AUTH_ROADMAP.md`와 `develop/_shared/auth/README.md`를 참고합니다.

세 단계 모두 세션은 실제 Supabase JWT라서 로그인 뒤 코드(권한, RLS, 크레딧)는 바뀌지 않습니다. 단계 분기는 `apps/web/lib/auth/`, 로그인 화면, 콜백 라우트에만 둡니다. 쿠키로 역할·플랜을 판정하는 Mock(v1 방식)은 금지이고, 허용되는 Mock은 로컬 시드 계정 로그인뿐입니다.

### 14.1 단계 요약

| 단계 | 언제 | 켜지는 로그인 | 다음 게이트 | 작업 |
|---|---|---|---|---|
| A Mock | W0~W5(033~035) | 로컬 시드 페르소나 원클릭 로그인, `MOCK AUTH · 로컬 전용` 배지 | G1 | GC-06-006(W0) |
| B Google·이메일 | G1 통과 후, 공개 베타 전 | Google + 이메일(가입, 인증 메일, 비밀번호 재설정). 배포 환경에서 Mock 차단 | G2 | GC-06-036(W5) |
| C 카카오·네이버 | G2 통과 후 | 카카오(Supabase 기본 제공자), 네이버(커스텀 OAuth 또는 서버 브리지) | - | GC-06-044(W6) |

### 14.2 Stage A 로컬 실행 순서

| 순서 | 명령 / 동작 | 확인 |
|---|---|---|
| 1 | `supabase start`, `supabase db reset` | 4절 |
| 2 | `apps/web/.env.local`에 `AUTH_MODE=mock`, `DEV_SEED_PASSWORD=<로컬 전용 임의 값>`, `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` | `DEV_SEED_PASSWORD`에 `NEXT_PUBLIC_`을 붙이지 않음. 원격 URL이면 Mock 기동 실패 |
| 3 | `node scripts/dev/seed-users.mjs --app globalcommerce` | 페르소나 표 출력(이메일, 조직, 플랜, 잔액. 비밀번호 없음). 두 번 실행해도 가입 크레딧 1회 |
| 4 | `pnpm dev` → `/login` | "개발용 로그인" 패널에서 `owner` → `/dashboard`, 플랜 `free`, 잔액은 `05_DATA_MODEL.md` 기대값(월 15 + 가입 30의 적용 방식, GC-D-04) |
| 5 | E2E | Playwright `globalSetup`이 페르소나별 `storageState` 저장(033) |

페르소나 정본은 `05_DATA_MODEL.md`입니다. 벤치마크 기준 제안: `owner`, `admin`, `member`, `viewer`, `outsider`, `suspended`, `super_admin`(GC-S-15 확인용), 플랜 확인용 `pro`.

### 14.3 G1 체크리스트(A → B, 사람이 판정)

- [ ] W0~W4 완료, 033(E2E)·034(보안)·035(반응형) 완료
- [ ] RLS 회귀(003) 전 항목 통과, `outsider` 교차 테넌트 거부
- [ ] Toss 테스트 키로 구독·크레딧팩·추가 슬롯 결제 E2E 녹색
- [ ] CI: 인증 모듈 밖 단계 분기 0건, `AUTH_MODE=mock`인 운영 빌드 실패 확인
- [ ] 외부 준비: Google Cloud 프로젝트, OAuth 동의 화면(앱 이름은 O-01, 지원 이메일, 로고, 개인정보처리방침·이용약관 URL, 승인된 도메인), 웹 클라이언트 ID, 운영 Supabase 프로젝트
- [ ] 결과를 `tasks/task-036.md` 완료 보고 위에 "G1 통과(날짜, 판정자)"로 기록

### 14.4 Stage B 외부 설정(사람)

| 순서 | 할 일 | 비고 |
|---|---|---|
| 1 | Google Cloud → OAuth 동의 화면: External, 범위 `openid`, `email`, `profile` | "테스트" 상태에서는 등록한 테스트 사용자만 로그인 |
| 2 | OAuth 클라이언트 ID(웹). 리디렉션 URI = `https://<project-ref>.supabase.co/auth/v1/callback`, 로컬 `http://127.0.0.1:54321/auth/v1/callback` | 앱 도메인이 아니라 Supabase 콜백 |
| 3 | Supabase → Authentication → Providers → Google. 로컬은 `supabase/config.toml` `[auth.external.google]`에 `env(GOOGLE_CLIENT_ID)`, `env(GOOGLE_CLIENT_SECRET)` | 키를 web·worker env에 넣지 않음 |
| 4 | URL Configuration: Site URL = 운영 도메인, Redirect URLs = `https://<도메인>/auth/callback` | 와일드카드 지양 |
| 5 | 배포 env: `AUTH_MODE=live`, `AUTH_PROVIDERS=google,email` | `DEV_SEED_PASSWORD`는 배포에 두지 않음 |
| 6 | 동의 화면 "프로덕션" 게시, 실로그인 수동 점검(데스크톱·모바일, 신규·기존 계정) | 실제 Google 로그인은 자동화하지 않음 |

### 14.5 G2 체크리스트(B → C, 사람이 판정)

- [ ] Google 실로그인으로 공개 베타 운영 2주(제안)
- [ ] 인증 관련 장애 0, `/auth/callback` 오류율 1% 미만(제안)
- [ ] 가입자 중 `globalcommerce` 이용 권한(`app_entitlements`)이 없는 사용자 0
- [ ] 카카오 디벨로퍼스 앱, 이메일 동의항목 정책(비즈 앱 `account_email` 권장, 미확인)
- [ ] 네이버 애플리케이션 등록, 검수 자료(로그인 버튼부터 가입 완료까지 캡처)
- [ ] `tasks/task-044.md`에 "G2 통과" 기록

### 14.6 Stage C 요약

| 제공자 | 할 일 | 통과 기준 |
|---|---|---|
| 카카오 | REST API 키·Client Secret, Redirect URI = Supabase 콜백, 동의항목 설정 → Supabase Providers → Kakao | 신규·기존 계정 로그인, 이메일 없는 경우 처리 |
| 네이버 | 분리된 스테이징 Supabase에서 `custom:naver` 스파이크(중첩 응답 `response.email` 읽기 여부 미확인) → 실패하면 서버 브리지(`/auth/naver/start`, `/auth/naver/callback`) | 재로그인 시 같은 사용자, 결정은 task 파일에 기록 |
| 공통 | 배포 `AUTH_PROVIDERS`에 추가. 네이버는 검수 통과 전 넣지 않음 | 044 수용 기준 |

## 부록 A. R2 착수 체크리스트(W6 전)

- [ ] R1 출시, 공개 베타 운영. 첫 유료 매출 검증 결과를 사람이 판정해 "R2 착수"를 `tasks/README.md`에 기록(GC-D-02, 기준은 06장 정본, 없으면 제안: 유료 구독 1건 이상)
- [ ] O-05(숏폼 한도·단가), O-06(댓글 고정), O-07(블로그 도메인), O-08(다크 테마) 확정
- [ ] FFmpeg 설치, 워커 실행 환경에 FFmpeg와 한글 폰트 포함(배포 이미지 확인)
- [ ] YouTube Data API(OAuth 앱 검증, 업로드 쿼터), Meta 앱(Instagram 비즈니스 계정, 검수) 신청
- [ ] TTS 제공자 결정(미확인)과 키, 기본 제공 음원 풀의 라이선스 확인
- [ ] `workflows`, `workflow_versions`, 콘텐츠 테이블(`posts`, `publish_targets`, `videos`, `sns_accounts`, `sns_posts`) 마이그레이션을 `05_DATA_MODEL.md` 기준으로 준비
- [ ] @xyflow/react 12 버전 고정, 캔버스 `Workflows.dc.html` 값 추출
- [ ] R2 메뉴(블로그, 숏폼, SNS, 워크플로우) 노출 전환 방식 확인(00장 5.2)
- [ ] W6 task 파일 작성, 6.3 배치 확인

## 부록 B. R3 착수 체크리스트(W7 전)

- [ ] W6 완료, R2 운영 안정
- [ ] pgvector 확장과 `product_embeddings`(1536차원), `jsonld_snapshots` 마이그레이션
- [ ] 임베딩 비용 추정(상품 수 × 갱신 빈도)과 크레딧 단가
- [ ] 하이브리드 검색 가중치 기본값(제안)과 평가용 질의 세트
- [ ] JSON-LD(schema.org Product)를 상세페이지·자체 블로그에 넣는 위치 확인(`03_SCREENS_UX.md`)
- [ ] FastAPI·LangGraph·Dify·RAG·음성 계층 재판단(GC-D-08). 넣기로 하면 00장에 새 결정을 추가하고 기획서 갱신 task부터
- [ ] W7 task 파일 작성
