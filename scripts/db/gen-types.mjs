#!/usr/bin/env node
// scripts/db/gen-types.mjs — GC-06-002
//
// `supabase gen types typescript --local` 대체 생성기.
// Docker 없이 PGlite(WASM Postgres)로 supabase/migrations/*.sql 을 이름순으로 적용한 뒤 카탈로그를 읽어
// apps/web/types/supabase.ts 를 Supabase CLI 와 같은 모양(Database → public → Tables/Views/Functions/Enums/CompositeTypes,
// 표마다 Row/Insert/Update/Relationships)으로 쓴다. 결정적(같은 입력 → 같은 출력)이라 CI 에서 `--check` 로 비교할 수 있다.
//
// 사용:
//   node scripts/db/gen-types.mjs                      # apps/web/types/supabase.ts 갱신
//   node scripts/db/gen-types.mjs --check              # 파일과 생성 결과가 다르면 종료 코드 1
//   node scripts/db/gen-types.mjs --out <path> --migrations <dir>
//
// 의존: @electric-sql/pglite (devDependency, 루트 package.json — GC-06-001 에 요청). 다른 위치의 모듈을 쓰려면
//   PGLITE_MODULE=/abs/path/node_modules/@electric-sql/pglite 를 준다.
// Docker Desktop 이 있으면 정본 명령 `supabase gen types typescript --local > apps/web/types/supabase.ts` 를 쓴다.
// 두 결과가 다르면 CLI 결과가 이긴다(이 스크립트는 __InternalSupabase.PostgrestVersion 과 SetofOptions 를 쓰지 않는다).
//
// 아래 "Supabase 스텁"은 로컬 검증용이다. auth/storage/cron/vault 는 실제 Supabase 가 만드는 객체를 흉내만 낸다.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

const argv = process.argv.slice(2);
function flag(name, dflt) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : dflt;
}
const migrationsDir = resolve(repoRoot, flag('--migrations', 'supabase/migrations'));
const outPath = resolve(repoRoot, flag('--out', 'apps/web/types/supabase.ts'));
const checkOnly = argv.includes('--check');

// ---------------------------------------------------------------------
// PGlite 로드
// ---------------------------------------------------------------------
async function loadPglite() {
  const spec = process.env.PGLITE_MODULE;
  const entry = spec ? pathToFileURL(join(spec, 'dist', 'index.js')).href : '@electric-sql/pglite';
  const contrib = (n) => (spec ? pathToFileURL(join(spec, 'dist', 'contrib', `${n}.js`)).href : `@electric-sql/pglite/contrib/${n}`);
  const { PGlite } = await import(entry);
  const extensions = {};
  for (const n of ['pgcrypto', 'citext', 'pg_trgm', 'uuid_ossp']) {
    extensions[n] = (await import(contrib(n)))[n];
  }
  try {
    const vecEntry = spec ? pathToFileURL(join(spec, 'dist', 'vector', 'index.js')).href : '@electric-sql/pglite/vector';
    extensions.vector = (await import(vecEntry)).vector;
  } catch {
    // pgvector 가 없는 PGlite 판. R3(product_embeddings) 마이그레이션이 들어오면 vector 를 지원하는 판이 필요하다.
  }
  return new PGlite({ extensions });
}

const PRELUDE = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='supabase_admin') THEN CREATE ROLE supabase_admin NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='supabase_auth_admin') THEN CREATE ROLE supabase_auth_admin NOLOGIN; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, phone text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb, raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  is_anonymous boolean DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.role', true), '') $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS $$ SELECT auth.jwt()->>'email' $$;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.buckets (id text PRIMARY KEY, name text, public boolean DEFAULT false, file_size_limit bigint,
  allowed_mime_types text[], owner uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text REFERENCES storage.buckets(id),
  name text, owner uuid, owner_id text, metadata jsonb, path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), last_accessed_at timestamptz DEFAULT now());
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
$$ SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
CREATE OR REPLACE FUNCTION storage.filename(name text) RETURNS text LANGUAGE sql IMMUTABLE AS
$$ SELECT (string_to_array(name, '/'))[array_length(string_to_array(name, '/'),1)] $$;
CREATE OR REPLACE FUNCTION storage.extension(name text) RETURNS text LANGUAGE sql IMMUTABLE AS
$$ SELECT reverse(split_part(reverse(name), '.', 1)) $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN CREATE PUBLICATION supabase_realtime; END IF; END $$;
CREATE SCHEMA IF NOT EXISTS cron;
CREATE TABLE IF NOT EXISTS cron.job (jobid bigserial PRIMARY KEY, jobname text UNIQUE, schedule text, command text);
CREATE OR REPLACE FUNCTION cron.schedule(job_name text, schedule text, command text) RETURNS bigint LANGUAGE sql AS
$$ INSERT INTO cron.job(jobname, schedule, command) VALUES (job_name, schedule, command)
   ON CONFLICT (jobname) DO UPDATE SET schedule=excluded.schedule, command=excluded.command RETURNING jobid $$;
