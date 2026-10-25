// tests/rls/harness/fixture.ts — GC-06-003
// 매트릭스 테스트용 도메인 픽스처. service_role(워커 · 서버 경로)로 조직 A(owner 조직)와 조직 B(outsider 조직)에
// R1 23개 표 모두에 최소 1행씩 넣는다. 트리거(한도 · 상태 전이 · 게이트)를 그대로 지나므로 상태는 정상 흐름을 따른다.

import type { RlsDb } from './db.ts';
import { USERS } from './db.ts';

export interface OrgFixture {
  org: string;
  credentialId: string;
  marketAccountId: string;
  importId: string;
  importRowId: string;
  productId: string; // title pass · approved · 상세페이지 ready · 등록 대기 listing
  product2Id: string; // collected 상태(검토 흐름용)
  imageId: string;
  revisionId: number;
  activityId: number;
  detailPageId: string;
  marketImageId: string;
  batchId: string;
  listingId: string;
  exportId: string;
  runId: string;
  stepId: string;
  shippingTemplateId: string;
  audioTrackId: string;
  bannedWordId: string;
  slotAddonId: string;
}

export interface Fixture {
  a: OrgFixture;
  b: OrgFixture;
  fxRateId: number;
  trendId: number;
  seasonId: number;
}

const BLOCKS = `'[{"type":"hook"},{"type":"features","items":[1,2,3]},{"type":"specs"},{"type":"shipping"}]'::jsonb`;

async function must(db: RlsDb, sql: string): Promise<Record<string, unknown>[]> {
  const r = await db.service(sql);
  if (!r.ok) throw new Error(`fixture failed: ${r.code} ${r.message}\n${sql}`);
  return r.rows;
}

