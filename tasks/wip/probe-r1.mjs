import { readFileSync } from 'node:fs';
const { PGlite } = await import('pglite-vec');
const ext = {};
for (const n of ['pgcrypto', 'citext', 'pg_trgm', 'uuid_ossp']) ext[n] = (await import(`pglite-vec/contrib/${n}`))[n];
ext.vector = (await import('pglite-vec/vector')).vector;
const db = new PGlite({ extensions: ext });
// usage: node smoke-r1.mjs <supabase dir>  — supabase/migrations/*.sql 을 이름순으로, 그 뒤 seed.sql 을 2회(db reset 2회 흉내) 적용한다.
import { readdirSync } from 'node:fs';
const M = process.argv[2];
await db.exec(readFileSync(new URL('./prelude.sql', import.meta.url), 'utf8'));
const migs = readdirSync(`${M}/migrations`).filter(f => f.endsWith('.sql')).sort();
for (const f of migs) await db.exec(readFileSync(`${M}/migrations/${f}`, 'utf8'));
await db.exec(readFileSync(`${M}/seed.sql`, 'utf8'));
for (const f of migs.slice(1)) await db.exec(readFileSync(`${M}/migrations/${f}`, 'utf8'));
await db.exec(readFileSync(`${M}/seed.sql`, 'utf8'));

let pass = 0, fail = 0;
async function run(role, sub, sql) {
  const pre = role === 'owner_db' ? '' :
    `set local role ${role}; select set_config('request.jwt.claim.role','${role}',true); select set_config('request.jwt.claim.sub','${sub ?? ''}',true);`;
  try { await db.exec('begin;'); const r = await db.query(`${pre ? '' : ''}select 1`); 
    if (pre) await db.exec(pre);
    const all = await db.exec(sql); const res = all[all.length - 1]; await db.exec('commit;'); return { rows: res.rows, affected: res.affectedRows };
  } catch (e) { await db.exec('rollback;'); return { code: e.code, msg: e.message }; }
}
const SR = (sql) => run('service_role', null, sql);
const owner = 'aaaaaaaa-0000-4000-8000-000000000001';
await db.exec(`insert into auth.users (id, email) values ('${owner}', 'owner@test.local');`);
const org = (await db.query(`select org_id from public.org_members where user_id='${owner}'`)).rows[0].org_id;
const U = (sql) => run('authenticated', owner, sql);
const show = (n, r) => console.log(n, JSON.stringify(r).slice(0, 300));
// 1 audit actor
show('set_plan', await SR(`select public.gc_admin_set_plan('${org}','pro','운영 테스트 조정')`));
show('audit', await SR(`select actor_id, actor_role from public.audit_log where action='admin.plan_change'`));
// 2 downgrade
for (let i = 1; i <= 3; i++) {
  await SR(`insert into public.encrypted_credentials (id, org_id, app_id, provider, external_account_id, ciphertext, key_version) values ('cccccccc-0000-4000-8000-00000000000${i}','${org}','globalcommerce','coupang_wing','v${i}','x',1)`);
  show('acct' + i, await SR(`insert into public.market_accounts (id, org_id, market, label, credential_id) values ('dddddddd-0000-4000-8000-00000000000${i}','${org}','coupang','계정${i}','cccccccc-0000-4000-8000-00000000000${i}')`));
}
show('downgrade', await SR(`select public.gc_admin_set_plan('${org}','free','다운그레이드')`));
show('active accts after free', await SR(`select count(*)::int c, public.gc_market_slot_limit('${org}') lim from public.market_accounts where status<>'disabled'`));
// 3 banned shadow
show('org shadow word', await U(`insert into public.banned_words (org_id, word, category, severity, action, replacement) values ('${org}','치료','health_food','warn','replace','관리')`));
// 4 failed>rendering
await SR(`select public.gc_admin_set_plan('${org}','pro','x')`);
await SR(`insert into public.products (id, org_id, source, source_ref, title_original) values ('eeeeeeee-0000-4000-8000-000000000001','${org}','manual','m1','p')`);
show('page ins', await SR(`insert into public.detail_pages (id, org_id, product_id, blocks) values ('ffffffff-0000-4000-8000-000000000001','${org}','eeeeeeee-0000-4000-8000-000000000001','[{"type":"hook"},{"type":"features"},{"type":"specs"},{"type":"shipping"}]')`));
show('assembling->failed', await SR(`update public.detail_pages set status='failed' where id='ffffffff-0000-4000-8000-000000000001'`));
show('failed->rendering (verdict null)', await SR(`update public.detail_pages set status='rendering' where id='ffffffff-0000-4000-8000-000000000001'`));
show('rendering->ready', await SR(`update public.detail_pages set status='ready' where id='ffffffff-0000-4000-8000-000000000001'`));
// 5 user brand/attributes banned word
show('user brand/attrs', await U(`update public.products set brand='암 치료 전문가 추천', attributes='{"효능":"항암"}' where id='eeeeeeee-0000-4000-8000-000000000001'`));
// 6 user hard delete product cascades listing history
show('user delete product', await U(`delete from public.products where id='eeeeeeee-0000-4000-8000-000000000001'`));
