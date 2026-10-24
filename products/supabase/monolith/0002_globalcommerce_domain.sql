-- =====================================================================
-- 0002_globalcommerce_domain.sql  (모놀리스, public 스키마)
-- GlobalCommerce 도메인. 선행: 0001_core_lite.sql. 뒤: seed.sql
-- 정본: products/00_DECISIONS.md 5.3(테이블 이름), 5.4(잡 타입), 5.5(오류 코드), GC-D-04/05/10/11/15/18
-- 설명서: products/05_DATA_MODEL.md. 문체와 규칙은 platform-docs nomad-commerce 0002_commerce_domain.sql 을 따른다.
--
-- 규칙
--   - 모든 테넌트 테이블: org_id(cascade) + RLS + "전부 회수 후 필요한 GRANT 만".
--   - 자식 테이블은 (org_id, <parent>_id) 복합 FK 로 부모 unique (org_id, id) 를 참조한다(조직 간 참조 차단).
--   - 사용자 쓰기 테이블은 컬럼 GRANT 로 서버 전용 컬럼(판정, 상태, 비용)을 막는다. FOR ALL 정책 없음.
--   - 서버 전용 테이블은 guard_privileged_write 트리거로 이중 잠금(사용자 세션 쓰기 42501).
--   - 상태 전이는 gc_status_guard 가 gc_transition_allowed 표로 강제(GC001). service_role 쓰기에도 적용.
--   - 플랜 한도는 트리거: 상품 수 GC002, 마켓 슬롯 GC003, 기능 GC007. 금지어 게이트 GC004/GC005. 배송 규칙 GC006.
--     GC008(동시 실행)은 디스패처, GC009(키 검증)는 게이트 + 워커, GC010(허용 도메인)은 Route Handler 가 낸다.
--   - 절 구분: "-- R1" 은 MVP 에 쓰는 표, "-- R2" / "-- R3" 은 해당 릴리스 표. 한 파일에 모두 만들되(빈 표)
--     화면과 잡은 릴리스 때 켠다. 기능 게이트(plans.features)가 R2/R3 표 쓰기를 막는다.
-- 반복 실행해도 안전하다(if not exists, create or replace, drop ... if exists).
-- =====================================================================


-- =====================================================================
-- R1-0. 헬퍼: 플랜 기능, 상태 전이 표, 공용 트리거
-- =====================================================================

-- 조직의 globalcommerce 엔타이틀먼트 플랜 features. 엔타이틀먼트가 없으면 '{}'.
create or replace function public.gc_features(p_org_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p.features
    from public.app_entitlements e
    join public.plans p on p.id = e.plan_id
    where e.org_id = p_org_id and e.app_id = 'globalcommerce' and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  ), '{}'::jsonb);
$$;

-- 숫자 한도. 키가 없으면 p_default, -1 은 무제한.
create or replace function public.gc_limit(p_org_id uuid, p_key text, p_default integer)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(public.gc_features(p_org_id) ->> p_key, '')::integer, p_default);
$$;

-- 불리언 기능. 키가 없으면 false.
create or replace function public.gc_flag(p_org_id uuid, p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(public.gc_features(p_org_id) ->> p_key, '')::boolean, false);
$$;

-- 상태 전이 표. 초기 상태는 from = '' 로 표현한다. 05_DATA_MODEL.md 3장과 같다.
create or replace function public.gc_transition_allowed(p_table text, p_from text, p_to text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (coalesce(p_from, '') || '>' || coalesce(p_to, '')) = any (
    case p_table
      when 'slot_addons' then array[
        '>pending', 'pending>active', 'pending>canceled', 'active>canceled', 'active>expired']
      when 'source_imports' then array[
        '>queued', 'queued>running', 'queued>canceled', 'queued>failed',
        'running>preview_ready', 'preview_ready>queued', 'preview_ready>canceled',
        'running>completed', 'running>failed', 'running>canceled']
      when 'products' then array[
        '>collected', '>review',
        'collected>generating', 'collected>review', 'generating>review', 'generating>collected',
        'review>generating', 'review>approved', 'approved>review', 'approved>generating',
        'collected>archived', 'review>archived', 'approved>archived', 'archived>review']
      when 'detail_pages' then array[
        '>assembling', '>draft',
        'assembling>draft', 'assembling>failed', 'failed>assembling', 'draft>assembling',
        'draft>confirmed', 'confirmed>draft', 'confirmed>rendering',
        'rendering>ready', 'rendering>failed', 'failed>rendering', 'ready>draft',
        'draft>archived', 'confirmed>archived', 'ready>archived', 'failed>archived', 'archived>draft']
      when 'upload_batches' then array[
        '>queued', 'queued>running', 'queued>canceled',
        'running>completed', 'running>completed_with_errors', 'running>canceled',
        'completed_with_errors>running', 'canceled>running']
      when 'market_listings' then array[
        '>waiting', 'waiting>sending', 'waiting>canceled',
        'sending>submitted', 'sending>registered', 'sending>failed',
        'submitted>registered', 'submitted>rejected', 'submitted>failed',
        'failed>waiting', 'rejected>waiting', 'canceled>waiting']
      when 'export_files' then array[
        '>queued', 'queued>running', 'queued>canceled', 'queued>failed',
        'running>succeeded', 'running>failed', 'succeeded>expired']
      when 'workflow_runs' then array[
        '>scheduled', '>queued', 'scheduled>queued', 'scheduled>canceled',
        'queued>running', 'queued>canceled', 'running>succeeded', 'running>failed', 'running>canceled',
        'failed>queued', 'canceled>queued']
      when 'workflow_run_steps' then array[
        '>pending', 'pending>running', 'pending>skipped', 'pending>canceled',
        'running>succeeded', 'running>failed', 'running>canceled',
        'failed>pending', 'skipped>pending', 'canceled>pending']
      -- R2
      when 'posts' then array[
        '>draft', 'draft>scheduled', 'draft>publishing', 'scheduled>draft', 'scheduled>publishing',
        'publishing>published', 'publishing>failed', 'failed>draft', 'failed>publishing',
        'draft>archived', 'published>archived']
      when 'videos' then array[
        '>queued', 'queued>rendering', 'queued>canceled', 'queued>failed',
        'rendering>succeeded', 'rendering>failed', 'rendering>canceled', 'failed>queued']
      when 'sns_posts' then array[
        '>link_pending', '>scheduled', 'link_pending>scheduled', 'link_pending>canceled',
        'scheduled>link_pending', 'scheduled>uploading', 'scheduled>canceled',
        'uploading>uploaded', 'uploading>failed', 'failed>scheduled']
      else array[]::text[]
    end
  );
$$;

-- 범용 상태 전이 트리거(DB_CONVENTIONS.md 10장 (a)). 위반은 GC001.
create or replace function public.gc_status_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not public.gc_transition_allowed(tg_table_name, '', new.status) then
      raise exception '%: invalid initial status %', tg_table_name, new.status using errcode = 'GC001';
    end if;
  elsif new.status is distinct from old.status then
    if not public.gc_transition_allowed(tg_table_name, old.status, new.status) then
      raise exception '%: invalid transition % -> %', tg_table_name, old.status, new.status using errcode = 'GC001';
    end if;
  end if;
  return new;
end;
$$;

-- 사용자 세션이 만든 행의 created_by 를 auth.uid() 로 고정한다.
create or replace function public.gc_stamp_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_privileged_session() then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;


-- =====================================================================
-- R1-1. 설정: market_accounts, slot_addons, shipping_templates, audio_tracks, notification_prefs
-- =====================================================================

-- 마켓 다계정. 키는 public.encrypted_credentials 에만(provider coupang_wing / naver_commerce). 서버 전용 쓰기.
create table if not exists public.market_accounts (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations(id) on delete cascade,
  market           text not null
                   constraint market_accounts_market_check check (market in ('coupang', 'smartstore', 'gmarket', 'auction', 'street11', 'lotteon')),
  label            text not null constraint market_accounts_label_check check (char_length(btrim(label)) between 1 and 40),
  credential_id    uuid references public.encrypted_credentials(id) on delete set null,
  vendor_id        text,                                    -- 쿠팡 vendorId 등. 비밀 아님
  key_hint         text constraint market_accounts_key_hint_check check (key_hint is null or key_hint ~ '^[A-Za-z0-9]{4}$'),  -- 화면 마스킹용 끝 4자
  status           text not null default 'active'
                   constraint market_accounts_status_check check (status in ('active', 'expired', 'error', 'disabled')),
  last_verified_at timestamptz,
  expires_at       timestamptz,
  last_error       text,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, market, label)
);
create index if not exists market_accounts_org_idx on public.market_accounts (org_id, market, created_at);

-- 추가 슬롯(GC-D-05). 결제 확인 뒤 서버가 active 로 바꾼다. 가격은 O-03.
create table if not exists public.slot_addons (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations(id) on delete cascade,
  quantity         smallint not null constraint slot_addons_quantity_check check (quantity between 1 and 50),
  unit_price_krw   integer constraint slot_addons_price_check check (unit_price_krw is null or unit_price_krw >= 0),
  -- 코어 payment_orders.kind 에 추가 슬롯 종류가 없다. 확정 전까지 'billing_key_charge' + metadata {"addon":"market_slot","quantity":n}
  -- 로 결제하고 여기서 연결한다(코어 변경 요청 후보, 05_DATA_MODEL.md 8절).
  payment_order_id uuid references public.payment_orders(id) on delete set null,
  status           text not null default 'pending'
                   constraint slot_addons_status_check check (status in ('pending', 'active', 'canceled', 'expired')),
  period_start     timestamptz,
  period_end       timestamptz,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint slot_addons_period_check check (period_end is null or period_start is null or period_end > period_start)
);
create index if not exists slot_addons_org_active_idx on public.slot_addons (org_id) where status = 'active';

-- 마켓 슬롯 한도 = features.market_slots + 유효한 추가 슬롯 합계. -1 은 무제한.
create or replace function public.gc_market_slot_limit(p_org_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.gc_limit(p_org_id, 'market_slots', 1) < 0 then -1
              else public.gc_limit(p_org_id, 'market_slots', 1) + coalesce((
                select sum(a.quantity)::integer from public.slot_addons a
                where a.org_id = p_org_id and a.status = 'active'
                  and (a.period_end is null or a.period_end > now())), 0)
         end;
$$;

-- 슬롯 한도(GC003) + 자격증명이 같은 조직·앱 소유인지(42501). disabled 가 아닌 계정이 슬롯을 차지한다.
create or replace function public.market_accounts_enforce()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
  v_cred_org uuid;
  v_cred_app text;
begin
  if new.credential_id is not null then
    select c.org_id, c.app_id into v_cred_org, v_cred_app from public.encrypted_credentials c where c.id = new.credential_id;
    if v_cred_org is distinct from new.org_id or coalesce(v_cred_app, '') <> 'globalcommerce' then
      raise exception 'market_accounts: credential belongs to another org or app' using errcode = '42501';
    end if;
  end if;
  if new.status = 'disabled' or (tg_op = 'UPDATE' and old.status <> 'disabled') then
    return new;
  end if;
  v_limit := public.gc_market_slot_limit(new.org_id);
  if v_limit < 0 then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('globalcommerce:market_slots:' || new.org_id::text));
  select count(*) into v_count from public.market_accounts a
  where a.org_id = new.org_id and a.status <> 'disabled' and a.id <> new.id;
  if v_count >= v_limit then
    raise exception 'market slot quota exceeded (%/%)', v_count, v_limit using errcode = 'GC003';
  end if;
  return new;
end;
$$;

