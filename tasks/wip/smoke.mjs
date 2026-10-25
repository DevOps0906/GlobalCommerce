import { readFileSync } from 'node:fs';
const { PGlite } = await import('pglite-vec');
const ext = {};
for (const n of ['pgcrypto', 'citext', 'pg_trgm', 'uuid_ossp']) ext[n] = (await import(`pglite-vec/contrib/${n}`))[n];
ext.vector = (await import('pglite-vec/vector')).vector;
const db = new PGlite({ extensions: ext });
const M = process.argv[2];
await db.exec(readFileSync(new URL('./prelude.sql', import.meta.url), 'utf8'));
for (const f of ['0001_core_lite.sql', '0002_globalcommerce_domain.sql', 'seed.sql']) await db.exec(readFileSync(`${M}/${f}`, 'utf8'));

let pass = 0, fail = 0;
async function run(role, sub, sql) {
  const pre = role === 'owner_db' ? '' :
    `set local role ${role}; select set_config('request.jwt.claim.role','${role}',true); select set_config('request.jwt.claim.sub','${sub ?? ''}',true);`;
  try { await db.exec('begin;'); const r = await db.query(`${pre ? '' : ''}select 1`); 
    if (pre) await db.exec(pre);
    const all = await db.exec(sql); const res = all[all.length - 1]; await db.exec('commit;'); return { rows: res.rows, affected: res.affectedRows };
  } catch (e) { await db.exec('rollback;'); return { code: e.code, msg: e.message }; }
}
function expect(name, res, want) {
  let ok;
  if (want.code) ok = res.code === want.code;
  else if ('rows' in want) ok = !res.code && res.rows.length === want.rows;
  else if ('affected' in want) ok = !res.code && res.affected === want.affected;
  else ok = !res.code;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : '  got ' + JSON.stringify(res).slice(0, 300)}`);
}
const SR = (sql) => run('service_role', null, sql);
const owner = 'aaaaaaaa-0000-4000-8000-000000000001', outsider = 'bbbbbbbb-0000-4000-8000-000000000002';
await db.exec(`insert into auth.users (id, email) values ('${owner}', 'owner@test.local'), ('${outsider}', 'out@test.local');`);
const org = (await db.query(`select org_id from public.org_members where user_id='${owner}'`)).rows[0].org_id;
const U = (sql) => run('authenticated', owner, sql), O = (sql) => run('authenticated', outsider, sql);
expect('entitlement free', await SR(`select 1 from public.app_entitlements e join public.plans p on p.id=e.plan_id where e.org_id='${org}' and p.code='free'`), { rows: 1 });

// GC002 상품 수
expect('30 products', await SR(`insert into public.products (org_id, source, source_ref, title_original) select '${org}', 'ownerclan', 'OC'||g, '상품'||g from generate_series(1,30) g`), {});
expect('31st product GC002', await SR(`insert into public.products (org_id, source, source_ref, title_original) values ('${org}', 'ownerclan', 'OC31', 'x')`), { code: 'GC002' });
expect('ASIN check', await SR(`delete from public.products where source_ref='OC30'; insert into public.products (org_id, source, source_ref, title_original) values ('${org}', 'amazon', 'bad', 'x')`), { code: '23514' });

// 마켓 슬롯 GC003 + 추가 슬롯
await SR(`insert into public.encrypted_credentials (id, org_id, app_id, provider, external_account_id, ciphertext, key_version) values
  ('cccccccc-0000-4000-8000-000000000001','${org}','globalcommerce','coupang_wing','v1','x',1),
  ('cccccccc-0000-4000-8000-000000000002','${org}','globalcommerce','coupang_wing','v2','x',1)`);
expect('account 1', await SR(`insert into public.market_accounts (id, org_id, market, label, credential_id) values ('dddddddd-0000-4000-8000-000000000001','${org}','coupang','쿠팡 1호점','cccccccc-0000-4000-8000-000000000001')`), {});
expect('account 2 GC003', await SR(`insert into public.market_accounts (org_id, market, label) values ('${org}','coupang','쿠팡 2호점')`), { code: 'GC003' });
expect('addon pending->active', await SR(`insert into public.slot_addons (org_id, quantity) values ('${org}', 1); update public.slot_addons set status='active' where org_id='${org}'`), {});
expect('account 2 after addon', await SR(`insert into public.market_accounts (id, org_id, market, label, credential_id, status) values ('dddddddd-0000-4000-8000-000000000002','${org}','coupang','쿠팡 2호점','cccccccc-0000-4000-8000-000000000002','expired')`), {});
expect('addon skip active->pending GC001', await SR(`update public.slot_addons set status='pending' where org_id='${org}'`), { code: 'GC001' });

// 배송 템플릿 GC006
expect('return 5 days GC006', await U(`insert into public.shipping_templates (org_id, name, return_window_days) values ('${org}','해외',5)`), { code: 'GC006' });
expect('반품 불가 문구 GC006', await U(`insert into public.shipping_templates (org_id, name, notice_text) values ('${org}','해외','단순 변심 반품 불가 상품입니다')`), { code: 'GC006' });
expect('template ok (owner)', await U(`insert into public.shipping_templates (org_id, name, notice_text, auto_attach_overseas) values ('${org}','해외','미국 현지에서 구매해 보내 드리는 상품입니다.', true)`), {});
expect('outsider template update 0 rows', await O(`update public.shipping_templates set name='x' where org_id='${org}'`), { affected: 0 });

// 상품 검토 흐름
const P = (await db.query(`select id from public.products where source_ref='OC1'`)).rows[0].id;
expect('user collected->approved GC001', await U(`update public.products set status='approved' where id='${P}'`), { code: 'GC001' });
expect('user title_ai write 42501', await U(`update public.products set title_ai='x' where id='${P}'`), { code: '42501' });
await SR(`update public.products set status='generating' where id='${P}'; update public.products set status='review', title_ai='캠핑 의자', title_verdict='fail', title_checked_at=now() where id='${P}'`);
expect('approve with fail GC004', await U(`update public.products set status='approved' where id='${P}'`), { code: 'GC004' });
await SR(`update public.products set title_verdict='pass', title_checked_at=now() where id='${P}'`);
expect('approve pass ok', await U(`update public.products set status='approved', sell_price_krw=59000 where id='${P}'`), {});
expect('stale verdict reset', await SR(`update public.products set title_ai='캠핑 의자 2' where id='${P}'; select 1 from public.products where id='${P}' and title_verdict is null`), { rows: 1 });
await SR(`update public.products set title_verdict='pass', title_checked_at=now() where id='${P}'`);
expect('memo insert', await U(`insert into public.product_activities (org_id, product_id, kind, message) values ('${org}','${P}','memo','메모')`), {});
expect('non-memo activity 42501', await U(`insert into public.product_activities (org_id, product_id, kind, message) values ('${org}','${P}','title_saved','x')`), { code: '42501' });

// 상세페이지 GC004/GC005 + RPC
const blocks = `'[{"type":"hook"},{"type":"features","items":[1,2,3]},{"type":"specs"},{"type":"shipping"}]'`;
await SR(`insert into public.detail_pages (id, org_id, product_id, status, blocks) values ('eeeeeeee-0000-4000-8000-000000000001','${org}','${P}','draft',${blocks})`);
const DP = 'eeeeeeee-0000-4000-8000-000000000001';
expect('confirm unchecked GC004', await SR(`update public.detail_pages set status='confirmed' where id='${DP}'`), { code: 'GC004' });
await SR(`update public.detail_pages set verdict='warn', verdict_checked_at=now() where id='${DP}'`);
expect('confirm warn GC005', await SR(`update public.detail_pages set status='confirmed' where id='${DP}'`), { code: 'GC005' });
expect('outsider ack 42501', await O(`select public.gc_acknowledge_compliance_warning('detail_page','${DP}','x')`), { code: '42501' });
expect('owner ack', await U(`select public.gc_acknowledge_compliance_warning('detail_page','${DP}','확인')`), {});
expect('confirm after ack', await SR(`update public.detail_pages set status='confirmed' where id='${DP}'`), {});
expect('edit blocks when confirmed GC001', await SR(`update public.detail_pages set blocks='[]' where id='${DP}'`), { code: 'GC001' });
expect('user write detail_pages 42501', await U(`update public.detail_pages set html_content='x' where id='${DP}'`), { code: '42501' });
await SR(`update public.detail_pages set status='rendering' where id='${DP}'; update public.detail_pages set status='ready' where id='${DP}'`);

// 업로드 게이트
await SR(`insert into public.upload_batches (id, org_id, product_ids, account_ids, total_count) values ('ffffffff-0000-4000-8000-000000000001','${org}', array['${P}']::uuid[], array['dddddddd-0000-4000-8000-000000000001']::uuid[], 1)`);
expect('listing expired key GC009', await SR(`insert into public.market_listings (org_id, product_id, market_account_id, market, detail_page_id) values ('${org}','${P}','dddddddd-0000-4000-8000-000000000002','coupang','${DP}')`), { code: 'GC009' });
expect('listing ok', await SR(`insert into public.market_listings (id, org_id, product_id, market_account_id, market, detail_page_id, batch_id) values ('99999999-0000-4000-8000-000000000001','${org}','${P}','dddddddd-0000-4000-8000-000000000001','coupang','${DP}','ffffffff-0000-4000-8000-000000000001')`), {});
expect('rollup waiting 1', await SR(`select 1 from public.upload_batches where waiting_count=1`), { rows: 1 });
expect('waiting->registered GC001', await SR(`update public.market_listings set status='registered' where id='99999999-0000-4000-8000-000000000001'`), { code: 'GC001' });
expect('sending->registered', await SR(`update public.market_listings set status='sending' where id='99999999-0000-4000-8000-000000000001'; update public.market_listings set status='registered', market_product_id='123', market_url='https://www.coupang.com/vp/products/123' where id='99999999-0000-4000-8000-000000000001'`), {});
expect('rollup registered 1', await SR(`select 1 from public.upload_batches where registered_count=1 and done_count=1`), { rows: 1 });
const P2 = (await db.query(`select id from public.products where source_ref='OC2'`)).rows[0].id;
expect('listing no title check GC004', await SR(`insert into public.market_listings (org_id, product_id, market_account_id, market) values ('${org}','${P2}','dddddddd-0000-4000-8000-000000000001','coupang')`), { code: 'GC004' });
expect('user insert listing 42501', await U(`insert into public.market_listings (org_id, product_id, market_account_id, market) values ('${org}','${P}','dddddddd-0000-4000-8000-000000000001','coupang')`), { code: '42501' });
expect('excel export free GC007', await SR(`insert into public.export_files (org_id, kind, product_ids) values ('${org}','excel', array['${P}']::uuid[])`), { code: 'GC007' });
expect('zip export title unchecked GC004', await SR(`insert into public.export_files (org_id, kind, product_ids) values ('${org}','zip', array['${P2}']::uuid[])`), { code: 'GC004' });
expect('zip export ok', await SR(`insert into public.export_files (org_id, kind, product_ids) values ('${org}','zip', array['${P}']::uuid[])`), {});

// 실행 기록
expect('run + steps', await SR(`insert into public.workflow_runs (id, org_id, pipeline, name) values ('12121212-0000-4000-8000-000000000001','${org}','shorts','숏폼 30초 렌더');
  insert into public.workflow_run_steps (org_id, run_id, position, node_key, node_type, label) values ('${org}','12121212-0000-4000-8000-000000000001',1,'audio_mix','shorts.audio_mix','음원 합성')`), {});
expect('run queued->succeeded GC001', await SR(`update public.workflow_runs set status='succeeded' where id='12121212-0000-4000-8000-000000000001'`), { code: 'GC001' });

// R2/R3 게이트
expect('video free GC007', await SR(`insert into public.videos (org_id, product_id, duration_sec, motion_template, audio_mode) values ('${org}','${P}',30,'zoom_in','random')`), { code: 'GC007' });
expect('workflow free GC007', await SR(`insert into public.workflows (org_id, name) values ('${org}','가을')`), { code: 'GC007' });
expect('embedding free GC007', await SR(`insert into public.product_embeddings (org_id, product_id, content, content_hash, embedding) values ('${org}','${P}','x','h', array_fill(0.1::real, array[1536])::extensions.vector)`), { code: 'GC007' });
await SR(`update public.plans set features = features || '{"search":true,"shorts_per_month":1}' where code='free'`);
expect('embedding ok', await SR(`insert into public.product_embeddings (org_id, product_id, content, content_hash, embedding) values ('${org}','${P}','접이식 캠핑 의자','h', array_fill(0.1::real, array[1536])::extensions.vector)`), {});
expect('hybrid search service', await SR(`select * from public.gc_hybrid_search('${org}', array_fill(0.1::real, array[1536])::extensions.vector, '캠핑', 70, '{"source":"ownerclan"}', 5)`), { rows: 1 });
expect('hybrid search user 42501', await U(`select * from public.gc_hybrid_search('${org}', array_fill(0.1::real, array[1536])::extensions.vector, '캠핑', 0.7, '{}', 5)`), { code: '42501' });
expect('video 1 ok', await SR(`insert into public.videos (org_id, product_id, duration_sec, motion_template, audio_mode) values ('${org}','${P}',30,'zoom_in','random')`), {});
expect('video 2 monthly GC007', await SR(`insert into public.videos (org_id, product_id, duration_sec, motion_template, audio_mode) values ('${org}','${P}',15,'zoom_in','random')`), { code: 'GC007' });

// RLS 교차 조직
for (const t of ['products','market_accounts','detail_pages','market_listings','upload_batches','export_files','workflow_runs','workflow_run_steps','shipping_templates','product_activities','slot_addons'])
  expect(`outsider ${t} 0 rows`, await O(`select 1 from public.${t}`), { rows: 0 });
expect('owner products visible', await U(`select 1 from public.products`), { rows: 30 });
expect('default banned words visible to outsider', await O(`select 1 from public.banned_words where org_id is null`), { rows: 14 });
expect('outsider banned word into org 42501', await O(`insert into public.banned_words (org_id, word, category) values ('${org}','x','general')`), { code: '42501' });
expect('owner org banned word', await U(`insert into public.banned_words (org_id, word, category, action) values ('${org}','완치','general','delete')`), {});
expect('default banned word update 0 rows', await U(`update public.banned_words set word='y' where org_id is null`), { affected: 0 });
expect('fx write 42501', await U(`insert into public.fx_rates (currency, rate_krw, rate_date) values ('USD', 1384.5, current_date)`), { code: '42501' });
expect('fx read', await SR(`insert into public.fx_rates (currency, rate_krw, rate_date) values ('USD', 1384.5, current_date)`), {});
expect('fx read outsider', await O(`select 1 from public.fx_rates`), { rows: 1 });
expect('default audio visible', await O(`select 1 from public.audio_tracks where org_id is null`), { rows: 5 });
expect('audio upload other path 42501', await U(`insert into public.audio_tracks (org_id, title, storage_path) values ('${org}','내 음원','${outsider}/globalcommerce/audio/a.mp3')`), { code: '42501' });
expect('audio upload ok', await U(`insert into public.audio_tracks (org_id, title, storage_path) values ('${org}','Winter Cabin Loop','${org}/globalcommerce/audio/a.mp3')`), {});
expect('notification own', await U(`insert into public.notification_prefs (org_id, channel, event) values ('${org}','email','run_failed')`), {});
expect('notification other user 42501', await U(`insert into public.notification_prefs (org_id, user_id, channel, event) values ('${org}','${outsider}','email','run_failed')`), { code: '42501' });

// 04_API RPC
expect('dashboard owner', await U(`select public.gc_dashboard_summary('${org}')`), { rows: 1 });
expect('dashboard outsider 42501', await O(`select public.gc_dashboard_summary('${org}')`), { code: '42501' });
expect('apply edits user 42501', await U(`select * from public.gc_apply_product_edits('${org}','${owner}','[]')`), { code: '42501' });
const P3 = (await db.query(`select id, updated_at from public.products where source_ref='OC3'`)).rows[0];
expect('apply edits title', await SR(`select * from public.gc_apply_product_edits('${org}','${owner}', jsonb_build_array(jsonb_build_object('product_id','${P3.id}','field','title','value','보온 텀블러','verdict','warn','replaced', '[{"word":"a","to":"b"}]'::jsonb)))`), { rows: 1 });
expect('edit -> review + revision', await SR(`select 1 from public.products p join public.title_revisions r on r.product_id=p.id where p.id='${P3.id}' and p.status='review' and p.banned_replaced_count=1`), { rows: 1 });
expect('apply edits stale 40001', await SR(`select * from public.gc_apply_product_edits('${org}','${owner}', jsonb_build_array(jsonb_build_object('product_id','${P3.id}','field','category','value','x','base_updated_at','2000-01-01T00:00:00Z')))`), { code: '40001' });
expect('ack product warn', await U(`select public.gc_acknowledge_compliance_warning('product','${P3.id}','ok')`), {});
expect('ack no warn 22023', await U(`select public.gc_acknowledge_compliance_warning('product','${P}','ok')`), { code: '22023' });
expect('upload batch no detail page GC001', await SR(`select public.gc_create_upload_batch('${org}','${owner}', array['${P3.id}']::uuid[], array['dddddddd-0000-4000-8000-000000000001']::uuid[], 'req-1')`), { code: 'GC001' });
expect('upload batch skip registered', await SR(`select public.gc_create_upload_batch('${org}','${owner}', array['${P}']::uuid[], array['dddddddd-0000-4000-8000-000000000001']::uuid[], 'req-2') ->> 'skipped_registered' as s`), { rows: 1 });
expect('upload batch replay', await SR(`select 1 where (public.gc_create_upload_batch('${org}','${owner}', array['${P}']::uuid[], array['dddddddd-0000-4000-8000-000000000001']::uuid[], 'req-2') ->> 'replayed')::boolean`), { rows: 1 });
expect('upload batch expired account GC009', await SR(`select public.gc_create_upload_batch('${org}','${owner}', array['${P}']::uuid[], array['dddddddd-0000-4000-8000-000000000002']::uuid[], 'req-3')`), { code: 'GC009' });
await SR(`insert into public.workflow_run_steps (org_id, run_id, position, node_key, node_type, label) values
  ('${org}','12121212-0000-4000-8000-000000000001',2,'render','shorts.encode','mp4 렌더링'),
  ('${org}','12121212-0000-4000-8000-000000000001',3,'handoff','sns.handoff','SNS 업로드로 넘기기');
  update public.workflow_runs set steps_total=3 where id='12121212-0000-4000-8000-000000000001'`);
const S1 = (await db.query(`select id from public.workflow_run_steps where node_key='audio_mix'`)).rows[0].id;
expect('step failed', await SR(`select public.gc_record_step_outcome('${S1}','failed','음원 파일을 찾을 수 없어 멈췄습니다.')`), {});
expect('run failed + downstream skipped', await SR(`select 1 from public.workflow_runs w where w.id='12121212-0000-4000-8000-000000000001' and w.status='failed' and (select count(*) from public.workflow_run_steps s where s.run_id=w.id and s.status='skipped')=2`), { rows: 1 });
expect('held jobs release', await SR(`insert into public.jobs (org_id, app_id, queue, job_type, run_after) select '${org}','globalcommerce','gc.ai','title.generate','infinity' from generate_series(1,3);
  select public.gc_release_held_jobs(10) as n`), {});
expect('released exactly concurrency 1', await SR(`select 1 from public.jobs where run_after < 'infinity' and job_type='title.generate' having count(*)=1`), { rows: 1 });
expect('admin set plan', await SR(`select public.gc_admin_set_plan('${org}','pro','운영 테스트 조정')`), {});
expect('plan is pro', await SR(`select 1 where public.entitled_plan_code('${org}','globalcommerce')='pro'`), { rows: 1 });
expect('excel export pro ok', await SR(`insert into public.export_files (org_id, kind, market, product_ids) values ('${org}','excel','playauto', array['${P}']::uuid[])`), {});
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
