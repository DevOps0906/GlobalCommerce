// tests/rls/harness/assert.ts — GC-06-003
// 결과 기대값 표기. 매트릭스 표를 짧게 쓰기 위한 것이다.
//   'ok'     : 성공(행 수 · 영향 행 수는 보지 않음)
//   'rows'   : 성공 + 1행 이상
//   'zero'   : 성공 + 0행(select) 또는 영향 0행(update/delete) — RLS 가 행을 숨긴 경우
//   'deny'   : 42501 (GRANT 없음 · 정책 with check 위반 · guard_privileged_write · DEFINER 함수의 역할 검사)
//   { code } : 그 SQLSTATE(GC001~GC009, CR000, 22023, 40001, 23514, P0002 ...)
//   { rows } : 성공 + 정확히 n행
//   { affected } : 성공 + 정확히 n행 영향

import { expect } from 'vitest';
import type { SqlResult } from './db.ts';

export type Want = 'ok' | 'rows' | 'zero' | 'deny' | { code: string } | { rows: number } | { affected: number };

export function describeResult(res: SqlResult): string {
  if (!res.ok) return `error ${res.code}: ${res.message.split('\n')[0]}`;
  return `ok rows=${res.rows.length} affected=${res.affected}`;
}

export function assertResult(res: SqlResult, want: Want, label = ''): void {
  const got = describeResult(res);
  const tag = label ? `[${label}] ` : '';
  if (want === 'ok') {
    expect(res.ok, `${tag}expected success, got ${got}`).toBe(true);
    return;
  }
  if (want === 'rows') {
    expect(res.ok && res.rows.length >= 1, `${tag}expected >=1 rows, got ${got}`).toBe(true);
    return;
  }
  if (want === 'zero') {
    expect(res.ok && res.rows.length === 0 && res.affected === 0, `${tag}expected 0 rows/affected, got ${got}`).toBe(true);
    return;
  }
  if (want === 'deny') {
    expect(!res.ok && res.code === '42501', `${tag}expected 42501, got ${got}`).toBe(true);
    return;
  }
  if ('code' in want) {
    expect(!res.ok && res.code === want.code, `${tag}expected ${want.code}, got ${got}`).toBe(true);
    return;
  }
  if ('rows' in want) {
    expect(res.ok && res.rows.length === want.rows, `${tag}expected ${want.rows} rows, got ${got}`).toBe(true);
    return;
  }
  expect(res.ok && res.affected === want.affected, `${tag}expected affected ${want.affected}, got ${got}`).toBe(true);
}