-- 배송·반품 템플릿. 사용자(owner/admin) 쓰기. 4번 블록에 조건부 결합(GC-D-10).
--   청약철회 7일 미만, 법정 코드 밖 제한 사유, "반품 불가" 류 문구를 DB 가 거부한다(GC006, 리뷰 V2 #6).
create table if not exists public.shipping_templates (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null references public.organizations(id) on delete cascade,
  name                     text not null constraint shipping_templates_name_check check (char_length(btrim(name)) between 1 and 60),
  template_type            text not null default 'custom'
                           constraint shipping_templates_type_check check (template_type in ('overseas_purchase', 'domestic_dropship', 'custom')),
  auto_attach_overseas     boolean not null default false,   -- "해외 상품에 자동으로 붙이기"
  notice_text              text not null default '' constraint shipping_templates_notice_check check (char_length(notice_text) <= 1000),
  dispatch_days            smallint not null default 3 constraint shipping_templates_dispatch_check check (dispatch_days between 1 and 30),
  delivery_days_min        smallint constraint shipping_templates_delivery_min_check check (delivery_days_min is null or delivery_days_min between 1 and 60),
  delivery_days_max        smallint constraint shipping_templates_delivery_max_check check (delivery_days_max is null or delivery_days_max between 1 and 60),
  return_window_days       smallint not null default 7 constraint shipping_templates_return_window_check check (return_window_days >= 7 and return_window_days <= 90),
  exchange_allowed         boolean not null default true,
  return_fee_krw           integer constraint shipping_templates_return_fee_check check (return_fee_krw is null or return_fee_krw >= 0),
  initial_shipping_fee_krw integer constraint shipping_templates_initial_fee_check check (initial_shipping_fee_krw is null or initial_shipping_fee_krw >= 0),
  restriction_codes        text[] not null default '{}'
                           constraint shipping_templates_restrictions_check check (restriction_codes <@ array['buyer_damage', 'used_or_consumed', 'time_lapse_resale', 'copyable_opened']),
  requires_customs_code    boolean not null default false,   -- 개인통관고유부호 필요
  return_address           jsonb not null default '{}'::jsonb constraint shipping_templates_address_check check (jsonb_typeof(return_address) = 'object'),
  contact_phone            text,
  is_default               boolean not null default false,
  created_by               uuid,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (org_id, id),
  constraint shipping_templates_delivery_range_check check (delivery_days_min is null or delivery_days_max is null or delivery_days_min <= delivery_days_max)
);
create unique index if not exists shipping_templates_one_default_idx on public.shipping_templates (org_id) where is_default;

-- BEFORE 트리거는 CHECK 보다 먼저 돈다. 그래서 규칙 위반이 23514 가 아니라 GC006 으로 나간다(CHECK 는 2차 잠금).
create or replace function public.shipping_templates_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_text text := regexp_replace(coalesce(new.notice_text, ''), '\s+', '', 'g');
begin
  if new.return_window_days is null or new.return_window_days < 7 then
    raise exception 'shipping_templates: return window must be at least 7 days' using errcode = 'GC006';
  end if;
  if not (coalesce(new.restriction_codes, '{}') <@ array['buyer_damage', 'used_or_consumed', 'time_lapse_resale', 'copyable_opened']) then
    raise exception 'shipping_templates: restriction codes must be statutory codes' using errcode = 'GC006';
  end if;
  -- 공백을 지운 뒤 비교한다(한글 경계 문제 회피, \b 금지). 문구 목록은 법률 검토 뒤 확정(제안).
  if v_text ~ '(반품|교환|환불|청약철회)(은|는|이)?(절대)?(불가|안됩니다|안돼요|불가능)'
     or v_text ~ '단순변심(으로인한)?(반품|교환|환불)?(은|는)?(불가|안됩니다|불가능)' then
    raise exception 'shipping_templates: notice must not deny statutory withdrawal' using errcode = 'GC006';
  end if;
  return new;
end;
$$;

-- 음원 라이브러리. org_id null = 기본 제공 풀(읽기 전용, seed). 조직 행은 사용자가 올린다.
--   duration_ms, file_status 는 워커가 ffprobe 로 채운다. 파일이 사라지면 'missing'(화면 "파일 없음").
create table if not exists public.audio_tracks (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references public.organizations(id) on delete cascade,
  title        text not null constraint audio_tracks_title_check check (char_length(btrim(title)) between 1 and 80),
  source       text not null default 'upload'
               constraint audio_tracks_source_check check (source in ('upload', 'suno', 'default')),
  mood_tags    text[] not null default '{}' constraint audio_tracks_tags_check check (cardinality(mood_tags) <= 8),
  duration_ms  integer constraint audio_tracks_duration_check check (duration_ms is null or duration_ms between 1000 and 600000),
  storage_path text not null,
  mime_type    text constraint audio_tracks_mime_check check (mime_type is null or mime_type in ('audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg')),
  bytes        integer constraint audio_tracks_bytes_check check (bytes is null or bytes between 1 and 52428800),
  file_status  text not null default 'uploading'
               constraint audio_tracks_file_status_check check (file_status in ('uploading', 'processing', 'available', 'missing', 'rejected')),
  license_note text,
  is_active    boolean not null default true,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, id),
  constraint audio_tracks_default_source_check check ((org_id is null) = (source = 'default'))
);
create index if not exists audio_tracks_org_idx on public.audio_tracks (org_id, created_at desc);
create index if not exists audio_tracks_default_idx on public.audio_tracks (created_at) where org_id is null and is_active;

-- 알림 설정. 사용자별 행(본인만 쓰기).
create table if not exists public.notification_prefs (
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null default auth.uid(),
  channel    text not null constraint notification_prefs_channel_check check (channel in ('in_app', 'email')),
  event      text not null
             constraint notification_prefs_event_check check (event in ('run_failed', 'run_succeeded', 'upload_failed', 'upload_done',
                                                                       'market_key_expiring', 'credits_low', 'export_ready', 'sns_link_ready')),
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (org_id, user_id, channel, event)
);

-- 저장한 보기(GC-F-106): 사용자별 목록 필터 프리셋. 브라우저 저장소에 두지 않는다.
create table if not exists public.saved_views (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null default auth.uid(),
  screen     text not null constraint saved_views_screen_check check (screen in ('sourcing', 'products', 'upload', 'runs')),
  name       text not null constraint saved_views_name_check check (char_length(btrim(name)) between 1 and 40),
  filters    jsonb not null default '{}'::jsonb constraint saved_views_filters_check check (jsonb_typeof(filters) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id, screen, name)
);


-- =====================================================================
-- R1-2. 대시보드 전역 캐시(조직 없음): fx_rates, trend_keywords, season_picks. 서버 전용 쓰기, 로그인 사용자 읽기.
-- =====================================================================

-- 한국수출입은행 현재환율(GC-D-16). 평일 11:30 KST 1회. LLM 추정 환율 금지.
create table if not exists public.fx_rates (
  id         bigint generated always as identity primary key,
  currency   text not null constraint fx_rates_currency_check check (currency in ('USD', 'CAD', 'EUR', 'JPY', 'GBP', 'CNY')),
  unit       integer not null default 1 constraint fx_rates_unit_check check (unit in (1, 100)),
  rate_krw   numeric(14, 4) not null constraint fx_rates_rate_check check (rate_krw > 0),   -- 매매기준율(deal_bas_r)
  source     text not null default 'koreaexim' constraint fx_rates_source_check check (source in ('koreaexim')),
  rate_date  date not null,
  fetched_at timestamptz not null default now(),
  unique (currency, rate_date)
);
create index if not exists fx_rates_currency_date_idx on public.fx_rates (currency, rate_date desc);

-- 네이버 데이터랩 검색어 트렌드(상대 지수, GC-D-17). points = [{"period":"2026-10-19","ratio":100}, ...]
create table if not exists public.trend_keywords (
  id           bigint generated always as identity primary key,
  keyword      text not null constraint trend_keywords_keyword_check check (char_length(btrim(keyword)) between 1 and 40),
  category     text,
  time_unit    text not null default 'week' constraint trend_keywords_unit_check check (time_unit in ('date', 'week', 'month')),
  period_start date not null,
  period_end   date not null,
  points       jsonb not null default '[]'::jsonb constraint trend_keywords_points_check check (jsonb_typeof(points) = 'array'),
  source       text not null default 'naver_datalab',
  fetched_at   timestamptz not null default now(),
  unique (keyword, time_unit, period_end),
  constraint trend_keywords_period_check check (period_end >= period_start)
);

-- 시즌 추천 = 4주 전 대비 증가율 상위 키워드
create table if not exists public.season_picks (
  id            bigint generated always as identity primary key,
  pick_date     date not null,
  rank          smallint not null constraint season_picks_rank_check check (rank between 1 and 50),
  keyword       text not null,
  category      text,
  growth_pct    numeric(8, 2) not null,
  base_ratio    numeric(8, 2),
  current_ratio numeric(8, 2),
  created_at    timestamptz not null default now(),
  unique (pick_date, keyword),
  unique (pick_date, rank)
);


-- =====================================================================
-- R1-3. 소싱·상품: source_imports, import_rows, products, product_images, banned_words, title_revisions, product_activities
-- =====================================================================

-- 수집 실행 1회(아마존 URL 묶음 또는 위탁 엑셀 1개). 서버 전용 쓰기.
create table if not exists public.source_imports (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations(id) on delete cascade,
  source           text not null constraint source_imports_source_check check (source in ('amazon', 'ownerclan', 'domeggook', 'custom')),
  input_kind       text not null constraint source_imports_kind_check check (input_kind in ('url_list', 'excel')),
  marketplace      text constraint source_imports_marketplace_check check (marketplace is null or marketplace in ('US', 'CA', 'JP', 'DE', 'UK')),
  file_path        text,                                  -- org-files/<org_id>/globalcommerce/imports/<uuid>.xlsx
  mode             text not null default 'commit' constraint source_imports_mode_check check (mode in ('preview', 'commit')),  -- 엑셀: 미리보기 → 열 매핑 확정
  column_mapping   jsonb not null default '{}'::jsonb constraint source_imports_mapping_check check (jsonb_typeof(column_mapping) = 'object'),
  target_margin_pct numeric(5, 2) constraint source_imports_margin_check check (target_margin_pct is null or target_margin_pct between 0 and 95),
  fx_rate_id       bigint references public.fx_rates(id) on delete set null,
  status           text not null default 'queued'
                   constraint source_imports_status_check check (status in ('queued', 'running', 'preview_ready', 'completed', 'failed', 'canceled')),
  total_rows       integer not null default 0 constraint source_imports_total_check check (total_rows between 0 and 5000),
  collected_rows   integer not null default 0 constraint source_imports_collected_check check (collected_rows >= 0),
  excluded_rows    integer not null default 0 constraint source_imports_excluded_check check (excluded_rows >= 0),
  error_rows       integer not null default 0 constraint source_imports_error_check check (error_rows >= 0),
  error_message    text,
  job_id           uuid references public.jobs(id) on delete set null,
  workflow_run_id  uuid,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  finished_at      timestamptz,
  unique (org_id, id),
  constraint source_imports_input_check check ((input_kind = 'url_list') = (source = 'amazon'))
);
create index if not exists source_imports_org_created_idx on public.source_imports (org_id, created_at desc);

-- 수집 행. 원문 HTML 은 저장하지 않는다(raw 는 엑셀 셀 값 또는 API 응답에서 고른 필드만).
create table if not exists public.import_rows (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  import_id      uuid not null,
  row_no         integer not null constraint import_rows_row_check check (row_no >= 1),
  source_ref     text,                                     -- ASIN 또는 위탁 상품 코드
  source_url     text,
  raw            jsonb not null default '{}'::jsonb constraint import_rows_raw_check check (jsonb_typeof(raw) = 'object'),
  status         text not null default 'pending'
                 constraint import_rows_status_check check (status in ('pending', 'collecting', 'collected', 'updated', 'excluded', 'error')),
  exclude_reason text,                                     -- 예: 해외 배송 금지 품목(가스 용품)
  cell_errors    jsonb not null default '[]'::jsonb constraint import_rows_cell_errors_check check (jsonb_typeof(cell_errors) = 'array'),
  product_id     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (import_id, row_no),
  constraint import_rows_import_fk foreign key (org_id, import_id)
    references public.source_imports (org_id, id) on delete cascade
);
create index if not exists import_rows_import_idx on public.import_rows (import_id, row_no);

-- 상품. 사용자는 판매가·메모·태그·검토 상태만 쓴다. 상품명 저장은 서버(금지어 매처) 경유.
create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.organizations(id) on delete cascade,
  source               text not null constraint products_source_check check (source in ('amazon', 'ownerclan', 'domeggook', 'custom', 'manual')),
  source_ref           text,                               -- ASIN(아마존) 또는 위탁 상품 코드
  source_url           text,
  marketplace          text constraint products_marketplace_check check (marketplace is null or marketplace in ('US', 'CA', 'JP', 'DE', 'UK')),
  import_id            uuid,
  is_overseas          boolean generated always as (source = 'amazon') stored,
  product_kind         text not null default 'general'
                       constraint products_kind_check check (product_kind in ('general', 'cosmetics', 'health_food')),
  title_original       text not null constraint products_title_original_check check (char_length(title_original) between 1 and 500),
  title_ai             text constraint products_title_ai_check check (title_ai is null or char_length(title_ai) between 1 and 100),
  title_char_count     integer generated always as (char_length(coalesce(title_ai, ''))) stored,
  title_verdict        text constraint products_title_verdict_check check (title_verdict is null or title_verdict in ('pass', 'warn', 'fail')),
  title_issues         jsonb not null default '[]'::jsonb constraint products_title_issues_check check (jsonb_typeof(title_issues) = 'array'),
  banned_replaced_count integer not null default 0 constraint products_banned_count_check check (banned_replaced_count >= 0),
  title_checked_at     timestamptz,
  title_warn_ack_at    timestamptz,
  title_warn_ack_by    uuid,
  title_error          text,
  brand                text,
  category_path        text,
  source_price         numeric(12, 2) constraint products_source_price_check check (source_price is null or source_price >= 0),
  source_currency      text constraint products_source_currency_check check (source_currency is null or source_currency in ('USD', 'CAD', 'JPY', 'EUR', 'GBP', 'KRW')),
  fx_rate_krw          numeric(14, 4) constraint products_fx_check check (fx_rate_krw is null or fx_rate_krw > 0),
  fx_rate_date         date,
  cost_krw             integer constraint products_cost_check check (cost_krw is null or cost_krw >= 0),        -- 환산가
  extra_cost_krw       integer not null default 0 constraint products_extra_cost_check check (extra_cost_krw >= 0),  -- 배송비·수수료 추정(서버)
  sell_price_krw       integer constraint products_sell_price_check check (sell_price_krw is null or (sell_price_krw >= 0 and sell_price_krw % 10 = 0)),
  expected_margin_pct  numeric(7, 2) generated always as (
                         case when sell_price_krw > 0 and cost_krw is not null
                              then round((sell_price_krw - cost_krw - extra_cost_krw)::numeric * 100 / sell_price_krw, 2) end) stored,
  suggested_margin_pct numeric(7, 2),                      -- 판매가 전 수집 화면 "예상 마진"(목표 마진 기준, 서버)
  images_source        jsonb not null default '[]'::jsonb constraint products_images_check check (jsonb_typeof(images_source) = 'array'),
  attributes           jsonb not null default '{}'::jsonb constraint products_attributes_check check (jsonb_typeof(attributes) = 'object'),
  tags                 text[] not null default '{}',
  memo                 text constraint products_memo_check check (memo is null or char_length(memo) <= 2000),
  images_confirmed_at  timestamptz,
  status               text not null default 'collected'
                       constraint products_status_check check (status in ('collected', 'generating', 'review', 'approved', 'archived')),
  job_id               uuid references public.jobs(id) on delete set null,
  created_by           uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  unique (org_id, id),
  constraint products_asin_check check (source <> 'amazon' or source_ref ~ '^[A-Z0-9]{10}$'),
  constraint products_import_fk foreign key (org_id, import_id)
    references public.source_imports (org_id, id) on delete set null (import_id)
);
create index if not exists products_org_created_idx on public.products (org_id, created_at desc) where deleted_at is null;
create index if not exists products_org_status_idx on public.products (org_id, status, updated_at desc) where deleted_at is null;
create unique index if not exists products_source_uniq on public.products (org_id, source, source_ref)
  where source_ref is not null and deleted_at is null;

