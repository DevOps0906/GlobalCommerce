# 04 API: GlobalCommerce

작성일 2026-10-25. 결정 정본은 `products/00_DECISIONS.md`(00장), 구조는 `02_ARCHITECTURE.md`(02장), 테이블은 `05_DATA_MODEL.md`(05장)다. 벤치마크는 platform-docs `products/nomad-commerce/04_API.md`. 코드 블록은 계약 예시이며 구현 파일이 아니다. 크레딧 값은 제안이고 정본은 01장 4절이다(다르면 01장 값을 `packages/domain` `CREDIT_COST`에 넣는다).

## 1. 원칙

| 항목 | 규칙 |
|---|---|
| 인증 | 모든 `/api/*`(웹훅, `/api/dev/login` 제외) 첫 줄에서 `requireSession('globalcommerce', { roles })` → `session_context` 1회. 미로그인 401, 프로필 pending/suspended 403, `entitled=false` 402 |
| 역할 | 콘텐츠 쓰기는 owner/admin/member, 마켓 계정·결제·설정 일반은 owner/admin, 운영은 `platform_role`(super admin). `ctx.org?.role`이 없으면 거부(NULL-safe, `SECURITY_BASELINE.md` 2장) |
| 플랜 | `entitled_plan_code` + `plans.features`(`gc_features`)만. 요청 바디·쿠키의 plan/role/model/provider 값은 무시. 이 문서의 feature 키(`features.workflow`, `features.sns`, `features.search`)는 제안이고 이름 정본은 01장 4절 |
| 멱등 | 쓰기·유료 요청은 클라이언트가 UUID `request_id`를 보낸다. 차감 키 `consume:globalcommerce:<request_id>:<item>`, 잡 키 `job:globalcommerce:<request_id>:<item>`(`CORE_SPEC.md` 4.4절 형식) |
| 크레딧 | Route Handler가 항목마다 `consume_credits` → `enqueue_job(p_credit_ledger_id)`. 클라이언트가 부르는 별도 차감 API 없음. 동기 AI는 차감 → 호출 → 실패 시 `refund_credits` |
| DB 쓰기 | 사용자 콘텐츠(상품 메모, 상세페이지 블록 초안 등)도 Route Handler에서 검증 후 저장. 상태·과금·한도가 걸린 쓰기는 service_role 또는 4절 RPC만 |
| 읽기 | 목록·상세는 서버 컴포넌트가 RLS 아래 직접 읽는다(`products`, `workflow_runs`, `market_listings` 등). GET Route Handler는 다운로드, 검색, 관리자 검색, 대시보드 갱신만 |
| 응답 봉투 | 성공 `{ data }`, 실패 `{ error: { code, message, details? } }`. code는 8절 |
| 레이트 리밋 | `rate_limit_hit('gc:<route>:<org_id>', 60, 60)` 기본, 초과 429 `RATE_LIMITED`. AI 동기 경로는 분당 20(제안) |
| 입력 | zod 4. 문자열 길이 상한, 배열 상한, URL은 `packages/net` 검사 |
| 타임아웃 | 외부 호출 `AbortSignal.timeout`: 마켓 30초, 공급자 15초, LLM 동기 30초(02장 5.1절) |
| 진행률 | 응답은 `run_id`를 돌려주고 화면은 `jobs`·`workflow_run_steps` Realtime을 구독한다. SSE 없음 |

## 2. Route Handler

경로는 `apps/web/app/api/<영역>/`. "화면" 열은 00장 5.2절 ID와 디자인 캔버스의 행동 문구다.

### 2.1 소싱·상품 (R1)