CREATE OR REPLACE FUNCTION cron.unschedule(job_name text) RETURNS boolean LANGUAGE sql AS $$ DELETE FROM cron.job WHERE jobname=job_name RETURNING true $$;
CREATE SCHEMA IF NOT EXISTS vault;
CREATE TABLE IF NOT EXISTS vault.secrets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE, secret text, description text, created_at timestamptz DEFAULT now());
CREATE OR REPLACE VIEW vault.decrypted_secrets AS SELECT id, name, secret AS decrypted_secret, description FROM vault.secrets;
CREATE OR REPLACE FUNCTION vault.create_secret(new_secret text, new_name text DEFAULT NULL, new_description text DEFAULT '') RETURNS uuid LANGUAGE sql AS
$$ INSERT INTO vault.secrets(name, secret, description) VALUES (new_name, new_secret, new_description) RETURNING id $$;
GRANT USAGE ON SCHEMA auth, storage, extensions TO anon, authenticated, service_role;
GRANT SELECT ON auth.users TO service_role;
`;

// PGlite 에 없는 확장은 주석으로 바꾼다(스키마 타입에는 영향 없음). vector 는 확장이 로드됐을 때만 실제로 만든다.
const STUBBED = ['pg_cron', 'pg_net', 'supabase_vault', 'pg_graphql', 'pg_stat_statements', 'pgjwt', 'moddatetime', 'http', 'pgsodium'];

// ---------------------------------------------------------------------
// 타입 매핑 (postgres-meta typescript 템플릿과 같은 규칙)
// ---------------------------------------------------------------------
const SCALAR = {
  bool: 'boolean',
  int2: 'number', int4: 'number', int8: 'number', float4: 'number', float8: 'number', numeric: 'number', oid: 'number',
  bytea: 'string', bpchar: 'string', varchar: 'string', date: 'string', text: 'string', citext: 'string',
  time: 'string', timetz: 'string', timestamp: 'string', timestamptz: 'string', uuid: 'string', vector: 'string',
  interval: 'string', inet: 'string', cidr: 'string', macaddr: 'string', money: 'string', name: 'string', regclass: 'string',
  regprocedure: 'string', tsvector: 'string', tsquery: 'string', xml: 'string', char: 'string',
  json: 'Json', jsonb: 'Json',
  void: 'undefined',
  record: 'Record<string, unknown>',
};

function makeTypeMapper(ctx) {
  // ctx: { enumsByOid, compositesByOid, tablesByOid, viewsByOid, arrayElemByOid, typnameByOid }
  return function tsType(typeOid) {
    const elem = ctx.arrayElemByOid.get(typeOid);
    if (elem) return `${tsType(elem)}[]`;
    if (ctx.enumsByOid.has(typeOid)) return `Database["public"]["Enums"][${JSON.stringify(ctx.enumsByOid.get(typeOid))}]`;
    if (ctx.compositesByOid.has(typeOid)) return `Database["public"]["CompositeTypes"][${JSON.stringify(ctx.compositesByOid.get(typeOid))}]`;
    if (ctx.tablesByOid.has(typeOid)) return `Database["public"]["Tables"][${JSON.stringify(ctx.tablesByOid.get(typeOid))}]["Row"]`;
    if (ctx.viewsByOid.has(typeOid)) return `Database["public"]["Views"][${JSON.stringify(ctx.viewsByOid.get(typeOid))}]["Row"]`;
    const name = ctx.typnameByOid.get(typeOid);
    return SCALAR[name] ?? 'unknown';
  };
}

// ---------------------------------------------------------------------
// 카탈로그 조회
// ---------------------------------------------------------------------
async function introspect(db) {
  const q = async (sql) => (await db.query(sql)).rows;

  const types = await q(`
    select t.oid::int as oid, t.typname, t.typtype, t.typelem::int as typelem, t.typrelid::int as typrelid,
           n.nspname, c.relkind
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    left join pg_class c on c.oid = t.typrelid
    where t.typisdefined`);
  const typnameByOid = new Map(), arrayElemByOid = new Map(), enumsByOid = new Map(), compositesByOid = new Map();
  const tablesByOid = new Map(), viewsByOid = new Map();
  for (const t of types) {
    typnameByOid.set(t.oid, t.typname);
    if (t.typelem && t.typname.startsWith('_')) arrayElemByOid.set(t.oid, t.typelem);
    if (t.nspname === 'public' && t.typtype === 'e') enumsByOid.set(t.oid, t.typname);
    if (t.nspname === 'public' && t.typtype === 'c' && t.relkind === 'c') compositesByOid.set(t.oid, t.typname);
    if (t.nspname === 'public' && t.typtype === 'c' && (t.relkind === 'r' || t.relkind === 'p')) tablesByOid.set(t.oid, t.typname);
    if (t.nspname === 'public' && t.typtype === 'c' && (t.relkind === 'v' || t.relkind === 'm')) viewsByOid.set(t.oid, t.typname);
  }
  const tsType = makeTypeMapper({ enumsByOid, compositesByOid, tablesByOid, viewsByOid, arrayElemByOid, typnameByOid });

  const rels = await q(`
    select c.oid::int as oid, c.relname, c.relkind
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
    order by c.relname`);

  const cols = await q(`
    select a.attrelid::int as relid, a.attname, a.atttypid::int as typid, a.attnotnull, a.attidentity, a.attgenerated,
           (select true from pg_attrdef d where d.adrelid = a.attrelid and d.adnum = a.attnum) as has_default
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm') and a.attnum > 0 and not a.attisdropped
    order by a.attrelid, a.attname`);
  const colsByRel = new Map();
  for (const c of cols) {
    if (!colsByRel.has(c.relid)) colsByRel.set(c.relid, []);
    colsByRel.get(c.relid).push(c);
  }

  const fks = await q(`
    select con.conname, con.conrelid::int as relid, rc.relname as ref_relname,
           (select array_agg(a.attname order by k.ord) from unnest(con.conkey) with ordinality k(attnum, ord)
              join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum) as cols,
           (select array_agg(a.attname order by k.ord) from unnest(con.confkey) with ordinality k(attnum, ord)
              join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.attnum) as ref_cols,
           exists (select 1 from pg_constraint u where u.conrelid = con.conrelid and u.contype in ('p', 'u')
                   and u.conkey <@ con.conkey and con.conkey <@ u.conkey) as is_one_to_one
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_class rc on rc.oid = con.confrelid
    where con.contype = 'f' and n.nspname = 'public'
    order by con.conrelid, con.conname`);
  const fksByRel = new Map();
  for (const f of fks) {
    if (!fksByRel.has(f.relid)) fksByRel.set(f.relid, []);
    fksByRel.get(f.relid).push(f);
  }

  const updatableViews = new Set((await q(`
    select table_name from information_schema.views where table_schema = 'public' and is_updatable = 'YES'`)).map((r) => r.table_name));

  const funcs = await q(`
    select p.oid::int as oid, p.proname, p.prorettype::int as rettype, p.proretset, p.pronargs, p.pronargdefaults,
           p.proargmodes, p.proargnames,
           (select array_agg(t::int) from unnest(coalesce(p.proallargtypes, p.proargtypes::oid[])) t) as argtypes,
           rt.typname as rettypname, rn.nspname as retnsp
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_type rt on rt.oid = p.prorettype
    join pg_namespace rn on rn.oid = rt.typnamespace
    where n.nspname = 'public' and p.prokind = 'f'
    order by p.proname, p.oid`);

  const enums = await q(`
    select t.typname, array_agg(e.enumlabel order by e.enumsortorder) as labels
    from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' group by t.typname order by t.typname`);

  const composites = await q(`
    select c.relname, array_agg(a.attname order by a.attnum) as names, array_agg(a.atttypid::int order by a.attnum) as typids
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    where n.nspname = 'public' and c.relkind = 'c' group by c.relname order by c.relname`);

  return { rels, colsByRel, fksByRel, updatableViews, funcs, enums, composites, tsType, tablesByOid, viewsByOid };
}