alter table public.import_rows drop constraint if exists import_rows_product_fk;
alter table public.import_rows add constraint import_rows_product_fk foreign key (org_id, product_id)
  references public.products (org_id, id) on delete set null (product_id);

-- 상품 수 한도(features.products, GC002). 삭제 복원도 검사. 조직 단위 advisory lock 으로 직렬화.
create or replace function public.products_enforce_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if tg_op = 'UPDATE' and not (old.deleted_at is not null and new.deleted_at is null) then
    return new;
  end if;
  if new.deleted_at is not null then
    return new;
  end if;
  if not public.has_entitlement(new.org_id, 'globalcommerce') then
    raise exception 'products: organization has no globalcommerce entitlement' using errcode = '42501';
  end if;
  v_limit := public.gc_limit(new.org_id, 'products', 0);
  if v_limit < 0 then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('globalcommerce:products:' || new.org_id::text));
  select count(*) into v_count from public.products p
  where p.org_id = new.org_id and p.deleted_at is null and p.id <> new.id;
  if v_count >= v_limit then
    raise exception 'products quota exceeded (%/%)', v_count, v_limit using errcode = 'GC002';
  end if;
  return new;
end;
$$;

-- 사용자 세션의 상태 변경은 검토 흐름(review <-> approved, 보관, 복원)만. 생성 중 전환은 서버(잡)만.
-- 상품명이 바뀌었는데 판정 시각이 그대로면(판정을 다시 하지 않은 쓰기) 판정을 지운다 → 게이트가 GC004 로 막는다.
create or replace function public.products_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.title_ai is distinct from old.title_ai and new.title_checked_at is not distinct from old.title_checked_at then
    new.title_verdict := null;
    new.title_issues := '[]'::jsonb;
    new.title_warn_ack_at := null;
    new.title_warn_ack_by := null;
  end if;
  if new.title_verdict is distinct from old.title_verdict then
    new.title_warn_ack_at := null;
    new.title_warn_ack_by := null;
  end if;
  if not public.is_privileged_session() and new.status is distinct from old.status
     and not ((old.status || '>' || new.status) = any (array['review>approved', 'approved>review',
                                                            'collected>archived', 'review>archived', 'approved>archived', 'archived>review'])) then
    raise exception 'products: % -> % is server only', old.status, new.status using errcode = 'GC001';
  end if;
  if not public.is_privileged_session() and new.status = 'approved' and old.status <> 'approved'
     and coalesce(new.title_verdict, 'fail') = 'fail' then
    raise exception 'products: title has banned words or is not checked' using errcode = 'GC004';
  end if;
  return new;
end;
$$;

-- 상품 이미지: 원본(아마존 수집), 누끼, 1080x1080 합성, 추가 이미지. 서버 전용 쓰기.
create table if not exists public.product_images (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations(id) on delete cascade,
  product_id        uuid not null,
  kind              text not null constraint product_images_kind_check check (kind in ('original', 'cutout', 'composite', 'extra')),
  position          smallint not null default 1 constraint product_images_position_check check (position between 1 and 30),
  parent_image_id   uuid,
  source_url        text,                                  -- 원본 이미지 외부 URL(허용 도메인만, GC010)
  storage_path      text,
  width             integer constraint product_images_width_check check (width is null or width > 0),
  height            integer constraint product_images_height_check check (height is null or height > 0),
  bytes             integer constraint product_images_bytes_check check (bytes is null or bytes > 0),
  status            text not null default 'pending'
                    constraint product_images_status_check check (status in ('pending', 'processing', 'ready', 'failed')),
  is_primary        boolean not null default false,
  bg_prompt         text constraint product_images_prompt_check check (bg_prompt is null or char_length(bg_prompt) <= 500),
  product_ratio_pct smallint constraint product_images_ratio_check check (product_ratio_pct is null or product_ratio_pct between 30 and 95),
  overlay_text      text constraint product_images_overlay_check check (overlay_text is null or char_length(overlay_text) <= 20),  -- Sharp 후합성 한글
  provider          text,
  model             text,
  attempt           smallint not null default 1 constraint product_images_attempt_check check (attempt >= 1),
  error_message     text,
  job_id            uuid references public.jobs(id) on delete set null,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (org_id, id),
  constraint product_images_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete cascade,
  constraint product_images_parent_fk foreign key (org_id, parent_image_id)
    references public.product_images (org_id, id) on delete set null (parent_image_id),
  constraint product_images_composite_size_check check (kind <> 'composite' or status <> 'ready' or (width = 1080 and height = 1080))
);
create index if not exists product_images_product_idx on public.product_images (product_id, kind, position);
create unique index if not exists product_images_primary_uniq on public.product_images (product_id) where is_primary;

-- 금지어 사전(GC-D-11). org_id null = 기본 사전(seed, 읽기 전용). 조직 행 = owner/admin 추가분.
--   action: replace(replacement 로 치환), delete(단어 삭제), block(치환 불가, FAIL 유지)
--   매칭은 앱 계층(packages/compliance)이 한글 경계를 고려해 수행한다(정규식 \b 금지).
create table if not exists public.banned_words (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organizations(id) on delete cascade,
  word        text not null constraint banned_words_word_check check (char_length(btrim(word)) between 1 and 50),
  category    text not null default 'general'
              constraint banned_words_category_check check (category in ('cosmetics', 'health_food', 'medical', 'general')),
  severity    text not null default 'fail' constraint banned_words_severity_check check (severity in ('fail', 'warn')),
  action      text not null default 'replace' constraint banned_words_action_check check (action in ('replace', 'delete', 'block')),
  replacement text constraint banned_words_replacement_check check (replacement is null or char_length(replacement) <= 50),
  note        text,
  is_active   boolean not null default true,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint banned_words_replace_check check (action <> 'replace' or replacement is not null)
);
create unique index if not exists banned_words_global_uniq on public.banned_words (category, word) where org_id is null;
create unique index if not exists banned_words_org_uniq on public.banned_words (org_id, category, word) where org_id is not null;

-- 상품명 이력(되돌리기용). 서버만 쓰고 고치지 않는다.
create table if not exists public.title_revisions (
  id             bigint generated always as identity primary key,
  org_id         uuid not null references public.organizations(id) on delete cascade,
  product_id     uuid not null,
  revision_no    integer not null constraint title_revisions_no_check check (revision_no >= 1),
  title          text not null constraint title_revisions_title_check check (char_length(title) between 1 and 100),
  origin         text not null constraint title_revisions_origin_check check (origin in ('ai', 'user', 'banned_replace', 'revert')),
  model          text,
  verdict        text constraint title_revisions_verdict_check check (verdict is null or verdict in ('pass', 'warn', 'fail')),
  replacements   jsonb not null default '[]'::jsonb,       -- [{"word":"여드름 치료","to":"피부 고민 케어"}]
  credit_ledger_id bigint references public.credit_ledger(id),
  created_by     uuid,
  created_at     timestamptz not null default now(),
  unique (product_id, revision_no),
  constraint title_revisions_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete cascade
);

-- 상품 활동 타임라인과 메모(GC-F-206). 사용자는 kind = 'memo' 행만 넣는다. 수정·삭제 없음.
create table if not exists public.product_activities (
  id         bigint generated always as identity primary key,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null,
  kind       text not null
             constraint product_activities_kind_check check (kind in ('imported', 'title_generated', 'title_saved', 'cutout_done',
                                                                      'composite_done', 'composite_failed', 'bg_prompt_changed',
                                                                      'images_confirmed', 'detail_saved', 'detail_confirmed',
                                                                      'upload_registered', 'upload_failed', 'memo')),
  message    text not null constraint product_activities_message_check check (char_length(message) between 1 and 1000),
  detail     jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint product_activities_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete cascade
);
create index if not exists product_activities_product_idx on public.product_activities (product_id, created_at desc);


-- =====================================================================
-- R1-4. 상세페이지: detail_pages(4단 블록, GC-D-10), market_images
-- =====================================================================
-- blocks = [{"type":"hook",...}, {"type":"features","items":[3개]}, {"type":"specs",...}, {"type":"shipping",...}]
-- 블록 순서는 끌어서 바꿀 수 있으므로 위치가 아니라 type 으로 검사한다. 서버 전용 쓰기(편집도 Route Handler 경유:
-- 저장할 때마다 금지어 매처를 돌려 verdict 를 다시 쓴다).
create table if not exists public.detail_pages (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.organizations(id) on delete cascade,
  product_id           uuid not null,
  version              integer not null default 1 constraint detail_pages_version_check check (version >= 1),
  blocks               jsonb not null default '[]'::jsonb
                       constraint detail_pages_blocks_check check (
                         jsonb_typeof(blocks) = 'array' and jsonb_array_length(blocks) <= 4),
  shipping_template_id uuid,
  shipping_attached    boolean not null default false,
  edit_revision        integer not null default 0 constraint detail_pages_revision_check check (edit_revision >= 0),  -- 자동 저장 낙관적 잠금(expected_version)
  html_content         text,                                -- sanitize 후 저장
  status               text not null default 'assembling'
                       constraint detail_pages_status_check check (status in ('assembling', 'draft', 'confirmed', 'rendering', 'ready', 'failed', 'archived')),
  verdict              text constraint detail_pages_verdict_check check (verdict is null or verdict in ('pass', 'warn', 'fail')),
  issues               jsonb not null default '[]'::jsonb constraint detail_pages_issues_check check (jsonb_typeof(issues) = 'array'),
  verdict_checked_at   timestamptz,
  warn_acknowledged_at timestamptz,
  warn_acknowledged_by uuid,
  credits_charged      integer not null default 0 constraint detail_pages_credits_check check (credits_charged >= 0),
  credit_ledger_id     bigint references public.credit_ledger(id),
  job_id               uuid references public.jobs(id) on delete set null,
  request_id           uuid unique,
  error_stage          text constraint detail_pages_error_stage_check check (error_stage is null or error_stage in ('assemble', 'render')),
  error_message        text,
  autosaved_at         timestamptz,
  confirmed_at         timestamptz,
  confirmed_by         uuid,
  created_by           uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (org_id, id),
  unique (product_id, version),
  constraint detail_pages_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete cascade,
  constraint detail_pages_template_fk foreign key (org_id, shipping_template_id)
    references public.shipping_templates (org_id, id) on delete set null (shipping_template_id),
  -- 확정 이후 상태에는 4단 블록이 모두 있어야 한다
  constraint detail_pages_blocks_complete_check check (
    status not in ('confirmed', 'rendering', 'ready') or (
      jsonb_array_length(blocks) = 4
      and blocks @> '[{"type":"hook"}]' and blocks @> '[{"type":"features"}]'
      and blocks @> '[{"type":"specs"}]' and blocks @> '[{"type":"shipping"}]'))
);
create index if not exists detail_pages_org_updated_idx on public.detail_pages (org_id, updated_at desc);
create index if not exists detail_pages_product_idx on public.detail_pages (product_id, version desc);

-- 블록이 바뀌었는데 판정을 다시 하지 않았으면 판정을 지운다. 확정(confirmed)은 판정 게이트를 통과해야 한다.
create or replace function public.detail_pages_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.blocks is distinct from old.blocks and new.verdict_checked_at is not distinct from old.verdict_checked_at then
      new.verdict := null;
      new.issues := '[]'::jsonb;
    end if;
    if new.blocks is distinct from old.blocks then
      new.edit_revision := old.edit_revision + 1;
    end if;
    if new.verdict is distinct from old.verdict or new.blocks is distinct from old.blocks then
      new.warn_acknowledged_at := null;
      new.warn_acknowledged_by := null;
    end if;
    if new.blocks is distinct from old.blocks and old.status not in ('draft', 'assembling') then
      raise exception 'detail_pages: blocks can be edited only in draft (status %)', old.status using errcode = 'GC001';
    end if;
  end if;
  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status is distinct from 'confirmed') then
    if coalesce(new.verdict, 'fail') = 'fail' then
      raise exception 'detail_pages: banned words verdict fail or not checked' using errcode = 'GC004';
    end if;
    if new.verdict = 'warn' and new.warn_acknowledged_at is null then
      raise exception 'detail_pages: warning not acknowledged' using errcode = 'GC005';
    end if;
  end if;
  return new;
end;
$$;

-- 마켓 규격 변환본. 서버 전용 쓰기.
create table if not exists public.market_images (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  detail_page_id uuid not null,
  market         text not null constraint market_images_market_check check (market in ('coupang', 'smartstore', 'gmarket', 'auction', 'street11', 'lotteon')),
  kind           text not null constraint market_images_kind_check check (kind in ('thumbnail', 'detail')),
  part_no        smallint not null default 1 constraint market_images_part_check check (part_no >= 1),
  storage_path   text not null,
  width          integer constraint market_images_width_check check (width is null or width > 0),
  height         integer constraint market_images_height_check check (height is null or height > 0),
  bytes          integer constraint market_images_bytes_check check (bytes is null or bytes > 0),
  format         text constraint market_images_format_check check (format is null or format in ('jpeg', 'png', 'webp')),
  validation     jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  unique (detail_page_id, market, kind, part_no),
  constraint market_images_page_fk foreign key (org_id, detail_page_id)
    references public.detail_pages (org_id, id) on delete cascade
);


-- =====================================================================
-- R1-5. 업로드: upload_batches, market_listings(상품 x 계정), export_files
-- =====================================================================

