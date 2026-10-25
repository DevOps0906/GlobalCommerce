// tests/rls/harness/db.ts — GC-06-003
//
// PGlite(WASM Postgres) 위에 supabase/migrations/*.sql 을 이름순으로, 그 뒤 supabase/seed.sql 을 적용하고
// Supabase 와 같은 방식으로 역할(anon · authenticated · service_role)과 JWT 클레임(request.jwt.claim.sub/role,
// request.jwt.claims)을 트랜잭션 단위로 바꿔 가며 SQL 을 실행하는 작은 하네스다. Docker 가 없어도 돌아간다.
//
// 실제 Supabase(`supabase test db`, pgTAP) 는 Docker Desktop 에서 나중에 선택적으로 돈다(task-003 확인 위치).
// auth · storage · cron · vault 는 harness/prelude.sql 의 스텁이다.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite, type Extensions } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, '..', '..', '..');
const supabaseDir = join(repoRoot, 'supabase');

/** PGlite 에 없는 확장은 주석으로 바꾼다(gen-types.mjs 와 같은 목록). vector 는 R3 마이그레이션이 들어올 때 로드한다. */
const STUBBED = ['pg_cron', 'pg_net', 'supabase_vault', 'pg_graphql', 'pg_stat_statements', 'pgjwt', 'moddatetime', 'http', 'pgsodium'];
const stubRe = new RegExp(`create\\s+extension\\s+if\\s+not\\s+exists\\s+"?(${STUBBED.join('|')})"?[^;]*;`, 'gi');

export type Persona = 'owner' | 'admin' | 'member' | 'viewer' | 'outsider' | 'anon' | 'ops' | 'service';
/** 매트릭스 축: 06장 GC-06-003 수용 기준의 6역할. */
export const MATRIX_ROLES = ['owner', 'admin', 'member', 'viewer', 'outsider', 'anon'] as const;
export type MatrixRole = (typeof MATRIX_ROLES)[number];

export type SqlResult =
  | { ok: true; rows: Record<string, unknown>[]; affected: number }
  | { ok: false; code: string; message: string };

export interface RunOptions {
  /** true 면 COMMIT, 기본은 ROLLBACK(픽스처를 더럽히지 않는다). */
  commit?: boolean;
}

/** 고정 UUID. 가입 트리거(handle_new_user)가 개인 조직 · owner 멤버십 · free 엔타이틀먼트 · 가입 크레딧을 만든다. */
export const USERS = {
  owner: 'aaaaaaaa-0000-4000-8000-000000000001',
  admin: 'aaaaaaaa-0000-4000-8000-000000000002',
  member: 'aaaaaaaa-0000-4000-8000-000000000003',
  viewer: 'aaaaaaaa-0000-4000-8000-000000000004',
  outsider: 'bbbbbbbb-0000-4000-8000-000000000001',
  ops: 'cccccccc-0000-4000-8000-000000000001',
} as const;

export interface Ids {
  orgA: string; // owner 의 개인 조직 — admin · member · viewer 가 초대로 들어간다
  orgB: string; // outsider 의 개인 조직
  orgC: string; // ops(platform_admin) 의 개인 조직
}

export class RlsDb {
  private constructor(
    readonly db: PGlite,
    readonly ids: Ids,
  ) {}

  static async create(): Promise<RlsDb> {
    const extensions: Extensions = { pgcrypto, citext, pg_trgm, uuid_ossp };
    try {
      const vec = (await import('@electric-sql/pglite/vector')) as { vector: Extensions[string] };
      extensions.vector = vec.vector;
    } catch {
      // pgvector 없는 판. R1 은 vector 를 쓰지 않는다.
    }
    const db = new PGlite({ extensions });
    await db.exec(readFileSync(join(here, 'prelude.sql'), 'utf8'));
    await applyMigrations(db);
    await applySeed(db);
    const ids = await createPersonas(db);
    return new RlsDb(db, ids);
  }

  /** 마이그레이션 · seed 를 한 번 더 적용한다(`supabase db reset` 2회 흉내). 실패하면 throw. */
  async reapplyDomainAndSeed(): Promise<void> {
    await applyMigrations(this.db, { skipFirst: true });
    await applySeed(this.db);
  }

  /** 슈퍼유저(마이그레이션 세션)로 바로 실행. 픽스처 조회용. */
  async raw<T extends Record<string, unknown> = Record<string, unknown>>(sql: string): Promise<T[]> {
    const r = await this.db.query<T>(sql);
    return r.rows;
  }