async function seedOrg(db: RlsDb, org: string, tag: string, ownerId: string): Promise<OrgFixture> {
  // tag 는 uuid 의 앞 8자리로 쓰여 조직별로 고정 id 를 만든다(a1a1a1a1 / b2b2b2b2).
  const u = (n: number) => `${tag}-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const f: OrgFixture = {
    org,
    credentialId: u(1),
    marketAccountId: u(2),
    importId: u(3),
    importRowId: u(4),
    productId: u(5),
    product2Id: u(6),
    imageId: u(7),
    revisionId: 0,
    activityId: 0,
    detailPageId: u(8),
    marketImageId: u(9),
    batchId: u(10),
    listingId: u(11),
    exportId: u(12),
    runId: u(13),
    stepId: u(14),
    shippingTemplateId: u(15),
    audioTrackId: u(16),
    bannedWordId: u(17),
    slotAddonId: u(18),
  };

  await must(db, `
    insert into public.encrypted_credentials (id, org_id, app_id, provider, external_account_id, ciphertext, key_version)
      values ('${f.credentialId}', '${org}', 'globalcommerce', 'coupang_wing', 'vendor-${tag}', 'ENCRYPTED-${tag}', 1);
    insert into public.market_accounts (id, org_id, market, label, credential_id, vendor_id, key_hint, created_by)
      values ('${f.marketAccountId}', '${org}', 'coupang', '쿠팡 1호점', '${f.credentialId}', 'vendor-${tag}', 'AB12', '${ownerId}');
    insert into public.source_imports (id, org_id, source, input_kind, total_rows, created_by)
      values ('${f.importId}', '${org}', 'ownerclan', 'excel', 2, '${ownerId}');
    update public.source_imports set status = 'running' where id = '${f.importId}';
    update public.source_imports set status = 'completed', collected_rows = 2 where id = '${f.importId}';
    insert into public.import_rows (id, org_id, import_id, row_no, source_ref, status)
      values ('${f.importRowId}', '${org}', '${f.importId}', 1, 'OC-${tag}-1', 'collected');
    insert into public.products (id, org_id, source, source_ref, import_id, title_original, title_ai, title_verdict, title_checked_at,
                                 cost_krw, sell_price_krw, status, created_by)
      values ('${f.productId}', '${org}', 'ownerclan', 'OC-${tag}-1', '${f.importId}', '원본 상품명 1', '캠핑 의자', 'pass', now(),
              30000, 59000, 'review', '${ownerId}');
    update public.products set status = 'approved' where id = '${f.productId}';
    insert into public.products (id, org_id, source, source_ref, import_id, title_original, status, created_by)
      values ('${f.product2Id}', '${org}', 'ownerclan', 'OC-${tag}-2', '${f.importId}', '원본 상품명 2', 'collected', '${ownerId}');
    insert into public.product_images (id, org_id, product_id, kind, position, storage_path, status)
      values ('${f.imageId}', '${org}', '${f.productId}', 'original', 1, '${org}/globalcommerce/images/${tag}-1.jpg', 'ready');
    insert into public.title_revisions (org_id, product_id, revision_no, title, origin, verdict)
      values ('${org}', '${f.productId}', 1, '캠핑 의자', 'ai', 'pass');
    insert into public.product_activities (org_id, product_id, kind, message, created_by)
      values ('${org}', '${f.productId}', 'imported', '수집 완료', '${ownerId}');
    insert into public.shipping_templates (id, org_id, name, template_type, notice_text, created_by)
      values ('${f.shippingTemplateId}', '${org}', '위탁 기본', 'domestic_dropship', '국내 위탁 배송 상품입니다.', '${ownerId}');
    insert into public.detail_pages (id, org_id, product_id, status, blocks, shipping_template_id, verdict, verdict_checked_at, created_by)
      values ('${f.detailPageId}', '${org}', '${f.productId}', 'draft', ${BLOCKS}, '${f.shippingTemplateId}', 'pass', now(), '${ownerId}');
    update public.detail_pages set status = 'confirmed' where id = '${f.detailPageId}';
    update public.detail_pages set status = 'rendering' where id = '${f.detailPageId}';
    update public.detail_pages set status = 'ready', html_content = '<section>ok</section>' where id = '${f.detailPageId}';
    insert into public.market_images (id, org_id, detail_page_id, market, kind, part_no, storage_path, width, height, format)
      values ('${f.marketImageId}', '${org}', '${f.detailPageId}', 'coupang', 'thumbnail', 1, '${org}/globalcommerce/market/${tag}-t.jpg', 500, 500, 'jpeg');
    insert into public.upload_batches (id, org_id, product_ids, account_ids, total_count, idempotency_key, created_by)
      values ('${f.batchId}', '${org}', array['${f.productId}']::uuid[], array['${f.marketAccountId}']::uuid[], 1, 'upload:${tag}:1', '${ownerId}');
    insert into public.market_listings (id, org_id, product_id, market_account_id, market, detail_page_id, batch_id, created_by)
      values ('${f.listingId}', '${org}', '${f.productId}', '${f.marketAccountId}', 'coupang', '${f.detailPageId}', '${f.batchId}', '${ownerId}');
    insert into public.export_files (id, org_id, kind, product_ids, created_by)
      values ('${f.exportId}', '${org}', 'zip', array['${f.productId}']::uuid[], '${ownerId}');
    insert into public.workflow_runs (id, org_id, pipeline, name, steps_total, created_by)
      values ('${f.runId}', '${org}', 'products.process', '상품 가공', 1, '${ownerId}');
    insert into public.workflow_run_steps (id, org_id, run_id, position, node_key, node_type, label)
      values ('${f.stepId}', '${org}', '${f.runId}', 1, 'title', 'title.generate', '상품명 생성');
    insert into public.audio_tracks (id, org_id, title, source, storage_path, mime_type, created_by)
      values ('${f.audioTrackId}', '${org}', '내 음원', 'upload', '${org}/globalcommerce/audio/${tag}.mp3', 'audio/mpeg', '${ownerId}');
    insert into public.banned_words (id, org_id, word, category, severity, action, replacement, created_by)
      values ('${f.bannedWordId}', '${org}', '완치-${tag}', 'general', 'fail', 'replace', '케어', '${ownerId}');
    insert into public.slot_addons (id, org_id, quantity, unit_price_krw, status, created_by)
      values ('${f.slotAddonId}', '${org}', 1, 5000, 'pending', '${ownerId}');
    insert into public.notification_prefs (org_id, user_id, channel, event) values ('${org}', '${ownerId}', 'email', 'run_failed');
    insert into public.saved_views (org_id, user_id, screen, name) values ('${org}', '${ownerId}', 'products', '내 보기');
  `);
  const rev = await must(db, `select id from public.title_revisions where product_id = '${f.productId}'`);
  f.revisionId = Number(rev[0]!.id);
  const act = await must(db, `select id from public.product_activities where product_id = '${f.productId}'`);
  f.activityId = Number(act[0]!.id);
  return f;
}

export async function seedDomain(db: RlsDb): Promise<Fixture> {
  const a = await seedOrg(db, db.ids.orgA, 'a1a1a1a1', USERS.owner);
  const b = await seedOrg(db, db.ids.orgB, 'b2b2b2b2', USERS.outsider);
  const fx = await must(db, `insert into public.fx_rates (currency, rate_krw, rate_date) values ('USD', 1384.5, current_date) returning id`);
  const tr = await must(
    db,
    `insert into public.trend_keywords (keyword, period_start, period_end) values ('캠핑 의자', current_date - 7, current_date) returning id`,
  );
  const se = await must(db, `insert into public.season_picks (pick_date, rank, keyword, growth_pct) values (current_date, 1, '캠핑 의자', 12.5) returning id`);
  return { a, b, fxRateId: Number(fx[0]!.id), trendId: Number(tr[0]!.id), seasonId: Number(se[0]!.id) };
}