-- 전송 1회. 진행 카운터는 market_listings 트리거가 다시 센다(화면 "7 / 12, 성공 6 전송 중 1 실패 1 대기 4").
create table if not exists public.upload_batches (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  product_ids     uuid[] not null constraint upload_batches_products_check check (cardinality(product_ids) between 1 and 500),
  account_ids     uuid[] not null constraint upload_batches_accounts_check check (cardinality(account_ids) between 1 and 30),
  status          text not null default 'queued'
                  constraint upload_batches_status_check check (status in ('queued', 'running', 'completed', 'completed_with_errors', 'canceled')),
  total_count     integer not null default 0 constraint upload_batches_total_check check (total_count >= 0),
  registered_count integer not null default 0,
  sending_count   integer not null default 0,
  failed_count    integer not null default 0,
  waiting_count   integer not null default 0,
  skipped_count   integer not null default 0,              -- 이미 등록돼 다시 보내지 않은 건
  done_count      integer generated always as (registered_count + failed_count) stored,
  idempotency_key text unique,
  workflow_run_id uuid,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  started_at      timestamptz,
  finished_at     timestamptz,
  unique (org_id, id)
);
create index if not exists upload_batches_org_created_idx on public.upload_batches (org_id, created_at desc);

-- 상품 x 마켓 계정 1행(멱등). 재전송은 같은 행의 상태를 waiting 으로 되돌린다.
create table if not exists public.market_listings (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations(id) on delete cascade,
  product_id         uuid not null,
  market_account_id  uuid not null,
  market             text not null constraint market_listings_market_check check (market in ('coupang', 'smartstore', 'gmarket', 'auction', 'street11', 'lotteon')),
  detail_page_id     uuid,
  batch_id           uuid,
  status             text not null default 'waiting'
                     constraint market_listings_status_check check (status in ('waiting', 'sending', 'submitted', 'registered', 'failed', 'rejected', 'canceled')),
  market_product_id  text,
  market_url         text,                                 -- 등록 완료 상품 URL → SNS 링크(GC-F-304)
  error_code         text,
  error_message      text constraint market_listings_error_check check (error_message is null or char_length(error_message) <= 300),  -- 한 줄
  missing_attributes text[] not null default '{}',         -- 예: {'정격 전압'}
  attribute_overrides jsonb not null default '{}'::jsonb constraint market_listings_overrides_check check (jsonb_typeof(attribute_overrides) = 'object'),  -- "속성 입력" 
  request_snapshot   jsonb not null default '{}'::jsonb,   -- 비밀 제외
  response_summary   jsonb not null default '{}'::jsonb,
  attempts           integer not null default 0 constraint market_listings_attempts_check check (attempts >= 0),
  job_id             uuid references public.jobs(id) on delete set null,
  created_by         uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  submitted_at       timestamptz,
  registered_at      timestamptz,
  unique (org_id, id),
  unique (product_id, market_account_id),
  constraint market_listings_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete cascade,
  constraint market_listings_account_fk foreign key (org_id, market_account_id)
    references public.market_accounts (org_id, id) on delete cascade,
  constraint market_listings_page_fk foreign key (org_id, detail_page_id)
    references public.detail_pages (org_id, id) on delete set null (detail_page_id),
  constraint market_listings_batch_fk foreign key (org_id, batch_id)
    references public.upload_batches (org_id, id) on delete set null (batch_id),
  constraint market_listings_registered_check check (status <> 'registered' or market_product_id is not null)
);
create index if not exists market_listings_org_updated_idx on public.market_listings (org_id, updated_at desc);
create index if not exists market_listings_batch_idx on public.market_listings (batch_id, status);
create index if not exists market_listings_submitted_idx on public.market_listings (updated_at) where status = 'submitted';
create unique index if not exists market_listings_external_uniq on public.market_listings (market_account_id, market_product_id)
  where market_product_id is not null;