| 메서드 경로 | 화면 | 역할/플랜 | 입력(zod 요약) | 출력 | 크레딧 | RPC·잡 | 오류 |
|---|---|---|---|---|---|---|---|
| `POST /api/sourcing/amazon` | S02 "N건 수집 시작" | member+ | `{ request_id, urls: string[1..50] }`(한 줄에 하나) | `{ run_id, accepted[], rejected[{ input, code }] }` | URL당 1 | `consume_credits`, `enqueue_job(import.amazon)`, `workflow_runs`(system `sourcing.amazon`) | 400 `GC010`(허용 도메인 아님, 행 단위), 403 `GC002`, 402 `CR001` |
| `GET /api/sourcing/excel/template?supplier=` | S02 "엑셀 양식 받기" | member+ | `supplier: ownerclan, domeggook, custom` | 302 정적 양식 | 0 | - | 400 |
| `POST /api/sourcing/excel/upload-url` | S02 "파일 선택" | member+ | `{ filename, bytes(≤10MB) }` | `{ storage_path, signed_upload_url }` | 0 | Storage `org-files` | 413 |
| `POST /api/sourcing/excel` | S02 업로드 완료 | member+ | `{ request_id, storage_path, supplier }` | `{ import_id, run_id }`(미리보기 생성) | 0 | `source_imports`, `enqueue_job(import.excel, mode preview)` | 400 형식 |
| `POST /api/sourcing/excel/[importId]/commit` | S02 열 매핑 확정 | member+ | `{ request_id, column_mapping: Record<string,string> }` | `{ run_id }` | 0 | `enqueue_job(import.excel, mode commit)` | 409 `GC001`, 403 `GC002` |
| `POST /api/products/process` | S03 "선택 상품 가공", S02 "가공 시작" | member+ | `{ request_id, product_ids[1..100], steps?: ('title','cutout','compose','assemble')[] }`(기본 `['title']`, 제안) | `{ run_id, queued, held }` | 단계별 단가 × 상품 수 | `consume_credits` 항목별, `enqueue_job`(뒤 단계 `parent_job_id`, 보류는 `run_after=infinity`) | 202 `GC008`(일부 보류), 402, 409 `GC001` |
| `POST /api/products/edits` | S03 "변경 저장" | member+ | `{ request_id, edits: [{ product_id, field: 'title'\|'cost_usd'\|'category', value, base_updated_at }] (≤200) }` | `{ products[{ id, verdict, issues }] }` | 0 | `packages/compliance` 판정 → `gc_apply_product_edits` | 409 `VERSION_CONFLICT`, 422 |
| `POST /api/products/[id]/title/revert` | S03 "되돌리기"(저장 후) | member+ | `{ revision_id }` | product | 0 | `title_revisions` → `gc_apply_product_edits` | 404 |
| `POST /api/products/bulk` | S02 "삭제"·"제외" | member+ | `{ ids[≤500], action: 'archive'\|'restore'\|'delete' }` | `{ affected }` | 0 | - | 409 업로드 진행 중 |
| `PATCH /api/products/[id]` | S04 원가·환산가 | member+ | `{ cost_usd?, notes? }` | product(서버가 환산가·마진 재계산) | 0 | `fx_rates` | 404 |
| `POST /api/products/[id]/activities` | S04 "메모" | member+ | `{ body(1..1000) }` | activity | 0 | `product_activities` | 404 |
| `POST /api/banned-words` | S03 "단어 추가" | owner/admin | `{ word(1..40), category: 'cosmetics'\|'health_food', severity: 'fail'\|'warn', replacement? }` | 단어(조직 사전) | 0 | `banned_words`(org_id = 내 조직) | 409 중복(23505) |
| `DELETE /api/banned-words/[id]` | S03 사전 | owner/admin | - | 204 | 0 | 기본 사전(org_id null) 행은 삭제 불가 | 403 |

### 2.2 이미지·상세페이지 (R1)

크레딧 열 값은 01장 4.2절이 정본이다.

| 메서드 경로 | 화면 | 역할/플랜 | 입력(zod 요약) | 출력 | 크레딧 | RPC·잡 | 오류 |
|---|---|---|---|---|---|---|---|
| `POST /api/products/[id]/images/cutout` | S04 "누끼" | member+ | `{ request_id, source_image_id }` | `{ run_id, job_id }` | 1 | `enqueue_job(image.cutout)` 보류 가능 | 202 `GC008`, 402 |
| `POST /api/products/[id]/images/compose` | S04 "합성 이미지 생성", "다시 만들기" | member+ | `{ request_id, cutout_image_id, background_prompt(1..300), product_ratio?(0.5..0.85, 기본 0.7), overlay_text?(≤20) }` | `{ run_id, job_id }` | 2 | `enqueue_job(image.compose)` | 202 `GC008`, 402, 422 금지어 FAIL 문구 |
| `POST /api/products/[id]/images/upload-url` | S04 추가 이미지 "추가" | member+ | `{ filename, bytes(≤10MB), mime: jpeg/png/webp }` | `{ image_id, signed_upload_url }` | 0 | `product_images`(kind `extra`) | 413 |
| `POST /api/products/[id]/images/confirm` | S04 "이미지 확정" | member+ | `{ main_image_id, extra_image_ids[≤9] }` | product | 0 | `images_confirmed_at` 기록 + `product_activities` kind `images_confirmed` | 409 `GC001` |
| `DELETE /api/products/[id]/images/[imageId]` | S04 | member+ | - | 204 | 0 | - | 409 확정된 대표 이미지 |
| `POST /api/detail-pages` | S05 진입 시 생성 | member+ | `{ request_id, product_id }` | `{ detail_page_id, run_id }`(이미 있으면 기존 행, 차감 0) | 2 | `enqueue_job(detail.assemble)` | 202 `GC008`, 402, 409 이미지 미확정 |
| `PATCH /api/detail-pages/[id]` | S05 자동 저장 | member+ | `{ expected_version, blocks: { hook, features[3], specs[], shipping } }`(문자열 sanitize) | `{ version, verdict, issues }` | 0 | 규칙 판정만(LLM 재판정 없음) | 409 `VERSION_CONFLICT`, 409 `GC001`(확정 후) |
| `POST /api/detail-pages/[id]/blocks/[block]/rewrite` | S05 "AI로 다시 쓰기" | member+ | `{ request_id, instruction?(≤200) }`, `block: hook\|features\|specs` | `{ text, issues }`(저장 안 함, 에디터가 실행 취소 스택에 넣음) | 1 | 동기 `packages/ai` `detail.copy`, 실패 시 `refund_credits` | 402, 503 `AI_UNAVAILABLE`(환불됨) |
| `POST /api/detail-pages/[id]/acknowledge` | S05 WARN 확인 | member+ | `{ note?(≤200) }` | page | 0 | `gc_acknowledge_compliance_warning` | 409 확인할 WARN 없음 |
| `POST /api/detail-pages/[id]/finalize` | S05 "상세페이지 확정" | member+ | `{ request_id }` | `{ run_id }` | 0 | 상태 `confirmed` → `enqueue_job(detail.render_market)` | 422 `GC004`, 422 `GC005`, 422 `GC006`, 409 `GC001` |
| `POST /api/detail-pages/[id]/preview-link` | S05 "미리보기 링크" | member+ | `{ ttl_days?(1..7) }` | `{ url, expires_at }` | 0 | HMAC 토큰 | - |
| `GET /api/detail-pages/preview/[token]` | 공개 미리보기 | 공개 | - | HTML(읽기 전용, `noindex`) | 0 | 토큰 검증 | 410 만료 |