// ---------------------------------------------------------------------
// 출력
// ---------------------------------------------------------------------
const I = (n) => '  '.repeat(n);
const key = (s) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s) ? s : JSON.stringify(s));

function renderColumnsRow(cols, tsType, forceNullable, depth) {
  return cols.map((c) => `${I(depth)}${key(c.attname)}: ${tsType(c.typid)}${c.attnotnull && !forceNullable ? '' : ' | null'}`).join('\n');
}
function renderColumnsInsert(cols, tsType, depth) {
  return cols.map((c) => {
    if (c.attidentity === 'a' || c.attgenerated === 's') return `${I(depth)}${key(c.attname)}?: never`;
    const optional = !c.attnotnull || c.has_default || c.attidentity === 'd';
    return `${I(depth)}${key(c.attname)}${optional ? '?' : ''}: ${tsType(c.typid)}${c.attnotnull ? '' : ' | null'}`;
  }).join('\n');
}
function renderColumnsUpdate(cols, tsType, depth) {
  return cols.map((c) => {
    if (c.attidentity === 'a' || c.attgenerated === 's') return `${I(depth)}${key(c.attname)}?: never`;
    return `${I(depth)}${key(c.attname)}?: ${tsType(c.typid)}${c.attnotnull ? '' : ' | null'}`;
  }).join('\n');
}
function renderRelationships(fks, depth) {
  if (!fks || fks.length === 0) return `${I(depth)}Relationships: []`;
  const items = fks.map((f) => [
    `${I(depth + 1)}{`,
    `${I(depth + 2)}foreignKeyName: ${JSON.stringify(f.conname)}`,
    `${I(depth + 2)}columns: [${f.cols.map((c) => JSON.stringify(c)).join(', ')}]`,
    `${I(depth + 2)}isOneToOne: ${f.is_one_to_one ? 'true' : 'false'}`,
    `${I(depth + 2)}referencedRelation: ${JSON.stringify(f.ref_relname)}`,
    `${I(depth + 2)}referencedColumns: [${f.ref_cols.map((c) => JSON.stringify(c)).join(', ')}]`,
    `${I(depth + 1)}},`,
  ].join('\n'));
  return `${I(depth)}Relationships: [\n${items.join('\n')}\n${I(depth)}]`;
}