  /** service_role 로 실행하고 COMMIT (픽스처 생성용). */
  async service(sql: string): Promise<SqlResult> {
    return this.as('service', sql, { commit: true });
  }

  /**
   * 페르소나로 실행. 트랜잭션 안에서 `set local role` + JWT 클레임을 설정하고 마지막 문장의 결과를 돌려준다.
   * 오류는 throw 하지 않고 { ok:false, code } 로 돌려준다(정책 거부는 42501, 트리거는 GC0## 등).
   */
  async as(persona: Persona, sql: string, opts: RunOptions = {}): Promise<SqlResult> {
    const pre = sessionPrelude(persona);
    try {
      await this.db.exec('begin;');
      await this.db.exec(pre);
      const all = await this.db.exec(sql);
      const last = all[all.length - 1];
      await this.db.exec(opts.commit ? 'commit;' : 'rollback;');
      return { ok: true, rows: (last?.rows ?? []) as Record<string, unknown>[], affected: last?.affectedRows ?? 0 };
    } catch (e) {
      await this.db.exec('rollback;');
      const err = e as { code?: string; message?: string };
      return { ok: false, code: err.code ?? 'UNKNOWN', message: err.message ?? String(e) };
    }
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

function sessionPrelude(persona: Persona): string {
  if (persona === 'service') {
    return `set local role service_role;
      select set_config('request.jwt.claim.role', 'service_role', true);
      select set_config('request.jwt.claim.sub', '', true);
      select set_config('request.jwt.claims', '{"role":"service_role"}', true);`;
  }
  if (persona === 'anon') {
    return `set local role anon;
      select set_config('request.jwt.claim.role', 'anon', true);
      select set_config('request.jwt.claim.sub', '', true);
      select set_config('request.jwt.claims', '{"role":"anon"}', true);`;
  }
  const sub = USERS[persona];
  return `set local role authenticated;
    select set_config('request.jwt.claim.role', 'authenticated', true);
    select set_config('request.jwt.claim.sub', '${sub}', true);
    select set_config('request.jwt.claims', '{"role":"authenticated","sub":"${sub}","email":"${persona}@test.local"}', true);`;
}

async function applyMigrations(db: PGlite, opts: { skipFirst?: boolean } = {}): Promise<void> {
  const dir = join(supabaseDir, 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const todo = opts.skipFirst ? files.slice(1) : files;
  for (const f of todo) {
    const sql = readFileSync(join(dir, f), 'utf8').replace(stubRe, '-- stubbed extension $1;');
    await db.exec(sql);
  }
}

async function applySeed(db: PGlite): Promise<void> {
  await db.exec(readFileSync(join(supabaseDir, 'seed.sql'), 'utf8'));
}

/**
 * 05장 10절 페르소나. 가입은 auth.users insert(실제 가입 트리거), 멤버 초대는 실제 RPC(invite_member → accept_invite).
 * ops 는 service_role 로 platform_role 을 바꾼다.
 */
async function createPersonas(db: PGlite): Promise<Ids> {
  const values = (Object.keys(USERS) as (keyof typeof USERS)[])
    .map((k) => `('${USERS[k]}', '${k}@test.local', '{"full_name":"${k}"}'::jsonb)`)
    .join(',');
  await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ${values};`);
  const org = async (user: string) =>
    (await db.query<{ org_id: string }>(`select org_id from public.org_members where user_id = '${user}' and role = 'owner'`)).rows[0]!.org_id;
  const ids: Ids = { orgA: await org(USERS.owner), orgB: await org(USERS.outsider), orgC: await org(USERS.ops) };

  const tmp = new RlsDb(db, ids);
  for (const role of ['admin', 'member', 'viewer'] as const) {
    const inv = await tmp.as('owner', `select public.invite_member('${ids.orgA}', '${USERS[role]}', '${role}')`, { commit: true });
    if (!inv.ok) throw new Error(`invite_member(${role}) failed: ${inv.code} ${inv.message}`);
    const acc = await tmp.as(role, `select public.accept_invite('${ids.orgA}')`, { commit: true });
    if (!acc.ok) throw new Error(`accept_invite(${role}) failed: ${acc.code} ${acc.message}`);
  }
  const ops = await tmp.service(`update public.profiles set platform_role = 'platform_admin' where id = '${USERS.ops}'`);
  if (!ops.ok) throw new Error(`ops promote failed: ${ops.code} ${ops.message}`);
  return ids;
}