### 2.3 업로드·내보내기·실행 기록 (R1)

| 메서드 경로 | 화면 | 역할/플랜 | 입력(zod 요약) | 출력 | 크레딧 | RPC·잡 | 오류 |
|---|---|---|---|---|---|---|---|
| `POST /api/uploads` | S06 "선택한 N건 전송" | member+ | `{ request_id, product_ids[1..100], market_account_ids[1..30] }` | `{ batch_id, run_id, created, skipped_registered }` | 0 | `gc_create_upload_batch` → `enqueue_job(upload.coupang\|upload.smartstore)` 상품×계정 | 422 `GC004`·`GC005`·`GC009`, 409 `GC001`, 403 `GC007` |
| `POST /api/uploads/[batchId]/retry-failed` | S06 "실패 건만 다시 보내기", 모바일 "실패 건 다시" | member+ | `{ request_id }` | `{ requeued }` | 0 | 실패 `market_listings`만 재등록(성공 건 제외) | 409 실패 건 없음 |
| `POST /api/uploads/[batchId]/cancel` | S06 "전송 취소" | member+ | - | `{ canceled, running }` | 0 | 대기 잡 `cancel_job`, 실행 중은 끝까지 | 409 |
| `PATCH /api/listings/[id]` | S06 "속성 입력"(실패 · 속성 누락) | member+ | `{ attributes: Record<string,string> }` | listing | 0 | - | 409 성공 건 |
| `POST /api/exports` | S06 엑셀·ZIP | member+ | `{ request_id, kind: 'excel'\|'zip', market: 'coupang'\|'smartstore'\|'playauto', product_ids[1..500] }` | `{ export_id, run_id }` | 0 | `enqueue_job(export.excel\|export.zip)` | 422 `GC004`·`GC005` |
| `GET /api/exports/[id]/download` | S06 | member+ | - | 302 서명 URL(7일) | 0 | `exports` 버킷, 감사 `export.download` | 410 만료 |
| `POST /api/runs/[id]/retry` | S11 "처음부터 다시", "<단계>부터 다시 실행" | member+ | `{ request_id, from_step: string \| 'start' }` | `{ run_id, requeued }` | 다시 넣는 유료 항목 단가 | 지정 단계 이후 실패·취소 항목만 새 원장으로 | 409 `GC001`(실행 중), 402 |
| `POST /api/runs/[id]/cancel` | S11, S10 | member+ | - | run | 대기 항목 환불 | `cancel_requested_at` + 대기 잡 `cancel_job` | 409 종료됨 |
| `GET /api/dashboard/summary` | S01 갱신 | member+ | - | KPI(오늘 처리 대기, 가공·업로드 수), 최근 실행 5건, 크레딧 잔액 | 0 | `gc_dashboard_summary` | - |

### 2.4 설정·결제·운영 (R1)