-- 공용 판정 게이트: 상품명과 최신 상세페이지. 업로드와 내보내기가 함께 쓴다(GC004/GC005).
-- p_min_page: null = 상세페이지 없어도 됨(내보내기), 'confirmed' = 확정 이후(배치 생성), 'ready' = 마켓 이미지까지 완료(전송)
create or replace function public.gc_assert_compliance(p_org_id uuid, p_product_id uuid, p_detail_page_id uuid, p_min_page text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_prod public.products;
  v_page public.detail_pages;
begin
  select * into v_prod from public.products p where p.id = p_product_id and p.org_id = p_org_id and p.deleted_at is null;
  if not found then
    raise exception 'compliance: product % not found', p_product_id using errcode = '23503';
  end if;
  if coalesce(v_prod.title_verdict, 'fail') = 'fail' then
    raise exception 'compliance: product title verdict fail or not checked (%)', p_product_id using errcode = 'GC004';
  end if;
  if v_prod.title_verdict = 'warn' and v_prod.title_warn_ack_at is null then
    raise exception 'compliance: product title warning not acknowledged (%)', p_product_id using errcode = 'GC005';
  end if;
  if p_detail_page_id is not null then
    select * into v_page from public.detail_pages d where d.id = p_detail_page_id and d.org_id = p_org_id;
  else
    select * into v_page from public.detail_pages d
    where d.product_id = p_product_id and d.org_id = p_org_id and d.status <> 'archived'
    order by d.version desc limit 1;
  end if;
  if not found then
    if p_min_page is not null then
      raise exception 'compliance: product % has no detail page', p_product_id using errcode = 'GC001';
    end if;
    return;
  end if;
  if (p_min_page = 'ready' and v_page.status <> 'ready')
     or (p_min_page = 'confirmed' and v_page.status not in ('confirmed', 'rendering', 'ready')) then
    raise exception 'compliance: detail page is % (needs %)', v_page.status, p_min_page using errcode = 'GC001';
  end if;
  if coalesce(v_page.verdict, 'fail') = 'fail' then
    raise exception 'compliance: detail page verdict fail or not checked (%)', v_page.id using errcode = 'GC004';
  end if;
  if v_page.verdict = 'warn' and v_page.warn_acknowledged_at is null then
    raise exception 'compliance: detail page warning not acknowledged (%)', v_page.id using errcode = 'GC005';
  end if;
end;
$$;

-- 업로드 게이트: 계정 유효(GC009), 플랜 마켓 API(GC007), 상품명·상세페이지 판정(GC004/GC005), 상세페이지 ready(GC001).
-- INSERT(배치 생성, 상세페이지 confirmed 이상)와 → sending 전환(워커 전송 직전, 상세페이지 ready)에서 검사한다.
create or replace function public.market_listings_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_acc public.market_accounts;
begin
  if tg_op = 'UPDATE' and not (new.status = 'sending' and old.status is distinct from 'sending') then
    return new;
  end if;
  select * into v_acc from public.market_accounts a where a.id = new.market_account_id;
  if not found or v_acc.org_id <> new.org_id or v_acc.market <> new.market then
    raise exception 'market_listings: market account mismatch' using errcode = '42501';
  end if;
  if v_acc.status <> 'active' or v_acc.credential_id is null then
    raise exception 'market_listings: market account key invalid or expired (%)', v_acc.status using errcode = 'GC009';
  end if;
  if not coalesce(public.gc_features(new.org_id) -> 'market_api' ? new.market, false) then
    raise exception 'market_listings: plan does not allow % api upload', new.market using errcode = 'GC007';
  end if;
  perform public.gc_assert_compliance(new.org_id, new.product_id, new.detail_page_id,
                                      case when new.status = 'sending' then 'ready' else 'confirmed' end);
  return new;
end;
$$;

-- 배치 카운터 다시 세기(AFTER 트리거, 서버 쓰기에서만 돈다).
create or replace function public.market_listings_rollup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch uuid := coalesce(new.batch_id, old.batch_id);
begin
  if v_batch is null then
    return null;
  end if;
  update public.upload_batches b set
    registered_count = s.registered, sending_count = s.sending, failed_count = s.failed, waiting_count = s.waiting
  from (
    select count(*) filter (where l.status = 'registered')                 as registered,
           count(*) filter (where l.status in ('sending', 'submitted'))    as sending,
           count(*) filter (where l.status in ('failed', 'rejected'))      as failed,
           count(*) filter (where l.status = 'waiting')                    as waiting
    from public.market_listings l where l.batch_id = v_batch
  ) s
  where b.id = v_batch;
  return null;
end;
$$;

-- 엑셀(플레이오토 호환)/ZIP 내보내기. 서버 전용 쓰기. 서명 URL 7일.
create table if not exists public.export_files (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  kind          text not null constraint export_files_kind_check check (kind in ('excel', 'zip')),
  market        text constraint export_files_market_check check (market is null or market in ('coupang', 'smartstore', 'playauto')),
  product_ids   uuid[] not null constraint export_files_products_check check (cardinality(product_ids) between 1 and 500),
  status        text not null default 'queued'
                constraint export_files_status_check check (status in ('queued', 'running', 'succeeded', 'failed', 'canceled', 'expired')),
  storage_path  text,
  file_bytes    bigint constraint export_files_bytes_check check (file_bytes is null or file_bytes >= 0),
  row_count     integer,
  expires_at    timestamptz,
  job_id        uuid references public.jobs(id) on delete set null,
  error_message text,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists export_files_org_created_idx on public.export_files (org_id, created_at desc);
create index if not exists export_files_expiry_idx on public.export_files (expires_at) where status = 'succeeded';

create or replace function public.export_files_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pid uuid;
begin
  if new.kind = 'excel' and not public.gc_flag(new.org_id, 'excel_export') then
    raise exception 'export_files: plan does not allow excel export' using errcode = 'GC007';
  end if;
  if new.kind = 'zip' and not public.gc_flag(new.org_id, 'zip_export') then
    raise exception 'export_files: plan does not allow zip export' using errcode = 'GC007';
  end if;
  foreach v_pid in array new.product_ids loop
    perform public.gc_assert_compliance(new.org_id, v_pid, null, null);
  end loop;
  return new;
end;
$$;


-- =====================================================================
-- R1-6. 실행: workflow_runs, workflow_run_steps (GC-D-18). R1 은 kind = 'system' 만.
-- =====================================================================
create table if not exists public.workflow_runs (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id) on delete cascade,
  kind                text not null default 'system' constraint workflow_runs_kind_check check (kind in ('system', 'workflow')),
  pipeline            text constraint workflow_runs_pipeline_check check (pipeline is null or pipeline ~ '^[a-z_]+(\.[a-z_]+)?$'),  -- sourcing.amazon, products.process, upload ...
  workflow_id         uuid,                                -- R2 FK(아래 R2 절에서 추가)
  workflow_version_id uuid,                                -- R2 FK
  name                text not null constraint workflow_runs_name_check check (char_length(btrim(name)) between 1 and 120),
  status              text not null default 'queued'
                      constraint workflow_runs_status_check check (status in ('scheduled', 'queued', 'running', 'succeeded', 'failed', 'canceled')),
  trigger_source      text not null default 'manual' constraint workflow_runs_trigger_check check (trigger_source in ('manual', 'schedule', 'system', 'retry')),
  steps_total         smallint not null default 0 constraint workflow_runs_steps_total_check check (steps_total between 0 and 100),
  steps_done          smallint not null default 0 constraint workflow_runs_steps_done_check check (steps_done >= 0),
  current_step_label  text,
  progress_summary    jsonb not null default '{}'::jsonb,  -- {"done":24,"total":24,"unit":"건"}
  subject             jsonb not null default '{}'::jsonb,  -- {"product_ids":[...], "batch_id":...}
  parent_run_id       uuid,
  resume_from_step    smallint,
  error_message       text,
  cancel_requested_at timestamptz,
  credit_ledger_id    bigint references public.credit_ledger(id),
  scheduled_at        timestamptz,
  started_at          timestamptz,
  finished_at         timestamptz,
  duration_ms         bigint generated always as ((extract(epoch from (finished_at - started_at)) * 1000)::bigint) stored,
  created_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (org_id, id),
  constraint workflow_runs_kind_fields_check check ((kind = 'system') = (pipeline is not null and workflow_id is null)),
  constraint workflow_runs_steps_range_check check (steps_done <= steps_total),
  constraint workflow_runs_scheduled_check check (status <> 'scheduled' or scheduled_at is not null),
  constraint workflow_runs_parent_fk foreign key (org_id, parent_run_id)
    references public.workflow_runs (org_id, id) on delete set null (parent_run_id)
);
create index if not exists workflow_runs_org_created_idx on public.workflow_runs (org_id, created_at desc);
create index if not exists workflow_runs_active_idx on public.workflow_runs (org_id, status) where status in ('queued', 'running');
create index if not exists workflow_runs_scheduled_idx on public.workflow_runs (scheduled_at) where status = 'scheduled';

alter table public.source_imports drop constraint if exists source_imports_run_fk;
alter table public.source_imports add constraint source_imports_run_fk foreign key (org_id, workflow_run_id)
  references public.workflow_runs (org_id, id) on delete set null (workflow_run_id);
alter table public.upload_batches drop constraint if exists upload_batches_run_fk;
alter table public.upload_batches add constraint upload_batches_run_fk foreign key (org_id, workflow_run_id)
  references public.workflow_runs (org_id, id) on delete set null (workflow_run_id);

-- 노드(단계)별 상태와 로그. log_tail 은 화면 "원문 로그"(최대 64KB), 전체 로그는 Storage(log_path).
create table if not exists public.workflow_run_steps (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  run_id        uuid not null,
  position      smallint not null constraint workflow_run_steps_position_check check (position between 1 and 100),
  node_key      text not null,                            -- 그래프 노드 id 또는 시스템 단계 키(audio_mix 등)
  node_type     text not null,                            -- import.amazon, title.generate, shorts.audio_mix ...
  label         text not null,                            -- "음원 합성"
  status        text not null default 'pending'
                constraint workflow_run_steps_status_check check (status in ('pending', 'running', 'succeeded', 'failed', 'skipped', 'canceled')),
  summary       text,                                     -- "상품 3개", "장면 21개"
  attempts      smallint not null default 0 constraint workflow_run_steps_attempts_check check (attempts >= 0),
  max_attempts  smallint not null default 3 constraint workflow_run_steps_max_attempts_check check (max_attempts between 1 and 10),
  error_code    text,
  error_message text,                                     -- 사용자 문구(무엇을 고치면 되는지)
  log_tail      text constraint workflow_run_steps_log_check check (log_tail is null or octet_length(log_tail) <= 65536),
  log_path      text,
  output        jsonb not null default '{}'::jsonb,
  job_id        uuid references public.jobs(id) on delete set null,
  started_at    timestamptz,
  finished_at   timestamptz,
  duration_ms   bigint generated always as ((extract(epoch from (finished_at - started_at)) * 1000)::bigint) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (run_id, position),
  unique (run_id, node_key),
  constraint workflow_run_steps_run_fk foreign key (org_id, run_id)
    references public.workflow_runs (org_id, id) on delete cascade
);
create index if not exists workflow_run_steps_run_idx on public.workflow_run_steps (run_id, position);


-- =====================================================================
-- R1-7. RPC (04_API.md 3절 계약). 모두 SECURITY DEFINER, search_path '', 함수별 EXECUTE.
--   authenticated: gc_acknowledge_compliance_warning, gc_dashboard_summary
--   service_role : gc_apply_product_edits, gc_create_upload_batch, gc_release_held_jobs, gc_record_step_outcome, gc_admin_set_plan
-- =====================================================================

-- WARN 확인(상품명 p_target_type = 'product', 상세페이지 'detail_page'). FAIL 은 확인으로 넘길 수 없다.
create or replace function public.gc_acknowledge_compliance_warning(p_target_type text, p_target_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_verdict text;
  v_issues jsonb;
begin
  if p_target_type = 'product' then
    select p.org_id, p.title_verdict, p.title_issues into v_org, v_verdict, v_issues
    from public.products p where p.id = p_target_id and p.deleted_at is null for update;
  elsif p_target_type = 'detail_page' then
    select d.org_id, d.verdict, d.issues into v_org, v_verdict, v_issues
    from public.detail_pages d where d.id = p_target_id for update;
  else
    raise exception 'gc_acknowledge_compliance_warning: unknown target type %', p_target_type using errcode = '22023';
  end if;
  if v_org is null then
    raise exception 'gc_acknowledge_compliance_warning: not found' using errcode = 'P0002';
  end if;
  if not public.is_service_caller()
     and not public.has_org_role(v_org, array['owner', 'admin', 'member']) then
    raise exception 'gc_acknowledge_compliance_warning: not a member' using errcode = '42501';
  end if;
  if not public.has_entitlement(v_org, 'globalcommerce') then
    raise exception 'gc_acknowledge_compliance_warning: no entitlement' using errcode = '42501';
  end if;
  if coalesce(v_verdict, '') <> 'warn' then
    raise exception 'gc_acknowledge_compliance_warning: no warning to acknowledge (verdict %)', coalesce(v_verdict, 'unchecked') using errcode = '22023';
  end if;
  if p_target_type = 'product' then
    update public.products set title_warn_ack_at = now(), title_warn_ack_by = auth.uid() where id = p_target_id;
  else
    update public.detail_pages set warn_acknowledged_at = now(), warn_acknowledged_by = auth.uid() where id = p_target_id;
  end if;
  perform public.write_audit(v_org, 'compliance.warn_ack', p_target_type, p_target_id::text, null, null,
                             jsonb_build_object('note', left(coalesce(p_note, ''), 500), 'issues', v_issues));
end;
$$;

-- 상품 셀 편집 저장(S03 "변경 저장", 되돌리기). 판정은 Route Handler 가 packages/compliance 로 계산해 넘긴다.
-- p_edits = [{ product_id, field: 'title'|'cost_usd'|'category', value, base_updated_at?, verdict?, issues?, replaced?, origin? }]
-- 같은 요청 안에서 상품마다 첫 편집만 base_updated_at 을 대조한다(불일치 40001 → 409 VERSION_CONFLICT).
create or replace function public.gc_apply_product_edits(p_org_id uuid, p_actor_id uuid, p_edits jsonb)
returns setof public.products
language plpgsql
security definer
set search_path = ''
as $$
declare
  e        jsonb;
  v_pid    uuid;
  v_prod   public.products;
  v_seen   uuid[] := '{}';
  v_fx     numeric;
  v_rev    integer;
  v_num    numeric;
begin
  if not public.is_service_caller() then
    raise exception 'gc_apply_product_edits: service_role only' using errcode = '42501';
  end if;
  if jsonb_typeof(p_edits) <> 'array' or jsonb_array_length(p_edits) > 200 then
    raise exception 'gc_apply_product_edits: edits must be an array of at most 200' using errcode = '22023';
  end if;
  for e in select * from jsonb_array_elements(p_edits) loop
    v_pid := (e ->> 'product_id')::uuid;
    select * into v_prod from public.products p where p.id = v_pid and p.org_id = p_org_id and p.deleted_at is null for update;
    if not found then
      raise exception 'gc_apply_product_edits: product % not found', v_pid using errcode = 'P0002';
    end if;
    if not (v_pid = any (v_seen)) then
      if e ? 'base_updated_at' and v_prod.updated_at is distinct from (e ->> 'base_updated_at')::timestamptz then
        raise exception 'gc_apply_product_edits: product % changed since %', v_pid, e ->> 'base_updated_at' using errcode = '40001';
      end if;
      v_seen := v_seen || v_pid;
    end if;
    case e ->> 'field'
      when 'title' then
        if coalesce(e ->> 'verdict', '') not in ('pass', 'warn', 'fail') then
          raise exception 'gc_apply_product_edits: title edit needs verdict' using errcode = '22023';
        end if;
        if v_prod.status = 'generating' then
          raise exception 'gc_apply_product_edits: title is being generated' using errcode = 'GC001';
        end if;
        update public.products set
          title_ai = e ->> 'value',
          title_verdict = e ->> 'verdict',
          title_issues = coalesce(e -> 'issues', '[]'::jsonb),
          banned_replaced_count = coalesce(jsonb_array_length(e -> 'replaced'), 0),
          title_checked_at = clock_timestamp(),
          status = case when status in ('collected', 'approved') then 'review' else status end
        where id = v_pid;
        select coalesce(max(r.revision_no), 0) + 1 into v_rev from public.title_revisions r where r.product_id = v_pid;
        insert into public.title_revisions (org_id, product_id, revision_no, title, origin, verdict, replacements, created_by)
        values (p_org_id, v_pid, v_rev, e ->> 'value', coalesce(e ->> 'origin', 'user'), e ->> 'verdict',
                coalesce(e -> 'replaced', '[]'::jsonb), p_actor_id);
        insert into public.product_activities (org_id, product_id, kind, message, created_by)
        values (p_org_id, v_pid, 'title_saved', 'AI 상품명 저장 · 금지어 ' || coalesce(jsonb_array_length(e -> 'replaced'), 0) || '건', p_actor_id);
      when 'cost_usd' then
        v_num := (e ->> 'value')::numeric;
        if v_num is null or v_num < 0 then
          raise exception 'gc_apply_product_edits: cost_usd must be >= 0' using errcode = '22023';
        end if;
        v_fx := v_prod.fx_rate_krw;
        if v_fx is null or coalesce(v_prod.source_currency, 'USD') <> 'USD' then
          select f.rate_krw / f.unit into v_fx from public.fx_rates f where f.currency = 'USD' order by f.rate_date desc limit 1;
        end if;
        update public.products set
          source_price = v_num, source_currency = 'USD', fx_rate_krw = v_fx,
          cost_krw = case when v_fx is null then null else round(v_num * v_fx)::integer end
        where id = v_pid;
      when 'category' then
        update public.products set category_path = left(e ->> 'value', 200) where id = v_pid;
      else
        raise exception 'gc_apply_product_edits: unknown field %', e ->> 'field' using errcode = '22023';
    end case;
  end loop;
  return query select * from public.products p where p.id = any (v_seen);
end;
$$;

-- 업로드 배치 생성(S06 "선택한 N건 전송"). 멱등(request_id). 이미 registered 인 (상품, 계정)은 건너뛴다.
-- 행마다 market_listings_gate 가 GC009/GC007/GC004/GC005/GC001(상세페이지 confirmed 이상) 을 검사한다.
create or replace function public.gc_create_upload_batch(p_org_id uuid, p_actor_id uuid, p_product_ids uuid[], p_account_ids uuid[], p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key      text := 'upload:' || p_request_id;
  v_batch    public.upload_batches;
  v_run_id   uuid;
  v_acc      public.market_accounts;
  v_aid      uuid;
  v_pid      uuid;
  v_page_id  uuid;
  v_listing  public.market_listings;
  v_ids      uuid[] := '{}';
  v_skipped  integer := 0;
begin
  if not public.is_service_caller() then
    raise exception 'gc_create_upload_batch: service_role only' using errcode = '42501';
  end if;
  if p_request_id is null or cardinality(p_product_ids) is null or cardinality(p_account_ids) is null then
    raise exception 'gc_create_upload_batch: request_id, products and accounts are required' using errcode = '22023';
  end if;
  select * into v_batch from public.upload_batches b where b.idempotency_key = v_key;
  if found then
    if v_batch.org_id <> p_org_id then
      raise exception 'gc_create_upload_batch: request id used by another org' using errcode = '42501';
    end if;
    return jsonb_build_object('batch_id', v_batch.id, 'run_id', v_batch.workflow_run_id, 'replayed', true,
      'listing_ids', coalesce((select jsonb_agg(l.id) from public.market_listings l where l.batch_id = v_batch.id), '[]'::jsonb),
      'skipped_registered', v_batch.skipped_count);
  end if;

  insert into public.workflow_runs (org_id, kind, pipeline, name, status, trigger_source, subject, created_by)
  values (p_org_id, 'system', 'upload', '마켓 업로드 ' || (cardinality(p_product_ids) * cardinality(p_account_ids)) || '건', 'queued', 'manual',
          jsonb_build_object('product_ids', to_jsonb(p_product_ids), 'account_ids', to_jsonb(p_account_ids)), p_actor_id)
  returning id into v_run_id;
  insert into public.upload_batches (org_id, product_ids, account_ids, idempotency_key, workflow_run_id, created_by)
  values (p_org_id, p_product_ids, p_account_ids, v_key, v_run_id, p_actor_id)
  returning * into v_batch;

  foreach v_pid in array p_product_ids loop
    select d.id into v_page_id from public.detail_pages d
    where d.product_id = v_pid and d.org_id = p_org_id and d.status in ('confirmed', 'rendering', 'ready')
    order by d.version desc limit 1;
    foreach v_aid in array p_account_ids loop
      select * into v_acc from public.market_accounts a where a.id = v_aid;
      if not found or v_acc.org_id <> p_org_id then
        raise exception 'gc_create_upload_batch: market account not in org' using errcode = '42501';
      end if;
      select * into v_listing from public.market_listings l where l.product_id = v_pid and l.market_account_id = v_acc.id for update;
      if found and v_listing.status = 'registered' then
        v_skipped := v_skipped + 1;
        continue;
      elsif found then
        update public.market_listings set
          batch_id = v_batch.id, detail_page_id = coalesce(v_page_id, detail_page_id),
          status = case when status in ('failed', 'rejected', 'canceled') then 'waiting' else status end,
          error_code = null, error_message = null
        where id = v_listing.id;
        v_ids := v_ids || v_listing.id;
      else
        insert into public.market_listings (org_id, product_id, market_account_id, market, detail_page_id, batch_id, created_by)
        values (p_org_id, v_pid, v_acc.id, v_acc.market, v_page_id, v_batch.id, p_actor_id)
        returning id into v_listing.id;
        v_ids := v_ids || v_listing.id;
      end if;
    end loop;
  end loop;

  update public.upload_batches set total_count = cardinality(v_ids), skipped_count = v_skipped where id = v_batch.id;
  update public.workflow_runs set progress_summary = jsonb_build_object('done', 0, 'total', cardinality(v_ids), 'unit', '건')
  where id = v_run_id;
  return jsonb_build_object('batch_id', v_batch.id, 'run_id', v_run_id, 'listing_ids', to_jsonb(v_ids), 'skipped_registered', v_skipped);
end;
$$;

-- 동시 실행 한도(features.concurrency, GC008). Route Handler 는 한도를 넘는 잡을 run_after = 'infinity' 로 넣고
-- 디스패처가 이 함수로 조직마다 빈 자리만큼 풀어 준다. 부모 잡이 있으면 부모가 succeeded 일 때만.
create or replace function public.gc_release_held_jobs(p_max integer default 200)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r        record;
  v_active integer;
  v_free   integer;
  v_n      integer;
  v_total  integer := 0;
begin
  if not public.is_service_caller() then
    raise exception 'gc_release_held_jobs: service_role only' using errcode = '42501';
  end if;
  for r in select distinct j.org_id from public.jobs j
           where j.app_id = 'globalcommerce' and j.status = 'queued' and j.run_after = 'infinity'::timestamptz loop
    exit when v_total >= p_max;
    perform pg_advisory_xact_lock(hashtext('globalcommerce:concurrency:' || r.org_id::text));
    select count(*) into v_active from public.jobs j
    where j.org_id = r.org_id and j.app_id = 'globalcommerce'
      and (j.status = 'running' or (j.status = 'queued' and j.run_after < 'infinity'::timestamptz));
    v_free := least(public.gc_limit(r.org_id, 'concurrency', 1) - v_active, p_max - v_total);
    continue when v_free <= 0;
    with c as (
      select j.id from public.jobs j
      left join public.jobs p on p.id = j.parent_job_id
      where j.org_id = r.org_id and j.app_id = 'globalcommerce' and j.status = 'queued'
        and j.run_after = 'infinity'::timestamptz and (j.parent_job_id is null or p.status = 'succeeded')
      order by j.priority, j.created_at
      limit v_free
      for update of j skip locked
    )
    update public.jobs set run_after = now() from c where public.jobs.id = c.id;
    get diagnostics v_n = row_count;
    v_total := v_total + v_n;
  end loop;
  return v_total;
end;
$$;

-- 워커가 단계 결과를 기록한다(done/failed/skipped). 실패하면 뒤 단계는 skipped, 실행은 failed.
-- 마지막 단계까지 끝나면 실행을 succeeded 로 닫는다. 같은 결과를 다시 보내도 안전하다.
create or replace function public.gc_record_step_outcome(p_step_id uuid, p_outcome text, p_message text default null)
returns public.workflow_run_steps
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_step public.workflow_run_steps;
  v_run  public.workflow_runs;
  v_to   text;
  v_next text;
  v_done integer;
  v_open integer;
begin
  if not public.is_service_caller() then
    raise exception 'gc_record_step_outcome: service_role only' using errcode = '42501';
  end if;
  v_to := case p_outcome when 'done' then 'succeeded' when 'failed' then 'failed' when 'skipped' then 'skipped' end;
  if v_to is null then
    raise exception 'gc_record_step_outcome: unknown outcome %', p_outcome using errcode = '22023';
  end if;
  select * into v_step from public.workflow_run_steps s where s.id = p_step_id for update;
  if not found then
    raise exception 'gc_record_step_outcome: step not found' using errcode = 'P0002';
  end if;
  select * into v_run from public.workflow_runs w where w.id = v_step.run_id for update;
  if v_step.status = v_to then
    return v_step;
  end if;
  if v_run.status = 'queued' then
    update public.workflow_runs set status = 'running', started_at = coalesce(started_at, now()) where id = v_run.id;
  end if;
  if v_to in ('succeeded', 'failed') and v_step.status = 'pending' then
    update public.workflow_run_steps set status = 'running', started_at = now() where id = p_step_id;
  end if;
  if v_to = 'skipped' and v_step.status <> 'pending' then
    raise exception 'gc_record_step_outcome: only pending steps can be skipped' using errcode = '22023';
  end if;
  update public.workflow_run_steps set
    status = v_to, attempts = attempts + case when v_to = 'skipped' then 0 else 1 end,
    finished_at = now(), error_message = case when v_to = 'failed' then left(p_message, 500) else error_message end,
    summary = case when v_to = 'succeeded' and p_message is not null then left(p_message, 200) else summary end
  where id = p_step_id
  returning * into v_step;

  if v_to = 'failed' then
    update public.workflow_run_steps set status = 'skipped'
    where run_id = v_step.run_id and position > v_step.position and status = 'pending';
  end if;
  select count(*) filter (where s.status in ('succeeded', 'skipped')),
         count(*) filter (where s.status in ('pending', 'running'))
    into v_done, v_open
  from public.workflow_run_steps s where s.run_id = v_step.run_id;
  select s.label into v_next from public.workflow_run_steps s
  where s.run_id = v_step.run_id and s.status in ('pending', 'running') order by s.position limit 1;
  update public.workflow_runs set
    steps_done = least(v_done, steps_total), current_step_label = v_next,
    status = case when v_to = 'failed' then 'failed' when v_open = 0 then 'succeeded' else status end,
    error_message = case when v_to = 'failed' then left(p_message, 500) else error_message end,
    finished_at = case when v_to = 'failed' or v_open = 0 then now() else finished_at end
  where id = v_step.run_id and status = 'running';
  return v_step;
end;
$$;

-- 대시보드 KPI(S01): 오늘 처리 대기(가공·업로드), 최근 실행 5건, 크레딧 잔액, 환율(USD·CAD 최근 2일)
create or replace function public.gc_dashboard_summary(p_org_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_process integer;
  v_upload  integer;
begin
  if not public.is_service_caller() and not public.is_org_member(p_org_id) then
    raise exception 'gc_dashboard_summary: not a member' using errcode = '42501';
  end if;
  select count(*) into v_process from public.products p
  where p.org_id = p_org_id and p.deleted_at is null and p.status in ('collected', 'review');
  select count(*) into v_upload from public.market_listings l
  where l.org_id = p_org_id and l.status in ('waiting', 'failed', 'rejected');
  return jsonb_build_object(
    'pending_total', v_process + v_upload,
    'pending_process', v_process,
    'pending_upload', v_upload,
    'recent_runs', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
        select w.id, w.name, w.kind, w.pipeline, w.status, w.steps_done, w.steps_total, w.current_step_label,
               w.progress_summary, w.error_message, w.duration_ms, w.scheduled_at, w.started_at, w.created_at
        from public.workflow_runs w where w.org_id = p_org_id order by w.created_at desc limit 5) x), '[]'::jsonb),
    'credits', coalesce((select jsonb_build_object('plan', w.plan_balance, 'pack', w.pack_balance, 'total', w.plan_balance + w.pack_balance)
                         from public.wallets w where w.org_id = p_org_id), jsonb_build_object('plan', 0, 'pack', 0, 'total', 0)),
    'fx', coalesce((
      select jsonb_agg(jsonb_build_object('currency', f.currency, 'rate_krw', f.rate_krw / f.unit, 'rate_date', f.rate_date, 'fetched_at', f.fetched_at)
                       order by f.currency, f.rate_date desc)
      from (select f2.*, row_number() over (partition by f2.currency order by f2.rate_date desc) as rn
            from public.fx_rates f2 where f2.currency in ('USD', 'CAD')) f
      where f.rn <= 2), '[]'::jsonb));
end;
$$;

-- 슈퍼 어드민 플랜 조정(S15). 호출 전 Route Handler 가 is_platform_admin 을 확인한다. 결제 없이 엔타이틀먼트만 바꾼다.
create or replace function public.gc_admin_set_plan(p_org_id uuid, p_plan_code text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan uuid;
  v_old  text;
begin
  if not public.is_service_caller() then
    raise exception 'gc_admin_set_plan: service_role only' using errcode = '42501';
  end if;
  if char_length(coalesce(btrim(p_reason), '')) < 5 then
    raise exception 'gc_admin_set_plan: reason required' using errcode = '22023';
  end if;
  select p.id into v_plan from public.plans p where p.app_id = 'globalcommerce' and p.code = p_plan_code;
  if v_plan is null then
    raise exception 'gc_admin_set_plan: unknown plan %', p_plan_code using errcode = '22023';
  end if;
  select public.entitled_plan_code(p_org_id, 'globalcommerce') into v_old;
  insert into public.app_entitlements (org_id, app_id, plan_id, status, source, note)
  values (p_org_id, 'globalcommerce', v_plan, 'active', 'manual', left(p_reason, 200))
  on conflict (org_id, app_id) do update
    set plan_id = excluded.plan_id, status = 'active', source = 'manual', note = excluded.note, expires_at = null, updated_at = now();
  update public.subscriptions set plan_id = v_plan, updated_at = now()
  where org_id = p_org_id and app_id = 'globalcommerce';
  perform public.write_audit(p_org_id, 'admin.plan_change', 'organization', p_org_id::text,
                             jsonb_build_object('plan', v_old), jsonb_build_object('plan', p_plan_code),
                             jsonb_build_object('reason', left(p_reason, 200)));
end;
$$;


-- =====================================================================
-- R2. 노드 캔버스(GC-F-402/403), 블로그(GC-F-501/502), 숏폼(GC-F-503/504), SNS(GC-F-505/506)
--     표는 지금 만들고 화면·잡은 R2 에 켠다. 쓰기는 기능 게이트(workflow_canvas, blog, shorts_per_month, sns)가 막는다.
-- =====================================================================

-- R2 워크플로우(사용자 캔버스). 서버 전용 쓰기(그래프 검증은 Route Handler).
create table if not exists public.workflows (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations(id) on delete cascade,
  name               text not null constraint workflows_name_check check (char_length(btrim(name)) between 1 and 80),
  description        text,
  current_version_id uuid,
  schedule_cron      text,
  is_enabled         boolean not null default false,
  status             text not null default 'draft' constraint workflows_status_check check (status in ('draft', 'active', 'archived')),
  created_by         uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (org_id, id)
);

-- R2 그래프 버전(@xyflow/react 12). graph = {"nodes":[...], "edges":[...]}. 불변.
create table if not exists public.workflow_versions (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  workflow_id uuid not null,
  version_no  integer not null constraint workflow_versions_no_check check (version_no >= 1),
  graph       jsonb not null constraint workflow_versions_graph_check check (
                jsonb_typeof(graph) = 'object' and jsonb_typeof(graph -> 'nodes') = 'array' and jsonb_typeof(graph -> 'edges') = 'array'
                and jsonb_array_length(graph -> 'nodes') between 1 and 100),
  note        text,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  unique (org_id, id),
  unique (workflow_id, version_no),
  constraint workflow_versions_workflow_fk foreign key (org_id, workflow_id)
    references public.workflows (org_id, id) on delete cascade
);

alter table public.workflows drop constraint if exists workflows_current_version_fk;
alter table public.workflows add constraint workflows_current_version_fk foreign key (org_id, current_version_id)
  references public.workflow_versions (org_id, id) on delete set null (current_version_id);
alter table public.workflow_runs drop constraint if exists workflow_runs_workflow_fk;
alter table public.workflow_runs add constraint workflow_runs_workflow_fk foreign key (org_id, workflow_id)
  references public.workflows (org_id, id) on delete set null (workflow_id);
alter table public.workflow_runs drop constraint if exists workflow_runs_version_fk;
alter table public.workflow_runs add constraint workflow_runs_version_fk foreign key (org_id, workflow_version_id)
  references public.workflow_versions (org_id, id) on delete set null (workflow_version_id);

-- 이력 표 불변(workflow_versions, title_revisions)
create or replace function public.gc_immutable_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% rows are immutable', tg_table_name using errcode = '42501';
end;
$$;

-- R2 블로그 발행처(자체 블로그 1개 + WordPress 사이트들). WordPress 키는 encrypted_credentials.
create table if not exists public.publish_targets (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  target        text not null constraint publish_targets_target_check check (target in ('self_blog', 'wordpress')),
  label         text not null constraint publish_targets_label_check check (char_length(btrim(label)) between 1 and 40),
  site_url      text constraint publish_targets_url_check check (site_url is null or site_url ~ '^https://'),
  credential_id uuid references public.encrypted_credentials(id) on delete set null,
  status        text not null default 'active' constraint publish_targets_status_check check (status in ('active', 'invalid', 'error', 'disabled')),
  last_error    text,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id, id),
  constraint publish_targets_wp_check check (target <> 'wordpress' or site_url is not null)
);
create unique index if not exists publish_targets_self_uniq on public.publish_targets (org_id) where target = 'self_blog';

-- R2 블로그 원고. 사용자는 draft 상태에서 제목·본문만 고친다(발행·예약은 서버).
create table if not exists public.posts (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations(id) on delete cascade,
  product_id       uuid,
  detail_page_id   uuid,
  target_id        uuid,
  title            text not null constraint posts_title_check check (char_length(btrim(title)) between 1 and 120),
  slug             text constraint posts_slug_check check (slug is null or slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  body_md          text not null default '' constraint posts_body_check check (char_length(body_md) <= 50000),
  char_count       integer generated always as (char_length(body_md)) stored,
  edit_revision    integer not null default 0,
  jsonld           jsonb,
  verdict          text constraint posts_verdict_check check (verdict is null or verdict in ('pass', 'warn', 'fail')),
  status           text not null default 'draft'
                   constraint posts_status_check check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed', 'archived')),
  scheduled_at     timestamptz,
  published_at     timestamptz,
  external_url     text,
  error_message    text,
  credit_ledger_id bigint references public.credit_ledger(id),
  job_id           uuid references public.jobs(id) on delete set null,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (org_id, id),
  constraint posts_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete set null (product_id),
  constraint posts_page_fk foreign key (org_id, detail_page_id)
    references public.detail_pages (org_id, id) on delete set null (detail_page_id),
  constraint posts_target_fk foreign key (org_id, target_id)
    references public.publish_targets (org_id, id) on delete set null (target_id),
  constraint posts_scheduled_check check (status <> 'scheduled' or scheduled_at is not null)
);
create index if not exists posts_org_updated_idx on public.posts (org_id, updated_at desc);
create unique index if not exists posts_slug_uniq on public.posts (org_id, slug) where slug is not null;
create index if not exists posts_scheduled_idx on public.posts (scheduled_at) where status = 'scheduled';

-- R2 숏폼 렌더(GC-D-12): 15/30/50초, 9:16 1080x1920 mp4.
create table if not exists public.videos (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations(id) on delete cascade,
  product_id       uuid not null,
  duration_sec     smallint not null constraint videos_duration_check check (duration_sec in (15, 30, 50)),
  motion_template  text not null constraint videos_motion_check check (motion_template in ('zoom_in', 'pan', 'split')),
  audio_mode       text not null constraint videos_audio_mode_check check (audio_mode in ('mine', 'stock', 'random')),
  audio_track_id   uuid references public.audio_tracks(id) on delete set null,
  loop_audio       boolean not null default false,
  tts_voice        text,
  script           jsonb not null default '[]'::jsonb constraint videos_script_check check (jsonb_typeof(script) = 'array'),
  status           text not null default 'queued'
                   constraint videos_status_check check (status in ('queued', 'rendering', 'succeeded', 'failed', 'canceled')),
  stage            text constraint videos_stage_check check (stage is null or stage in ('script', 'tts', 'motion', 'audio_mix', 'encode')),
  progress         smallint not null default 0 constraint videos_progress_check check (progress between 0 and 100),
  width            integer not null default 1080 constraint videos_width_check check (width = 1080),
  height           integer not null default 1920 constraint videos_height_check check (height = 1920),
  storage_path     text,
  thumbnail_path   text,
  error_message    text,
  credit_ledger_id bigint references public.credit_ledger(id),
  job_id           uuid references public.jobs(id) on delete set null,
  workflow_run_id  uuid,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  finished_at      timestamptz,
  unique (org_id, id),
  constraint videos_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete cascade,
  constraint videos_run_fk foreign key (org_id, workflow_run_id)
    references public.workflow_runs (org_id, id) on delete set null (workflow_run_id),
  constraint videos_audio_check check (audio_mode = 'random' or audio_track_id is not null)
);
create index if not exists videos_org_created_idx on public.videos (org_id, created_at desc);
create index if not exists videos_queue_idx on public.videos (org_id, created_at) where status in ('queued', 'rendering');

-- R2 SNS 채널(YouTube Data API v3, Instagram Graph API 비즈니스 계정). 토큰은 encrypted_credentials.
create table if not exists public.sns_accounts (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id) on delete cascade,
  platform            text not null constraint sns_accounts_platform_check check (platform in ('youtube', 'instagram')),
  channel_name        text not null,
  external_account_id text not null,
  credential_id       uuid references public.encrypted_credentials(id) on delete set null,
  status              text not null default 'connected'
                      constraint sns_accounts_status_check check (status in ('connected', 'expired', 'error', 'disconnected')),
  last_error          text,
  created_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, platform, external_account_id)
);

