-- =====================================================================
-- seed.sql (모놀리스, GlobalCommerce)
-- 선행: migrations/20261025000001_core_lite.sql, 20261025000002_gc_domain_r1.sql (GC-06-002)
-- 원본: products/supabase/monolith/seed.sql (기획 스냅샷). R2/R3 전용 표를 참조하는 행은 없다(plans.features 의 R2/R3 키는 jsonb 값일 뿐).
-- 정본: products/00_DECISIONS.md GC-D-04(플랜), GC-D-11(금지어), GC-D-12(음원). features 키 해석: 01_PRD.md 플랜 절.
--   가격·크레딧·한도는 nomad-commerce 2026-10-14 가격 판정(platform-docs nomad-commerce seed.sql)과 같다.
--   enterprise 는 nomad-commerce 와 같이 초기 미판매(is_active false).
--   R2/R3 키(shorts_per_month, workflow_canvas, blog, sns, search)의 플랜별 값은 제안(O-05). 값은 01_PRD.md 4.4절과 같고
--   키 이름은 이 파일이 정본이다(01장의 blog_publish/sns_publish/hybrid_search, 04장의 workflow 는 이 이름으로 읽는다).
-- 반복 실행 가능(upsert).
-- =====================================================================

-- 앱 1행. apps 가 정확히 1행이므로 signup_app 메타데이터가 없어도 가입 시 이 앱으로 부트스트랩된다(0001 SECTION 1).
insert into public.apps (id, name, schema_name, signup_policy, status) values
  ('globalcommerce', 'NOMAD AI Factory', 'public', 'open', 'active')
on conflict (id) do update
  set name = excluded.name, schema_name = excluded.schema_name, signup_policy = excluded.signup_policy, status = excluded.status;

-- 플랜 4종(GC-D-04). 월 0/29,000/69,000/149,000원(VAT 포함), 월 크레딧 15/150/350/900, 가입 크레딧 free 30.
--   features 키: products, market_slots, concurrency, excel_export, zip_export, market_api, image_quality,
--                shorts_per_month, workflow_canvas, blog, sns, search
insert into public.plans (app_id, code, name, price_krw, billing_interval, monthly_credits, signup_credits, carry_over, features, is_default, is_active, sort_order) values
  ('globalcommerce', 'free', '무료', 0, 'month', 15, 30, false,
   '{"products": 30, "market_slots": 1, "concurrency": 1, "excel_export": false, "zip_export": true, "market_api": ["coupang", "smartstore"], "image_quality": "draft", "shorts_per_month": 0, "workflow_canvas": false, "blog": false, "sns": false, "search": false}',
   true, true, 0),
  ('globalcommerce', 'starter', '기본', 29000, 'month', 150, 0, false,
   '{"products": 300, "market_slots": 3, "concurrency": 1, "excel_export": true, "zip_export": true, "market_api": ["coupang", "smartstore"], "image_quality": "standard", "shorts_per_month": 30, "workflow_canvas": false, "blog": true, "sns": true, "search": true}',
   false, true, 1),
  ('globalcommerce', 'pro', '프로', 69000, 'month', 350, 0, false,
   '{"products": 2000, "market_slots": 10, "concurrency": 2, "excel_export": true, "zip_export": true, "market_api": ["coupang", "smartstore"], "image_quality": "pro", "shorts_per_month": 100, "workflow_canvas": true, "blog": true, "sns": true, "search": true}',
   false, true, 2),
  ('globalcommerce', 'enterprise', '엔터', 149000, 'month', 900, 0, false,
   '{"products": 10000, "market_slots": 30, "concurrency": 5, "excel_export": true, "zip_export": true, "market_api": ["coupang", "smartstore"], "image_quality": "ultra", "shorts_per_month": 300, "workflow_canvas": true, "blog": true, "sns": true, "search": true}',
   false, false, 3)
on conflict (app_id, code) do update
  set name = excluded.name, price_krw = excluded.price_krw, billing_interval = excluded.billing_interval,
      monthly_credits = excluded.monthly_credits, signup_credits = excluded.signup_credits, carry_over = excluded.carry_over,
      features = excluded.features, is_default = excluded.is_default, is_active = excluded.is_active, sort_order = excluded.sort_order;

-- 크레딧팩(nomad-commerce 와 같은 값)
insert into public.credit_packs (app_id, code, name, credits, price_krw, is_active, sort_order) values
  ('globalcommerce', 'pack_50',  '50 크레딧',  50,  10000, true, 1),
  ('globalcommerce', 'pack_120', '120 크레딧', 120, 23900, true, 2),
  ('globalcommerce', 'pack_200', '200 크레딧', 200, 39900, true, 3)