| 메서드 경로 | 화면 | 역할/플랜 | 입력(zod 요약) | 출력 | 크레딧 | RPC·잡 | 오류 |
|---|---|---|---|---|---|---|---|
| `POST /api/market-accounts` | S13 "계정 추가" | owner/admin | `{ market: 'coupang'\|'smartstore', label(1..20), vendor_id?, secrets: { access_key, secret_key } \| { client_id, client_secret } }` | 계정(키 끝 4자리 마스킹) | 0 | 검증 호출 → `encrypted_credentials` → `market_accounts`, 감사 `market_account.add` | 403 `GC003`(details `{ addon_url: '/billing?addon=1' }`), 422 `GC009` |
| `POST /api/market-accounts/[id]/rotate` | S13 "키 다시 등록" | owner/admin | `{ secrets }` | 계정 | 0 | 검증 → 새 자격증명 → 이전 것 `revoke_credential`, 감사 `market_account.rotate` | 422 `GC009` |
| `POST /api/market-accounts/[id]/verify` | S13 "관리" | owner/admin | - | `{ status, checked_at }` | 0 | - | 502 `MARKET_UNAVAILABLE` |
| `PATCH /api/market-accounts/[id]` | S13 "관리" | owner/admin | `{ label?, is_active? }` | 계정 | 0 | 슬롯 트리거 | 403 `GC003`(다시 켤 때) |
| `DELETE /api/market-accounts/[id]` | S13 | owner/admin | - | 204 | 0 | `revoke_credential`, 상태 `disabled`, 감사 | 409 전송 중 |
| `PATCH /api/settings/general` | S13 일반 "이 섹션 저장" | owner/admin | `{ target_margin_pct?(0..90), default_marketplace?, timezone? }` | 설정 | 0 | - | 422 |
| `PUT /api/settings/shipping` | S13 배송, S05 "템플릿 문구 편집" | owner/admin | `{ overseas_enabled, overseas_body(≤2000), domestic_body?, return_days(≥7), return_fee? }` | 템플릿 | 0 | `shipping_templates`(CHECK) | 422 `GC006` |
| `POST /api/audio-tracks/upload-url` | S13 "음원 올리기" | member+ | `{ filename, bytes(≤20MB), mime: mp3/wav/m4a }` | `{ track_id, signed_upload_url }` | 0 | `audio_tracks`(status `uploading`) | 413 |
| `POST /api/audio-tracks/[id]/complete` | S13 업로드 완료 | member+ | `{ title(1..60), license_note? }` | 트랙(서버가 길이 측정) | 0 | - | 422 형식 |
| `DELETE /api/audio-tracks/[id]` | S13 | member+ | - | 204 | 0 | - | 409 렌더 대기 중 사용 |
| `PUT /api/settings/notifications` | S13 알림 | member+ | `{ in_app: Record<event,bool>, email: Record<event,bool> }` | 설정 | 0 | `notification_prefs` | 422 |
| `POST /api/billing/orders` | S14 플랜 변경, 크레딧팩, 추가 슬롯 "다음: 결제" | owner/admin | `{ request_id, kind: 'subscription'\|'credit_pack'\|'slot_addon', plan_code?, interval?: 'monthly'\|'yearly', pack_code?, quantity?(1..20) }` | `{ orderId, amount, customerKey, orderName }` | - | `payment_orders` INSERT. 슬롯 가격은 O-03 전까지 404 `ADDON_PRICE_UNSET`. 연간 가격은 01장 결정 전 거부 | 409 |
| `POST /api/billing/confirm` | S14 결제 완료 | owner/admin | `{ paymentKey, orderId, amount }` | 결과 | - | Toss 승인 → `confirm_payment_order`(크레딧팩·구독 지급, 추가 슬롯 `slot_addons`) | 409 `PM001`/`PM409`/`PM410`, 404 `PM404` |
| `POST /api/billing/billing-key` | S14 "결제 수단 변경" | owner/admin | `{ authKey, customerKey }` | 카드 요약(끝 4자리) | - | `billing_keys`(암호문) | 502 |
| `POST /api/billing/subscription` | S14 "엔터로 올리기", "낮추기", "해지" | owner/admin | `{ action: 'upgrade'\|'downgrade'\|'cancel'\|'resume', plan_code? }` | 구독 | - | `apply_subscription_transition` | 409 `SB001` |
| `GET /api/billing/receipts/[paymentId]` | S14 "영수증" | owner/admin | - | 302 Toss 영수증 URL | - | `payments` | 404 |
| `GET /api/admin/users` | S15 검색 | platform admin | `?q&role&plan&cursor` | 사용자 목록 | - | service_role 조회 | 403 |
| `PATCH /api/admin/users/[id]` | S15 "변경 저장" | platform admin | `{ platform_role?, plan_code?, reason(5..200) }` | 사용자 | - | `profiles` 갱신, 플랜은 `gc_admin_set_plan`, 감사 `admin.role_change`·`admin.plan_change` | 403, 409 |
| `GET /api/admin/jobs/failed` | S15 오늘 실패 목록 | platform admin | `?since` | 실패 잡(오류 한 줄, 조직, 유형) | - | `jobs` | 403 |
| `POST /api/onboarding/terms` | S16 온보딩 | 로그인 사용자 | `{ terms_version, privacy_version, marketing_opt_in }` | 204 | - | 감사 `auth.terms_ack` | 409 버전 불일치 |

### 2.5 R2: 워크플로우·콘텐츠·SNS

