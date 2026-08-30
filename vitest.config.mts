import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // Resolved to source, not `dist`, so these tests need no prior build — the same
  // choice `tests/tsconfig.json` already makes for the type tests.
  resolve: {
    alias: [
      { find: '@hyeonqyu/typed-router-next/check', replacement: source('./packages/next/src/check.ts') },
      { find: '@hyeonqyu/typed-router-next', replacement: source('./packages/next/src/index.ts') },
      { find: '@hyeonqyu/typed-router-core', replacement: source('./packages/core/src/index.ts') },
    ],
  },
  test: {
    // Narrow on purpose. `tests/*.test-d.ts` are compile-only assertions owned by
    // `tsc -p tests/tsconfig.json`, and `tests/runtime.test.mjs` runs on `node:test`
    // against the built `dist` — neither should be picked up by this runner.
    include: ['tests/**/*.test.ts'],
  },
});
