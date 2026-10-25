import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RlsDb } from './harness/db.ts';
import { seedDomain, type Fixture } from './harness/fixture.ts';
import { assertResult } from './harness/assert.ts';

let db: RlsDb;
let fx: Fixture;
beforeAll(async () => {
  db = await RlsDb.create();
  fx = await seedDomain(db);
});
afterAll(async () => db.close());

describe('smoke', () => {
  it('owner sees own products only', async () => {
    const r = await db.as('owner', `select org_id from public.products`);
    assertResult(r, { rows: 2 });
    expect(fx.a.org).toBe(db.ids.orgA);
  });
  it('anon denied', async () => {
    assertResult(await db.as('anon', `select 1 from public.products`), 'deny');
  });
  it('viewer update zero', async () => {
    assertResult(await db.as('viewer', `update public.products set memo='x' where id='${fx.a.productId}'`), 'zero');
  });
});