| 메서드 경로 | 화면 | 역할/플랜 | 입력(zod 요약) | 출력 | 크레딧 | RPC·잡 | 오류 |
|---|---|---|---|---|---|---|---|
| `POST /api/workflows` / `PATCH /api/workflows/[id]` / `DELETE` | S10 | member+ / `features.workflow` | `{ name(1..60) }` | workflow | 0 | - | 403 `GC007` |
| `POST /api/workflows/[id]/versions` | S10 저장, "버전 기록" | member+ | `{ base_version, graph: { nodes[≤50], edges[≤100] } }` | `{ version }` | 0 | 02장 4.5절 저장 검증 | 422 `GRAPH_INVALID`(노드 id 목록), 409 `VERSION_CONFLICT` |
| `POST /api/workflows/[id]/versions/[v]/restore` | S10 버전 기록 | member+ | - | `{ version }`(새 버전으로 복사) | 0 | - | 404 |
| `POST /api/workflows/[id]/run` | S10 "실행" | member+ | `{ request_id, version?, inputs?: { urls?, import_id?, product_ids? } }` | `{ run_id }` | 노드 실행 시 항목별 차감(02장 4.5절) | `workflow_runs`(kind `workflow`) → `enqueue_job(workflow.step)` | 402(잔액 0), 403 `GC007` |
| `POST /api/posts/generate` | S07 "상품에서 원고 만들기" | member+ | `{ request_id, product_id, detail_page_id? }` | `{ post_id, run_id }` | 2 | `enqueue_job(blog.generate)` | 202 `GC008`, 402 |
| `PATCH /api/posts/[id]` | S07 편집 | member+ | `{ expected_version, title, body_md(≤20000), slug? }` | `{ version, verdict }` | 0 | 규칙 판정 | 409 `VERSION_CONFLICT` |
| `POST /api/posts/[id]/polish` | S07 "AI로 다듬기" | member+ | `{ request_id, selection?(≤2000) }` | `{ text }`(저장 안 함) | 1 | 동기 `blog.polish` | 402, 503 |
| `POST /api/posts/[id]/publish` | S07 "지금 발행", "예약" | member+ | `{ request_id, targets: [{ type: 'self'\|'wordpress', publish_target_id? }], scheduled_at? }` | `{ run_id }` | 0 | `enqueue_job(blog.publish, run_after=scheduled_at)` | 422 `GC004`, 422 `GC005` |
| `POST /api/publish-targets` / `DELETE /api/publish-targets/[id]` | S07 발행처 | owner/admin | `{ kind: 'wordpress', site_url(https), username, app_password }` | 대상(마스킹) | 0 | `packages/net` 검사 → 검증 호출 → `encrypted_credentials` | 400 `GC010`(사설 IP 등), 422 인증 실패 |
| `POST /api/videos` | S08 "렌더링 시작" | member+ / 월 숏폼 한도 | `{ request_id, product_id, seconds: 15\|30\|50, motion: 'zoom_in'\|'pan'\|'split', audio: { mode: 'mine'\|'stock'\|'random', track_id?, loop }, voice: string }` | `{ video_id, run_id }` | 2/3/4 | `enqueue_job(shorts.render)` 보류 가능 | 403 `GC007`(월 편수 초과), 202 `GC008`, 402 |
| `POST /api/videos/[id]/rerender` | S08 "설정 고치고 다시 렌더" | member+ | 위와 같은 필드 일부 + `request_id` | `{ video_id, run_id }` | 위와 같음 | 새 잡, 이전 결과 보존 | 409 렌더 중 |
| `POST /api/videos/[id]/cancel` | S08 렌더 대기열 | member+ | - | video | 대기 시 환불 | `cancel_job` | 409 |
| `POST /api/sns/accounts/connect` | S09 연결된 채널 | owner/admin / `features.sns` | `{ provider: 'youtube'\|'instagram' }` | `{ authorize_url }` | 0 | `create_oauth_state` | 403 `GC007` |
| `GET /api/sns/callback/[provider]` | OAuth 복귀 | 로그인 사용자 | `code`, `state` | 302 `/content/sns` | 0 | `consume_oauth_state` → 토큰 교환 → `encrypted_credentials` → `sns_accounts` | 400 `OA001` |
| `DELETE /api/sns/accounts/[id]` | S09 | owner/admin | - | 204 | 0 | `revoke_credential` | - |
| `POST /api/sns/posts` | S08 "SNS 업로드로 보내기", S09 "업로드 예약" | member+ | `{ request_id, video_id, sns_account_ids[1..10], scheduled_at, caption?(≤2200), insert_link: boolean }` | `{ sns_post_ids[] }` | 0 | `enqueue_job(sns.upload, run_after)`. 상품 URL 없으면 `link_pending` | 422 `GC004`(캡션 FAIL) |
| `PATCH /api/sns/posts/[id]` / `DELETE` | S09 일정 변경·취소 | member+ | `{ scheduled_at? }` | sns_post | 0 | 대기 잡 `cancel_job` 후 재등록 | 409 업로드됨 |

### 2.6 R3: 검색·GEO

| 메서드 경로 | 화면 | 역할/플랜 | 입력(zod 요약) | 출력 | 크레딧 | RPC·잡 | 오류 |
|---|---|---|---|---|---|---|---|
| `POST /api/search` | S12 "검색" | member+ / `features.search` | `{ query(1..200), semantic_weight(0..100), filters: { source?, category?, registered_only? }, limit(≤50) }` | 결과(유사도, 일치 근거) | 0(분당 30) | 질의 임베딩 → `gc_hybrid_search` | 403 `GC007`, 503 |
| `POST /api/search/export` | S12 "CSV 내보내기" | member+ | 위와 같음, `limit(≤1000)` | `text/csv` | 0 | 같음 | 429 |
| `POST /api/jsonld/apply` | S12 "JSON-LD 반영" | member+ | `{ request_id, product_ids[1..100], targets: ('detail_page'\|'blog')[] }` | `{ run_id }` | 0 | `enqueue_job(jsonld.build)` | 422 가격·URL 없음 |

상품 임베딩(`embed.product`)은 Route Handler가 아니라 상품명·상세페이지 저장 경로가 서버 안에서 등록한다(멱등 키 `job:globalcommerce:embed:<product_id>:<updated_at>`).

## 3. RPC (SECURITY DEFINER)

제품 함수는 `public`에 `gc_` 접두사로 둔다. 모두 `set search_path = ''`, PUBLIC EXECUTE 회수, 호출자 판정은 `is_service_caller()`(`SECURITY_BASELINE.md` 1장, 3장). SQL 정본은 05장이며 이 표는 이름과 계약이다.