-- R2 SNS 업로드. 마켓 등록 전에는 link_pending(화면 "링크 대기"), 등록되면 서버가 scheduled 로 넘긴다.
-- 유튜브 댓글 고정은 API 미지원으로 보고 수동 안내(O-06): pin_manual_needed.
create table if not exists public.sns_posts (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations(id) on delete cascade,
  video_id           uuid not null,
  sns_account_id     uuid not null,
  product_id         uuid,
  market_listing_id  uuid,
  platform           text not null constraint sns_posts_platform_check check (platform in ('youtube', 'instagram')),
  caption            text constraint sns_posts_caption_check check (caption is null or char_length(caption) <= 5000),
  product_url        text,
  status             text not null default 'link_pending'
                     constraint sns_posts_status_check check (status in ('link_pending', 'scheduled', 'uploading', 'uploaded', 'failed', 'canceled')),
  scheduled_at       timestamptz,
  link_in_description boolean not null default false,
  comment_posted     boolean not null default false,
  pin_manual_needed  boolean not null default false,
  external_post_id   text,
  external_url       text,
  error_message      text,
  job_id             uuid references public.jobs(id) on delete set null,
  created_by         uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  uploaded_at        timestamptz,
  unique (org_id, id),
  constraint sns_posts_video_fk foreign key (org_id, video_id)
    references public.videos (org_id, id) on delete cascade,
  constraint sns_posts_account_fk foreign key (org_id, sns_account_id)
    references public.sns_accounts (org_id, id) on delete cascade,
  constraint sns_posts_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete set null (product_id),
  constraint sns_posts_listing_fk foreign key (org_id, market_listing_id)
    references public.market_listings (org_id, id) on delete set null (market_listing_id),
  constraint sns_posts_scheduled_check check (status not in ('scheduled', 'uploading', 'uploaded') or (scheduled_at is not null and product_url is not null))
);
create index if not exists sns_posts_org_scheduled_idx on public.sns_posts (org_id, scheduled_at);
create index if not exists sns_posts_link_pending_idx on public.sns_posts (product_id) where status = 'link_pending';
create index if not exists sns_posts_due_idx on public.sns_posts (scheduled_at) where status = 'scheduled';