function renderFunction(variants, tsType, meta, depth) {
  // variants: 같은 이름의 오버로드 목록. postgres-meta 는 오버로드를 유니언으로 쓴다.
  const bodies = variants.map((f) => {
    const modes = f.proargmodes ?? Array(f.argtypes?.length ?? 0).fill('i');
    const names = f.proargnames ?? [];
    const types = f.argtypes ?? [];
    const inArgs = [], outCols = [];
    for (let i = 0; i < types.length; i++) {
      const m = modes[i] ?? 'i';
      if (m === 'i' || m === 'b' || m === 'v') inArgs.push({ name: names[i] ?? `arg${i + 1}`, typid: types[i], mode: m });
      if (m === 'o' || m === 'b' || m === 't') outCols.push({ name: names[i] ?? `column${i + 1}`, typid: types[i] });
    }
    const nIn = inArgs.filter((a) => a.mode !== 'v').length;
    const firstDefault = nIn - f.pronargdefaults;
    const argLines = inArgs.map((a, i) => `${I(depth + 2)}${key(a.name)}${i >= firstDefault ? '?' : ''}: ${tsType(a.typid)}`);
    const args = inArgs.length === 0 ? `${I(depth + 1)}Args: Record<PropertyKey, never>` : `${I(depth + 1)}Args: {\n${argLines.join('\n')}\n${I(depth + 1)}}`;

    let ret;
    if (outCols.length > 0 && f.rettypname === 'record') {
      // returns table (...) / OUT 인자
      const lines = outCols.map((c) => `${I(depth + 2)}${key(c.name)}: ${tsType(c.typid)}`);
      ret = `{\n${lines.join('\n')}\n${I(depth + 1)}}${f.proretset ? '[]' : ''}`;
    } else {
      ret = `${tsType(f.rettype)}${f.proretset ? '[]' : ''}`;
    }
    return `{\n${args}\n${I(depth + 1)}Returns: ${ret}\n${I(depth)}}`;
  });
  return bodies.length === 1 ? bodies[0] : bodies.join(` | `);
}