| 함수 | 시그니처 | 호출자 | 검사 | 반환 | SQLSTATE |
|---|---|---|---|---|---|
| `gc_features` | `(p_org_id uuid) returns jsonb` | service_role | - | 플랜 features | - |
| `gc_limit` | `(p_org_id uuid, p_key text, p_default int) returns int` | service_role, 트리거 | - | 한도(상품 수, 슬롯 = 플랜 + `slot_addons`, 동시 생성, 숏폼 편수) | - |
| `gc_transition_allowed` | `(p_table text, p_from text, p_to text) returns boolean` | 트리거, authenticated | immutable | 허용 여부 | - |
| `gc_apply_product_edits` | `(p_org_id uuid, p_actor_id uuid, p_edits jsonb) returns setof products` | service_role | 같은 조직 행만, `base_updated_at` 일치, 판정 결과(Route Handler 계산) 저장, `title_revisions` 기록 | 갱신 행 | `GC001`, 40001 → 409 `VERSION_CONFLICT` |
| `gc_acknowledge_compliance_warning` | `(p_target_type text, p_target_id uuid, p_note text default null)` | authenticated, service_role | `has_org_role(owner,admin,member)`, verdict `warn` | 행, `write_audit('compliance.warn_ack')` | `P0002`, `42501`, 22023(WARN 없음) |
| `gc_create_upload_batch` | `(p_org_id uuid, p_actor_id uuid, p_product_ids uuid[], p_account_ids uuid[], p_request_id text) returns jsonb` | service_role | 상품 상세페이지 `confirmed`, verdict FAIL 없음(GC004), WARN 확인(GC005), 계정 활성·같은 조직·키 유효(GC009), 이미 `registered`인 (상품, 계정)은 건너뜀, 멱등. 배치는 `confirmed`부터 받지만 전송 잡은 상세페이지가 `ready`(마켓 이미지 변환 완료)가 된 뒤 시작한다 | `{ batch_id, run_id, listing_ids, skipped_registered }` | `GC001`, `GC004`, `GC005`, `GC009` |
| `gc_release_held_jobs` | `(p_max int default 200) returns int` | service_role(디스패처) | 조직별 running 수 < `gc_limit(org,'concurrency',1)`, 부모 잡 `succeeded` | 해제 수 | - |
| `gc_record_step_outcome` | `(p_step_id uuid, p_outcome text, p_message text default null)` | service_role(워커) | outcome `done`/`failed`/`skipped` | 단계 행(집계·상태 갱신, 마지막이면 run 종료) | 22023 |
| `gc_dashboard_summary` | `(p_org_id uuid) returns jsonb` | authenticated | `is_org_member` | KPI, 최근 실행, 크레딧 잔액 | `42501` |
| `gc_admin_set_plan` | `(p_org_id uuid, p_plan_code text, p_reason text)` | service_role(관리자 Route Handler) | 호출 전 `is_platform_admin` 확인 | 구독·엔타이틀먼트 갱신, `write_audit` | 22023 |
| `gc_hybrid_search`(R3) | `(p_org_id uuid, p_query_embedding vector(1536), p_query_text text, p_semantic_weight real, p_filters jsonb, p_limit int)` | service_role | 같은 조직만 | 상품 id, 점수, 일치 근거 | - |

코어 RPC(`session_context`, `bootstrap_app_for_org`, `consume_credits`, `refund_credits`, `enqueue_job`, `claim_jobs`, `heartbeat_job`, `complete_job`, `fail_job`, `cancel_job`, `reap_stale_jobs`, `confirm_payment_order`, `fail_payment_order`, `apply_subscription_transition`, `revoke_credential`, `rate_limit_hit`, `write_audit`, R2 `create_oauth_state`, `consume_oauth_state`)는 platform-docs `products/_platform-core/CORE_SPEC.md`와 `MONOLITH_CORE_LITE.sql`을 인용만 한다.

## 4. 잡 페이로드 계약

비밀값은 넣지 않는다(`market_account_id`, `credential_id`만). 모든 payload에 `run_id`, `step_id`가 있다(아래에서는 생략). 진행 메시지는 `heartbeat_job(p_progress, p_message)`.

```ts
// import.amazon / import.excel
type ImportAmazonPayload = { url: string; asin: string; marketplace: 'US'|'CA'|'JP'|'DE'|'UK' }
type ImportExcelPayload  = { import_id: string; storage_path: string; supplier: 'ownerclan'|'domeggook'|'custom';
                             mode: 'preview'|'commit'; column_mapping?: Record<string, string> }
type ImportResult        = { product_ids: string[]; created: number; updated: number; error_cells?: Array<{ row: number; col: string; reason: string }> }

// title.generate
type TitleGeneratePayload = { product_id: string; revision_id: string }
type TitleGenerateResult  = { title_ko: string; keywords: string[]; replaced: Array<{ from: string; to: string }>; verdict: 'pass'|'warn'|'fail'; provider: string }

// image.cutout / image.compose
type CutoutPayload  = { product_id: string; source_image_id: string; target_image_id: string }
type ComposePayload = { product_id: string; cutout_image_id: string; target_image_id: string; background_prompt: string;
                        product_ratio: number; overlay_text?: string; attempt: number }
type ImageResult    = { storage_path: string; width: 1080; height: 1080; provider: string }

// detail.assemble / detail.render_market
type DetailAssemblePayload = { detail_page_id: string; product_id: string; attach_overseas_shipping: boolean }
type DetailAssembleResult  = { version: number; verdict: 'pass'|'warn'|'fail'; issues: ComplianceIssue[] }
type RenderMarketPayload   = { detail_page_id: string; markets: Array<'coupang'|'smartstore'> }
type RenderMarketResult    = { market_image_ids: string[] }

// upload.coupang / upload.smartstore / upload.poll_status
type UploadPayload = { listing_id: string; market_account_id: string }
type UploadResult  = { market_product_id: string; status: 'submitted'|'registered'; product_url?: string }
type PollPayload   = { listing_ids: string[] }

// export.excel / export.zip / export.expire
type ExportPayload = { export_id: string }
type ExportResult  = { storage_path: string; bytes: number; rows?: number }

// fx.fetch / trend.fetch
type FxFetchPayload    = { date: string }   // YYYY-MM-DD KST
type TrendFetchPayload = { date: string; keyword_groups: string[]; refresh_season_picks: boolean }

// R2
type WorkflowStepPayload = { run_id: string; step_id: string; node_id: string; attempt: number }
type BlogGeneratePayload = { post_id: string; product_id: string; detail_page_id?: string }
type BlogPublishPayload  = { post_id: string; target: { type: 'self'|'wordpress'; publish_target_id?: string } }
type ShortsRenderPayload = { video_id: string; resume_from?: 'script'|'tts'|'motion'|'audio_mix'|'encode' }
type ShortsRenderResult  = { storage_path: string; duration_sec: number; bytes: number }
type SnsUploadPayload    = { sns_post_id: string; sns_account_id: string }
type SnsLinkInsertPayload = { sns_post_id: string; product_url: string }

// R3
type EmbedProductPayload = { product_id: string; content_hash: string }
type JsonLdBuildPayload  = { product_id: string; targets: Array<'detail_page'|'blog'> }
```

