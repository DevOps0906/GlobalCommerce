// tests/rls/vitest.config.ts — GC-06-003
// 루트에서 `pnpm test:rls` (= vitest run --config tests/rls/vitest.config.ts) 로 실행한다.
// PGlite 는 파일마다 새 인스턴스를 만들고(마이그레이션 + seed 적용에 수 초), 한 파일 안의 테스트는 순서대로 돈다.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ['**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 180_000,
    fileParallelism: false,
    sequence: { concurrent: false },
    reporters: ['default'],
  },
});