on conflict (app_id, code) do update
  set name = excluded.name, credits = excluded.credits, price_krw = excluded.price_krw, is_active = excluded.is_active, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------
-- 기본 금지어 사전(org_id null, GC-D-11). 예시 행이며 목록 확정은 법률 검토 뒤(제안).
--   화장품: 디자인 Products.dc.html 의 치환 예시. 건기식: nomad-commerce 기본 사전에서 고름.
--   매칭은 앱 계층(packages/compliance)이 한글 경계를 고려해 수행한다(\b 금지).
-- ---------------------------------------------------------------------
insert into public.banned_words (org_id, word, category, severity, action, replacement, note) values
  (null, '여드름 치료',      'cosmetics',   'fail', 'replace', '피부 고민 케어', '의약품 오인'),
  (null, '주름 개선',        'cosmetics',   'warn', 'replace', '탄력 케어',      '기능성 화장품 심사 없이 표시 불가'),
  (null, '미백',             'cosmetics',   'warn', 'replace', '톤 케어',        '기능성 화장품 심사 없이 표시 불가'),
  (null, '재생',             'cosmetics',   'fail', 'delete',  null,             '의약품 오인'),
  (null, '아토피',           'cosmetics',   'fail', 'delete',  null,             '질병 표현'),
  (null, '피부 치료',        'cosmetics',   'fail', 'delete',  null,             '의약품 오인'),
  (null, '치료',             'health_food', 'fail', 'replace', '관리에 도움을 줄 수 있는', '질병 치료 표현'),
  (null, '효능',             'health_food', 'fail', 'replace', '기능성',         null),
  (null, '수면 개선',        'health_food', 'fail', 'delete',  null,             '개별인정 기능성 외 표시'),
  (null, '항암',             'health_food', 'fail', 'block',   null,             '질병 예방·치료'),
  (null, '혈당 낮추는',      'health_food', 'fail', 'block',   null,             '질병 예방·치료'),
  (null, '면역력 강화',      'health_food', 'warn', 'replace', '면역 건강에 도움을 줄 수 있는', '인정 기능성 원료일 때만'),
  (null, '전문가 추천',      'general',     'fail', 'delete',  null,             '근거 없는 추천 표현(GC-D-11)'),
  (null, '단순 변심 반품 불가', 'general',  'fail', 'delete',  null,             '전자상거래법 청약철회(GC-D-11)')
on conflict (category, word) where org_id is null do update
  set severity = excluded.severity, action = excluded.action, replacement = excluded.replacement, note = excluded.note;

-- ---------------------------------------------------------------------
-- 기본 제공 음원 풀(org_id null, GC-D-12) 자리 표시. 파일은 운영자가 org-files/defaults/globalcommerce/audio/ 에 올린 뒤
-- 워커(ffprobe)가 duration_ms 와 file_status = 'available' 로 바꾼다. 그전에는 'missing' 이라 랜덤 선택에서 빠진다.
-- 실제 풀은 40곡(디자인 Settings.dc.html "기본 제공 40"), 아래는 5곡 예시. 라이선스 확인 전에는 공개하지 않는다.
-- ---------------------------------------------------------------------
insert into public.audio_tracks (id, org_id, title, source, mood_tags, storage_path, file_status, license_note)
select v.id::uuid, null, v.title, 'default', v.tags, v.path, 'missing', '라이선스 확인 전(자리 표시)'
from (values
  ('00000000-0000-4000-8000-0000000a0001', 'Morning Camp Acoustic', array['밝음', '어쿠스틱'], 'defaults/globalcommerce/audio/morning-camp-acoustic.mp3'),
  ('00000000-0000-4000-8000-0000000a0002', 'Cozy Kitchen Beat',     array['경쾌함', '로파이'],  'defaults/globalcommerce/audio/cozy-kitchen-beat.mp3'),
  ('00000000-0000-4000-8000-0000000a0003', 'Calm Living Room',      array['잔잔함', '피아노'],  'defaults/globalcommerce/audio/calm-living-room.mp3'),
  ('00000000-0000-4000-8000-0000000a0004', 'Bright Unboxing',       array['밝음', '팝'],        'defaults/globalcommerce/audio/bright-unboxing.mp3'),
  ('00000000-0000-4000-8000-0000000a0005', 'Winter Warmth',         array['따뜻함', '잔잔함'],  'defaults/globalcommerce/audio/winter-warmth.mp3')
) as v(id, title, tags, path)
on conflict (id) do update
  set title = excluded.title, mood_tags = excluded.mood_tags, storage_path = excluded.storage_path;