| 잡 | 진행률 규칙 |
|---|---|
| import | 처리 행 / 전체 행(`parse:120/312`) |
| title, image, detail.assemble | `generate` 30, `validate` 70, `save` 100 |
| upload | `validate` 20, `send` 60, `submitted` 100 |
| export | 처리 상품 / 전체 |
| shorts.render | `script`, `tts`, `motion`, `audio_mix`, `encode` 단계별 20씩. 실패 시 `resume_from`으로 그 단계부터 |

## 5. 웹훅

| 방향 | 제공자/이벤트 | 서명 | event_id | 처리 |
|---|---|---|---|---|
| 수신 | Toss 결제 상태(취소, 가상계좌 입금 등) `POST /api/webhooks/toss` | 시크릿 검증(방식 미확인, `SHARED_MODULES.md` 6장) + rawBody 1MB 상한 | paymentKey + status + 시각 해시, `webhook_events` 유일 | 상태 동기화만. 지급은 confirm 경로(`confirm_payment_order`) |
| 수신 | fal | 쓰지 않는다(R1은 워커가 fal 큐 결과를 폴링, 30분 미도착 실패·환불) | - | 웹훅 방식으로 바꾸면 `/api/webhooks/fal?token=`(URL 토큰 + `request_id` 대조) |
| 발신 | 없음(R1·R2) | - | - | 외부 자동화 웹훅 발신은 범위 밖 |

## 6. 외부 API 어댑터

| 외부 API | 호출 위치 | 인증 | 실패 처리 | 쿼터·비고 |
|---|---|---|---|---|
| 쿠팡 Wing Open API | 워커 `packages/markets/coupang` | 셀러 Access/Secret 키 HMAC-SHA256 서명 + vendorId | 5xx·429 재시도 3회, 4xx 즉시 실패(필드 오류 → 한 줄 사유) | 등록 후 승인 요청·결과 조회 단계, 호출 IP 등록 요구 여부 미확인. 상태 폴링 10분 |
| 네이버 커머스 API(스마트스토어) | 워커 `packages/markets/smartstore` | 셀러 client_id/secret → 전자서명 → 토큰(서명 방식 미확인) | 같음 | 호출 한도 미확인. 토큰은 메모리 캐시, DB 저장 안 함 |
| 아마존 상품 데이터 | 워커 `packages/sourcing/amazon` | 플랫폼 키(env) | 없는 ASIN은 행 실패 + 환불, 429 재시도 | O-02(PA-API 또는 서드파티) 미정. 직접 스크래핑 금지. 건당 단가 미확인 |
| 한국수출입은행 현재환율 | 워커 크론 | 플랫폼 인증키 | 실패·빈 응답(비영업일) 시 이전 값 유지 + 기준 시각 표시 | 일 1회. 요청 한도·갱신 시각 미확인 |
| 네이버 데이터랩 검색어 트렌드 | 워커 크론 | Client ID/Secret 헤더 | 실패 시 이전 값 유지 | 상대 지수(절대 검색량 아님). 일 호출 한도 미확인 |
| OpenAI(Chat, 이미지, R2 TTS, R3 임베딩) | `packages/ai`(Route Handler, 워커) | `OPENAI_API_KEY` | 02장 5.2절 대체 규칙 | 모델 id·이미지 모델 제공 여부 미확인(GC-D-09) |
| Anthropic | `packages/ai` | `ANTHROPIC_API_KEY` | 대체 전용 | 모델 id 미확인 |
| fal(birefnet, flux) | 워커 | `FAL_KEY` | 제출 실패 즉시 환불, 30분 미도착 실패 | 안전 필터 켬. 단가 미확인 |
| YouTube Data API v3(R2) | 워커 `sns.upload` | OAuth 2.0 사용자 토큰(암호화 저장, 갱신 토큰) | 5xx·429 재시도, `quotaExceeded`는 다음 날로 미룸 | 업로드 쿼터 단가·일 한도 미확인. 댓글 고정 API 미지원으로 보고 수동 안내(O-06) |
| Instagram Graph API(R2) | 워커 `sns.upload` | 비즈니스 계정 장기 토큰 | 컨테이너 상태 폴링 후 게시, 실패 시 재시도 | 릴스 게시 한도·영상 URL 공개 요건 미확인(서명 URL 수명 확인 필요) |
| WordPress REST API(R2) | 워커 `blog.publish` | 애플리케이션 비밀번호 Basic 인증(암호화 저장) | 401은 즉시 실패 + 발행처 상태 `invalid`, 5xx 재시도 | `/wp-json/wp/v2/posts`. 사이트 URL은 `packages/net` 검사(https, 사설 IP 차단) |
| Toss Payments | Route Handler, 워커 크론 | 시크릿 키 | 코어 규약 | - |

## 7. 실시간 구독 계약