-- R2 기능 게이트(GC007): 테이블별 플랜 키. 숏폼은 월 편수(Asia/Seoul 달력 기준)도 센다.
create or replace function public.gc_r2_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if tg_table_name in ('workflows', 'workflow_versions') and not public.gc_flag(new.org_id, 'workflow_canvas') then
    raise exception '%: plan does not allow workflow canvas', tg_table_name using errcode = 'GC007';
  elsif tg_table_name in ('posts', 'publish_targets') and not public.gc_flag(new.org_id, 'blog') then
    raise exception '%: plan does not allow blog', tg_table_name using errcode = 'GC007';
  elsif tg_table_name in ('sns_accounts', 'sns_posts') and not public.gc_flag(new.org_id, 'sns') then
    raise exception '%: plan does not allow sns', tg_table_name using errcode = 'GC007';
  elsif tg_table_name = 'videos' then
    v_limit := public.gc_limit(new.org_id, 'shorts_per_month', 0);
    if v_limit = 0 then
      raise exception 'videos: plan does not allow shorts' using errcode = 'GC007';
    end if;
    if v_limit > 0 then
      perform pg_advisory_xact_lock(hashtext('globalcommerce:videos:' || new.org_id::text));
      select count(*) into v_count from public.videos v
      where v.org_id = new.org_id and v.status <> 'canceled'
        and v.created_at >= (date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul');
      if v_count >= v_limit then
        raise exception 'videos: monthly shorts quota exceeded (%/%)', v_count, v_limit using errcode = 'GC007';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- 사용자 세션은 draft 원고만 고친다.
create or replace function public.posts_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_privileged_session() and old.status <> 'draft' then
    raise exception 'posts: only draft posts can be edited (status %)', old.status using errcode = 'GC001';
  end if;
  if new.body_md is distinct from old.body_md or new.title is distinct from old.title then
    new.edit_revision := old.edit_revision + 1;
    if not public.is_privileged_session() then
      new.verdict := null;
    end if;
  end if;
  return new;
end;
$$;


-- =====================================================================
-- R3. 상품 검색·GEO(GC-D-15): pgvector 1536(text-embedding-3-small), 하이브리드 검색, JSON-LD
-- =====================================================================
create extension if not exists vector with schema extensions;

create table if not exists public.product_embeddings (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  product_id   uuid not null,
  model        text not null default 'text-embedding-3-small' constraint product_embeddings_model_check check (model in ('text-embedding-3-small')),
  content      text not null,                              -- 임베딩한 원문(상품명 + 스펙 요약)
  content_hash text not null,
  embedding    extensions.vector(1536) not null,
  tsv          tsvector generated always as (to_tsvector('simple', content)) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_id, model),
  constraint product_embeddings_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete cascade
);
create index if not exists product_embeddings_org_idx on public.product_embeddings (org_id);
create index if not exists product_embeddings_tsv_idx on public.product_embeddings using gin (tsv);
create index if not exists product_embeddings_hnsw_idx on public.product_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

create table if not exists public.jsonld_snapshots (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  product_id     uuid not null,
  detail_page_id uuid,
  post_id        uuid,
  schema_type    text not null default 'Product' constraint jsonld_snapshots_type_check check (schema_type in ('Product')),
  data           jsonb not null constraint jsonld_snapshots_data_check check (jsonb_typeof(data) = 'object' and data ->> '@type' = 'Product'),
  applied_to     text[] not null default '{}' constraint jsonld_snapshots_applied_check check (applied_to <@ array['detail_page', 'blog']),
  created_by     uuid,
  created_at     timestamptz not null default now(),
  constraint jsonld_snapshots_product_fk foreign key (org_id, product_id)
    references public.products (org_id, id) on delete cascade,
  constraint jsonld_snapshots_page_fk foreign key (org_id, detail_page_id)
    references public.detail_pages (org_id, id) on delete set null (detail_page_id),
  constraint jsonld_snapshots_post_fk foreign key (org_id, post_id)
    references public.posts (org_id, id) on delete set null (post_id)
);
create index if not exists jsonld_snapshots_product_idx on public.jsonld_snapshots (product_id, created_at desc);

create or replace function public.gc_r3_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.gc_flag(new.org_id, 'search') then
    raise exception '%: plan does not allow search', tg_table_name using errcode = 'GC007';
  end if;
  return new;
end;
$$;

-- 하이브리드 검색(04_API.md gc_hybrid_search). 키워드(전문 검색)와 의미(코사인) 점수를 가중 합산한다.
-- p_semantic_weight 0~1(화면 "의미 70" = 0.7, 1보다 크면 100분율로 본다). p_filters = { source?, category?, registered_only? }
-- service_role 전용(Route Handler 가 질의 임베딩을 만들고 org 를 세션에서 넣는다). 같은 조직 행만 본다.
create or replace function public.gc_hybrid_search(p_org_id uuid, p_query_embedding extensions.vector(1536), p_query_text text,
                                                   p_semantic_weight real default 0.7, p_filters jsonb default '{}'::jsonb,
                                                   p_limit integer default 20)
returns table (product_id uuid, score real, kw_score real, sem_score real, match_reason text)
language sql
stable
security definer
set search_path = ''
as $$
  with params as (
    select websearch_to_tsquery('simple', coalesce(p_query_text, '')) as tsq,
           greatest(0, least(1, case when p_semantic_weight > 1 then p_semantic_weight / 100 else p_semantic_weight end))::real as w
  ), scored as (
    select e.product_id,
           coalesce(ts_rank(e.tsv, params.tsq), 0)::real as kw,
           (1 - (e.embedding operator(extensions.<=>) p_query_embedding))::real as sem,
           params.w
    from public.product_embeddings e
    join public.products p on p.id = e.product_id and p.deleted_at is null
    cross join params
    where e.org_id = p_org_id
      and (p_filters ->> 'source' is null or p.source = p_filters ->> 'source')
      and (p_filters ->> 'category' is null or p.category_path like (p_filters ->> 'category') || '%')
      and (coalesce((p_filters ->> 'registered_only')::boolean, false) = false
           or exists (select 1 from public.market_listings l where l.product_id = p.id and l.status = 'registered'))
  )
  select s.product_id, ((1 - s.w) * s.kw + s.w * s.sem)::real, s.kw, s.sem,
         case when s.kw > 0 and s.sem >= 0.75 then 'semantic,keyword' when s.kw > 0 then 'keyword' else 'semantic' end
  from scored s
  order by 2 desc
  limit least(greatest(coalesce(p_limit, 20), 1), 1000);
$$;


-- =====================================================================
-- 트리거 연결
-- =====================================================================
do $$
declare t text;
begin
  -- updated_at
  foreach t in array array['market_accounts', 'slot_addons', 'shipping_templates', 'audio_tracks', 'notification_prefs', 'saved_views',
                           'source_imports', 'import_rows', 'products', 'product_images', 'banned_words', 'detail_pages',
                           'upload_batches', 'market_listings', 'export_files', 'workflow_runs', 'workflow_run_steps',
                           'workflows', 'publish_targets', 'posts', 'videos', 'sns_accounts', 'sns_posts', 'product_embeddings'] loop
    execute format('drop trigger if exists %1$s_set_updated_at on public.%1$s', t);
    execute format('create trigger %1$s_set_updated_at before update on public.%1$s for each row execute function public.set_updated_at()', t);
  end loop;
  -- 이중 잠금: 서버 전용 테이블은 사용자 세션 쓰기를 42501 로 거부
  foreach t in array array['market_accounts', 'slot_addons', 'fx_rates', 'trend_keywords', 'season_picks',
                           'source_imports', 'import_rows', 'product_images', 'title_revisions', 'detail_pages', 'market_images',
                           'upload_batches', 'market_listings', 'export_files', 'workflow_runs', 'workflow_run_steps',
                           'workflows', 'workflow_versions', 'publish_targets', 'videos', 'sns_accounts', 'sns_posts',
                           'product_embeddings', 'jsonld_snapshots'] loop
    execute format('drop trigger if exists %1$s_guard_write on public.%1$s', t);
    execute format('create trigger %1$s_guard_write before insert or update or delete on public.%1$s for each row execute function public.guard_privileged_write()', t);
  end loop;
  -- 상태 전이(GC001)
  foreach t in array array['slot_addons', 'source_imports', 'products', 'detail_pages', 'upload_batches', 'market_listings',
                           'export_files', 'workflow_runs', 'workflow_run_steps', 'posts', 'videos', 'sns_posts'] loop
    execute format('drop trigger if exists %1$s_status_guard on public.%1$s', t);
    execute format('create trigger %1$s_status_guard before insert or update of status on public.%1$s for each row execute function public.gc_status_guard()', t);
  end loop;
  -- 사용자 쓰기 테이블의 created_by 고정
  foreach t in array array['shipping_templates', 'audio_tracks', 'banned_words', 'product_activities'] loop
    execute format('drop trigger if exists %1$s_stamp_creator on public.%1$s', t);
    execute format('create trigger %1$s_stamp_creator before insert on public.%1$s for each row execute function public.gc_stamp_creator()', t);
  end loop;
  -- R2 / R3 기능 게이트(INSERT)
  foreach t in array array['workflows', 'workflow_versions', 'posts', 'publish_targets', 'videos', 'sns_accounts', 'sns_posts'] loop
    execute format('drop trigger if exists %1$s_feature_gate on public.%1$s', t);
    execute format('create trigger %1$s_feature_gate before insert on public.%1$s for each row execute function public.gc_r2_gate()', t);
  end loop;
  foreach t in array array['product_embeddings', 'jsonld_snapshots'] loop
    execute format('drop trigger if exists %1$s_feature_gate on public.%1$s', t);
    execute format('create trigger %1$s_feature_gate before insert on public.%1$s for each row execute function public.gc_r3_gate()', t);
  end loop;
end $$;

-- 한도·게이트·검증
drop trigger if exists products_enforce_quota on public.products;
create trigger products_enforce_quota before insert or update of deleted_at on public.products for each row execute function public.products_enforce_quota();
drop trigger if exists products_guard on public.products;
create trigger products_guard before update on public.products for each row execute function public.products_guard();
drop trigger if exists market_accounts_enforce on public.market_accounts;
create trigger market_accounts_enforce before insert or update of status, credential_id on public.market_accounts for each row execute function public.market_accounts_enforce();
drop trigger if exists shipping_templates_validate on public.shipping_templates;
create trigger shipping_templates_validate before insert or update on public.shipping_templates for each row execute function public.shipping_templates_validate();
drop trigger if exists detail_pages_guard on public.detail_pages;
create trigger detail_pages_guard before insert or update on public.detail_pages for each row execute function public.detail_pages_guard();
drop trigger if exists market_listings_gate on public.market_listings;
create trigger market_listings_gate before insert or update of status on public.market_listings for each row execute function public.market_listings_gate();
drop trigger if exists market_listings_rollup on public.market_listings;
create trigger market_listings_rollup after insert or update of status, batch_id or delete on public.market_listings for each row execute function public.market_listings_rollup();
drop trigger if exists export_files_gate on public.export_files;
create trigger export_files_gate before insert on public.export_files for each row execute function public.export_files_gate();
drop trigger if exists workflow_versions_immutable on public.workflow_versions;
create trigger workflow_versions_immutable before update on public.workflow_versions for each row execute function public.gc_immutable_row();
drop trigger if exists title_revisions_immutable on public.title_revisions;
create trigger title_revisions_immutable before update on public.title_revisions for each row execute function public.gc_immutable_row();
drop trigger if exists posts_guard on public.posts;
create trigger posts_guard before update on public.posts for each row execute function public.posts_guard();