function render(meta) {
  const { rels, colsByRel, fksByRel, updatableViews, funcs, enums, composites, tsType } = meta;
  const out = [];
  out.push(`export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {`);
  const tables = rels.filter((r) => r.relkind === 'r' || r.relkind === 'p');
  const views = rels.filter((r) => r.relkind === 'v' || r.relkind === 'm');
  if (tables.length === 0) out.push(`      [_ in never]: never`);
  for (const t of tables) {
    const cols = colsByRel.get(t.oid) ?? [];
    out.push(`      ${key(t.relname)}: {
        Row: {
${renderColumnsRow(cols, tsType, false, 5)}
        }
        Insert: {
${renderColumnsInsert(cols, tsType, 5)}
        }
        Update: {
${renderColumnsUpdate(cols, tsType, 5)}
        }
${renderRelationships(fksByRel.get(t.oid), 4)}
      }`);
  }
  out.push(`    }
    Views: {`);
  if (views.length === 0) out.push(`      [_ in never]: never`);
  for (const v of views) {
    const cols = colsByRel.get(v.oid) ?? [];
    const upd = updatableViews.has(v.relname);
    out.push(`      ${key(v.relname)}: {
        Row: {
${renderColumnsRow(cols, tsType, true, 5)}
        }${upd ? `
        Insert: {
${cols.map((c) => `${I(5)}${key(c.attname)}?: ${tsType(c.typid)} | null`).join('\n')}
        }
        Update: {
${cols.map((c) => `${I(5)}${key(c.attname)}?: ${tsType(c.typid)} | null`).join('\n')}
        }` : ''}
        Relationships: []
      }`);
  }
  out.push(`    }
    Functions: {`);
  // 트리거 함수는 PostgREST 로 호출할 수 없어 CLI 도 내지 않는다.
  const callable = funcs.filter((f) => f.rettypname !== 'trigger' && f.rettypname !== 'event_trigger' && !/^internal$|^language_handler$|^fdw_handler$/.test(f.rettypname));
  const byName = new Map();
  for (const f of callable) {
    if (!byName.has(f.proname)) byName.set(f.proname, []);
    byName.get(f.proname).push(f);
  }
  if (byName.size === 0) out.push(`      [_ in never]: never`);
  for (const [name, variants] of [...byName.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    out.push(`      ${key(name)}: ${renderFunction(variants, tsType, meta, 3)}`);
  }
  out.push(`    }
    Enums: {`);
  if (enums.length === 0) out.push(`      [_ in never]: never`);
  for (const e of enums) out.push(`      ${key(e.typname)}: ${e.labels.map((l) => JSON.stringify(l)).join(' | ')}`);
  out.push(`    }
    CompositeTypes: {`);
  if (composites.length === 0) out.push(`      [_ in never]: never`);
  for (const c of composites) {
    out.push(`      ${key(c.relname)}: {
${c.names.map((n, i) => `${I(4)}${key(n)}: ${tsType(c.typids[i])} | null`).join('\n')}
      }`);
  }
  out.push(`    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {${enums.length === 0 ? '' : '\n' + enums.map((e) => `      ${key(e.typname)}: [${e.labels.map((l) => JSON.stringify(l)).join(', ')}],`).join('\n') + '\n   '}},
  },
} as const
`);
  return out.join('\n');
}

// ---------------------------------------------------------------------
// main
// ---------------------------------------------------------------------
async function main() {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  if (files.length === 0) throw new Error(`no migrations in ${migrationsDir}`);
  const db = await loadPglite();
  await db.exec(PRELUDE);
  const stubRe = new RegExp(`create\\s+extension\\s+if\\s+not\\s+exists\\s+"?(${STUBBED.join('|')})"?[^;]*;`, 'gi');
  for (const f of files) {
    let sql = readFileSync(join(migrationsDir, f), 'utf8').replace(stubRe, '-- stubbed extension $1;');
    try {
      await db.exec(sql);
    } catch (e) {
      throw new Error(`${f}: ${e.message}`);
    }
  }
  const meta = await introspect(db);
  await db.close();

  const header = `// 생성물 — 직접 고치지 않는다 (GC-06-002).
// 정본 명령: supabase gen types typescript --local > apps/web/types/supabase.ts  (Docker Desktop 필요)
// 대체 명령: node scripts/db/gen-types.mjs  (PGlite 로 supabase/migrations 를 적용해 같은 모양으로 생성)
// 입력: ${files.join(', ')}
`;
  const body = header + render(meta);

  if (checkOnly) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '';
    if (current !== body) {
      console.error(`gen-types: ${outPath} 가 스키마와 다르다. node scripts/db/gen-types.mjs 로 다시 생성한다.`);
      process.exit(1);
    }
    console.log('gen-types: up to date');
    return;
  }
  writeFileSync(outPath, body);
  const nTables = meta.rels.filter((r) => r.relkind === 'r' || r.relkind === 'p').length;
  const nViews = meta.rels.length - nTables;
  console.log(`gen-types: wrote ${outPath} (tables ${nTables}, views ${nViews}, functions ${new Set(meta.funcs.filter((f) => f.rettypname !== 'trigger').map((f) => f.proname)).size}, enums ${meta.enums.length})`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(2);
});