| 채널(테이블) | 필터 | 화면 |
|---|---|---|
| `jobs` | `org_id = 내 조직`(RLS) | S02 수집 상태, S04 생성 중, S05 조립 중 |
| `workflow_run_steps` | `run_id = <id>` | S11 진행률·노드 로그, S01 최근 실행 |
| `market_listings` | `batch_id = <id>` | S06 전송 진행(성공·실패·대기) |
| `videos`(R2) | `org_id` | S08 렌더 대기열 |

## 8. 오류 코드

| 코드 | 의미 | HTTP |
|---|---|---|
| `GC001` | 허용되지 않는 상태 전이 | 409 |
| `GC002` | 상품 수 한도 초과 | 403(업그레이드 안내) |
| `GC003` | 마켓 계정 슬롯 한도 초과 | 403 + `details.addon_url`(추가 슬롯 단계) |
| `GC004` | 금지어 FAIL 상세페이지·상품명으로 업로드·내보내기·확정 | 422 |
| `GC005` | 확인하지 않은 WARN이 있음 | 422 |
| `GC006` | 배송·반품 템플릿 규칙 위반(청약철회 7일 미만 등) | 422 |
| `GC007` | 플랜에 없는 기능(또는 월 숏폼 편수 소진) | 403 |
| `GC008` | 동시 실행 한도 초과(대기열로 넣음, 요청은 성공) | 202 |
| `GC009` | 마켓 계정 키 검증 실패 또는 만료 | 422 |
| `GC010` | 허용 도메인이 아닌 URL | 400 |
| `CR001`(코어) | 크레딧 부족 | 402 |
| 코어 기타 | `42501`→403, `P0002`/`PM404`→404, `22023`/`SB001`/`JB002`/`PM410`→409, `PM001`/`PM409`→409 + 운영 알림, `OA001`→400, `CR002`/`CR003`→500 + 운영 알림 | `CORE_SPEC.md` 15장 |
| Postgres | `23514`(CHECK)→422, `23503`(다른 조직 참조)→404, `23505`(중복)→409 | - |
| 앱 코드 `VALIDATION` | zod 실패 | 400 |
| 앱 코드 `VERSION_CONFLICT` | 편집 기준 버전 불일치 | 409 |
| 앱 코드 `RATE_LIMITED` | `rate_limit_hit` 초과 | 429 |
| 앱 코드 `AI_UNAVAILABLE` | 체인의 모든 제공자 실패(선차감 환불 완료) | 503 |
| 앱 코드 `MARKET_UNAVAILABLE` | 마켓 API 5xx·타임아웃 | 502 |
| 앱 코드 `GRAPH_INVALID`(R2) | 워크플로우 그래프 저장 검증 실패 | 422 |
| 앱 코드 `ADDON_PRICE_UNSET` | 추가 슬롯 가격 미정(O-03) | 404 |

`GC008`은 오류가 아니라 안내다. 응답은 `{ data: { run_id, queued, held }, notice: { code: 'GC008' } }`로 보내고 화면은 "앞 작업이 끝나면 시작"을 표시한다.

## 9. 인증 단계 경로

정본 platform-docs `products/_platform-core/AUTH_ROADMAP.md` 2.4절, 3.2절, 7.2.3절. 이 경로들은 `requireSession` 앞단이라 1절 인증 규칙의 예외다. 단계 분기는 `apps/web/lib/auth/`에서만 한다.

| 메서드 경로 | 단계 | 입력 | 동작 | 출력 | 오류 |
|---|---|---|---|---|---|
| `POST /api/dev/login` | A(로컬 전용) | `{ persona: 'owner'\|'admin'\|'member'\|'viewer'\|'outsider'\|'no_app'\|'suspended'\|'ops'\|'pro', next? }` | `isMockAuthAllowed()`(`AUTH_MODE=mock`, Supabase 호스트 `127.0.0.1`·`localhost`, `VERCEL_ENV`·`RAILWAY_ENVIRONMENT` 비어 있음) → `signInWithPassword(<persona>@dev.test, DEV_SEED_PASSWORD)` → `finishLogin('globalcommerce', next)` | 302 `next` 또는 `/dashboard` | 판정 거짓이면 404, 모르는 페르소나 400, 시드 안 됨 409 |
| `GET /auth/callback` | B·C | `code`, `next?` | `exchangeCodeForSession`(PKCE) → `session_context('globalcommerce')` → `entitled=false`면 `bootstrap_app_for_org('globalcommerce')` → suspended 403 → 약관 기록 없으면 `/onboarding` → `next`가 `/`로 시작하고 `//`·`@`·`\` 없을 때만 → 감사 `auth.login` | 302 | 실패 시 `/login?error=callback` |
| `GET /auth/naver/start` | C(브리지 채택 시) | `next?` | state를 HttpOnly 쿠키(HMAC `AUTH_BRIDGE_SECRET`, 10분)에 넣고 네이버 authorize로 302. 레이트 리밋 10회/10분 | 302 | 429 |
| `GET /auth/naver/callback` | C(브리지만) | `code`, `state` | state 상수 시간 비교 → 토큰 교환 → 사용자 조회 → 세션 → `finishLogin`. 네이버 토큰 저장 안 함 | 302 | `/login?error=state`, `/login?error=email_in_use`, `/login?error=callback` |

`AUTH_MODE=mock VERCEL_ENV=production pnpm -F web build`는 실패해야 하고, `AUTH_MODE=live` 빌드에서 `/api/dev/login`은 404다.

## 변경 이력

| 날짜 | 변경 |
|---|---|
| 2026-10-25 | 최초 작성(00장 5.2~5.5절, 디자인 캔버스 행동 문구 기준) |