-- =====================================================================
-- RLS 와 GRANT
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['market_accounts', 'slot_addons', 'shipping_templates', 'audio_tracks', 'notification_prefs', 'saved_views',
                           'fx_rates', 'trend_keywords', 'season_picks',
                           'source_imports', 'import_rows', 'products', 'product_images', 'banned_words', 'title_revisions',
                           'product_activities', 'detail_pages', 'market_images', 'upload_batches', 'market_listings', 'export_files',
                           'workflow_runs', 'workflow_run_steps',
                           'workflows', 'workflow_versions', 'publish_targets', 'posts', 'videos', 'sns_accounts', 'sns_posts',
                           'product_embeddings', 'jsonld_snapshots'] loop
    execute format('alter table public.%I enable row level security', t);
    -- 모놀리스 public 기본 권한 대비: 전부 회수 후 필요한 것만
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;

  -- 읽기 전용(서버가 쓰는) 테넌트 테이블: 조직 멤버(viewer 포함) + 엔타이틀먼트
  foreach t in array array['market_accounts', 'source_imports', 'import_rows', 'product_images', 'title_revisions',
                           'detail_pages', 'market_images', 'upload_batches', 'market_listings', 'export_files',
                           'workflow_runs', 'workflow_run_steps',
                           'workflows', 'workflow_versions', 'publish_targets', 'videos', 'sns_accounts', 'sns_posts',
                           'product_embeddings', 'jsonld_snapshots'] loop
    execute format('grant select on table public.%I to authenticated', t);
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select to authenticated '
                   'using (public.is_org_member(org_id) and public.has_entitlement(org_id, ''globalcommerce''))', t);
  end loop;

  -- 전역 캐시: 로그인 사용자 공용 읽기(조직 무관). 쓰기는 크론(service_role)만
  foreach t in array array['fx_rates', 'trend_keywords', 'season_picks'] loop
    execute format('grant select on table public.%I to authenticated', t);
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (true)', t);
  end loop;
end $$;

-- slot_addons: 결제 정보라 owner/admin 만 읽는다
grant select on table public.slot_addons to authenticated;
drop policy if exists slot_addons_select on public.slot_addons;
create policy slot_addons_select on public.slot_addons for select to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin']));

-- products: 판매가·메모·태그·분류·검토 상태·보관만 UPDATE. INSERT 는 수집 잡(서버). 상품명은 서버(금지어 매처) 경유.
grant select, delete on table public.products to authenticated;
grant update (sell_price_krw, brand, category_path, attributes, tags, memo, status, deleted_at) on table public.products to authenticated;
drop policy if exists products_select on public.products;
create policy products_select on public.products for select to authenticated
  using (public.is_org_member(org_id) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists products_update on public.products;
create policy products_update on public.products for update to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin', 'member']) and public.has_entitlement(org_id, 'globalcommerce'))
  with check (public.has_org_role(org_id, array['owner', 'admin', 'member']) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists products_delete on public.products;
create policy products_delete on public.products for delete to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin']));

-- product_activities: 메모만 INSERT
grant select on table public.product_activities to authenticated;
grant insert (org_id, product_id, kind, message) on table public.product_activities to authenticated;
drop policy if exists product_activities_select on public.product_activities;
create policy product_activities_select on public.product_activities for select to authenticated
  using (public.is_org_member(org_id) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists product_activities_insert on public.product_activities;
create policy product_activities_insert on public.product_activities for insert to authenticated
  with check (kind = 'memo' and public.has_org_role(org_id, array['owner', 'admin', 'member'])
              and public.has_entitlement(org_id, 'globalcommerce'));

-- shipping_templates: 설정이라 owner/admin 쓰기, 멤버 읽기
grant select, delete on table public.shipping_templates to authenticated;
grant insert (org_id, name, template_type, auto_attach_overseas, notice_text, dispatch_days, delivery_days_min, delivery_days_max,
              return_window_days, exchange_allowed, return_fee_krw, initial_shipping_fee_krw, restriction_codes,
              requires_customs_code, return_address, contact_phone, is_default)
  on table public.shipping_templates to authenticated;
grant update (name, template_type, auto_attach_overseas, notice_text, dispatch_days, delivery_days_min, delivery_days_max,
              return_window_days, exchange_allowed, return_fee_krw, initial_shipping_fee_krw, restriction_codes,
              requires_customs_code, return_address, contact_phone, is_default)
  on table public.shipping_templates to authenticated;
drop policy if exists shipping_templates_select on public.shipping_templates;
create policy shipping_templates_select on public.shipping_templates for select to authenticated
  using (public.is_org_member(org_id) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists shipping_templates_insert on public.shipping_templates;
create policy shipping_templates_insert on public.shipping_templates for insert to authenticated
  with check (public.has_org_role(org_id, array['owner', 'admin']) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists shipping_templates_update on public.shipping_templates;
create policy shipping_templates_update on public.shipping_templates for update to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin']) and public.has_entitlement(org_id, 'globalcommerce'))
  with check (public.has_org_role(org_id, array['owner', 'admin']) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists shipping_templates_delete on public.shipping_templates;
create policy shipping_templates_delete on public.shipping_templates for delete to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin']));

-- audio_tracks: 기본 풀(org_id null)은 읽기 전용. 조직 행은 owner/admin/member 가 올리고 제목·태그를 고친다.
--   storage_path 는 자기 조직 폴더만(<org_id>/globalcommerce/audio/...). 길이·파일 상태는 워커.
grant select, delete on table public.audio_tracks to authenticated;
grant insert (org_id, title, source, mood_tags, storage_path, mime_type, bytes, license_note) on table public.audio_tracks to authenticated;
grant update (title, mood_tags, license_note, is_active) on table public.audio_tracks to authenticated;
drop policy if exists audio_tracks_select on public.audio_tracks;
create policy audio_tracks_select on public.audio_tracks for select to authenticated
  using (org_id is null or (public.is_org_member(org_id) and public.has_entitlement(org_id, 'globalcommerce')));
drop policy if exists audio_tracks_insert on public.audio_tracks;
create policy audio_tracks_insert on public.audio_tracks for insert to authenticated
  with check (org_id is not null and source in ('upload', 'suno')
              and storage_path like org_id::text || '/globalcommerce/audio/%'
              and public.has_org_role(org_id, array['owner', 'admin', 'member']) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists audio_tracks_update on public.audio_tracks;
create policy audio_tracks_update on public.audio_tracks for update to authenticated
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin', 'member']))
  with check (org_id is not null and public.has_org_role(org_id, array['owner', 'admin', 'member']) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists audio_tracks_delete on public.audio_tracks;
create policy audio_tracks_delete on public.audio_tracks for delete to authenticated
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']));

-- notification_prefs: 본인 행만
grant select, insert, update, delete on table public.notification_prefs to authenticated;
drop policy if exists notification_prefs_select on public.notification_prefs;
create policy notification_prefs_select on public.notification_prefs for select to authenticated
  using (user_id = auth.uid() and public.is_org_member(org_id));
drop policy if exists notification_prefs_insert on public.notification_prefs;
create policy notification_prefs_insert on public.notification_prefs for insert to authenticated
  with check (user_id = auth.uid() and public.is_org_member(org_id));
drop policy if exists notification_prefs_update on public.notification_prefs;
create policy notification_prefs_update on public.notification_prefs for update to authenticated
  using (user_id = auth.uid() and public.is_org_member(org_id))
  with check (user_id = auth.uid() and public.is_org_member(org_id));
drop policy if exists notification_prefs_delete on public.notification_prefs;
create policy notification_prefs_delete on public.notification_prefs for delete to authenticated
  using (user_id = auth.uid());

-- saved_views: 본인 행만
grant select, insert, update, delete on table public.saved_views to authenticated;
drop policy if exists saved_views_select on public.saved_views;
create policy saved_views_select on public.saved_views for select to authenticated
  using (user_id = auth.uid() and public.is_org_member(org_id));
drop policy if exists saved_views_insert on public.saved_views;
create policy saved_views_insert on public.saved_views for insert to authenticated
  with check (user_id = auth.uid() and public.is_org_member(org_id));
drop policy if exists saved_views_update on public.saved_views;
create policy saved_views_update on public.saved_views for update to authenticated
  using (user_id = auth.uid() and public.is_org_member(org_id))
  with check (user_id = auth.uid() and public.is_org_member(org_id));
drop policy if exists saved_views_delete on public.saved_views;
create policy saved_views_delete on public.saved_views for delete to authenticated
  using (user_id = auth.uid());

-- banned_words: 기본 사전(org_id null)은 모두 읽기, 조직 추가분은 owner/admin 편집
grant select, delete on table public.banned_words to authenticated;
grant insert (org_id, word, category, severity, action, replacement, note, is_active) on table public.banned_words to authenticated;
grant update (word, category, severity, action, replacement, note, is_active) on table public.banned_words to authenticated;
drop policy if exists banned_words_select on public.banned_words;
create policy banned_words_select on public.banned_words for select to authenticated
  using (org_id is null or (public.is_org_member(org_id) and public.has_entitlement(org_id, 'globalcommerce')));
drop policy if exists banned_words_insert on public.banned_words;
create policy banned_words_insert on public.banned_words for insert to authenticated
  with check (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists banned_words_update on public.banned_words;
create policy banned_words_update on public.banned_words for update to authenticated
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']))
  with check (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists banned_words_delete on public.banned_words;
create policy banned_words_delete on public.banned_words for delete to authenticated
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']));

-- R2 posts: draft 원고의 제목·본문만 사용자 UPDATE(posts_guard). 생성·발행·예약은 서버.
grant select on table public.posts to authenticated;
grant update (title, body_md) on table public.posts to authenticated;
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select to authenticated
  using (public.is_org_member(org_id) and public.has_entitlement(org_id, 'globalcommerce'));
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin', 'member']) and public.has_entitlement(org_id, 'globalcommerce'))
  with check (public.has_org_role(org_id, array['owner', 'admin', 'member']) and public.has_entitlement(org_id, 'globalcommerce'));


-- =====================================================================
-- 함수 EXECUTE 정리
-- 모놀리스: "revoke execute on all functions in schema public" 은 코어 권한까지 지우므로 쓰지 않는다. 함수별로 회수.
-- =====================================================================
do $$
declare s text;
begin
  foreach s in array array[
    'public.gc_features(uuid)', 'public.gc_limit(uuid,text,integer)', 'public.gc_flag(uuid,text)',
    'public.gc_transition_allowed(text,text,text)', 'public.gc_status_guard()', 'public.gc_stamp_creator()',
    'public.gc_market_slot_limit(uuid)', 'public.market_accounts_enforce()', 'public.shipping_templates_validate()',
    'public.products_enforce_quota()', 'public.products_guard()', 'public.detail_pages_guard()',
    'public.gc_assert_compliance(uuid,uuid,uuid,text)', 'public.market_listings_gate()', 'public.market_listings_rollup()',
    'public.export_files_gate()', 'public.gc_acknowledge_compliance_warning(text,uuid,text)',
    'public.gc_apply_product_edits(uuid,uuid,jsonb)', 'public.gc_create_upload_batch(uuid,uuid,uuid[],uuid[],text)',
    'public.gc_release_held_jobs(integer)', 'public.gc_record_step_outcome(uuid,text,text)',
    'public.gc_dashboard_summary(uuid)', 'public.gc_admin_set_plan(uuid,text,text)',
    'public.gc_immutable_row()', 'public.gc_r2_gate()', 'public.posts_guard()', 'public.gc_r3_gate()',
    'public.gc_hybrid_search(uuid,extensions.vector,text,real,jsonb,integer)'] loop
    if to_regprocedure(s) is not null then
      execute format('revoke all on function %s from public, anon, authenticated', s);
      execute format('grant execute on function %s to service_role', s);
    end if;
  end loop;
end $$;
-- 상태 전이 트리거(INVOKER)가 사용자 세션(products 검토, posts 편집)에서 호출한다. 데이터를 읽지 않는 immutable 함수라 무해.
grant execute on function public.gc_transition_allowed(text, text, text) to authenticated;
grant execute on function public.gc_acknowledge_compliance_warning(text, uuid, text) to authenticated;
grant execute on function public.gc_dashboard_summary(uuid) to authenticated;
-- 나머지 RPC(gc_apply_product_edits, gc_create_upload_batch, gc_release_held_jobs, gc_record_step_outcome,
-- gc_admin_set_plan, gc_hybrid_search)는 service_role 전용(위 루프에서 부여).


-- =====================================================================
-- Realtime: 진행률은 public.jobs 로도 받고, 화면 카드 상태는 아래 테이블 변경으로 받는다(RLS 적용)
-- =====================================================================
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['source_imports', 'import_rows', 'products', 'product_images', 'detail_pages',
                             'upload_batches', 'market_listings', 'export_files', 'workflow_runs', 'workflow_run_steps',
                             'videos', 'sns_posts'] loop
      if not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- =====================================================================
-- 끝. 기본 금지어·음원 풀·플랜은 seed.sql. 스케줄(워커 크론, service_role): fx.fetch 평일 11:30 KST,
-- trend.fetch 매일, upload.poll_status 10분, export.expire 매일, 예약 실행(workflow_runs scheduled) 1분.
-- =====================================================================
