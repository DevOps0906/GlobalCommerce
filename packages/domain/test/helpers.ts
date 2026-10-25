import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** 저장소 루트 기준 파일 읽기(정본 문서 · SQL 대조용). */
export const REPO_ROOT = resolve(import.meta.dirname, "../../..");

export function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

/** SQL `in ('a', 'b')` 목록 → 배열 */
export function parseSqlInList(list: string): string[] {
  return [...list.matchAll(/'([^']*)'/g)].map((m) => m[1] as string);
}
