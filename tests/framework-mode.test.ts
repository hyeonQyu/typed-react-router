/**
 * React Router 7 framework mode.
 *
 * `packages/react` accepts `react-router-dom ^7.0.0`, which includes framework mode —
 * a claim worth backing rather than asserting. `examples/react-router-framework-example`
 * is the backing; this pins what it established, so the README's answer stays true.
 */
import { expect, test } from 'vitest';
import routeConfig from '../examples/react-router-framework-example/app/routes';
import { routes } from '../examples/react-router-framework-example/src/routes';

test('the tree builds framework mode s route config, one entry per navigable route', () => {
  expect(routeConfig).toEqual([
    // The empty key names the root, and a root path is what framework mode calls an index.
    { file: 'routes/home.tsx', index: true },
    { file: 'routes/products.tsx', path: 'products' },
    { file: 'routes/product-detail.tsx', path: 'products/:id' },
    { file: 'routes/docs.tsx', path: 'docs/*' },
  ]);
});

test('every entry corresponds to a pathname the tree declared', () => {
  // The bridge cannot invent a route, and cannot lose one that declares a module.
  expect(routeConfig).toHaveLength(routes.paths.length);
});

test('segment syntax is translated, not passed through', () => {
  const paths = routeConfig.map((entry) => entry.path);

  // `[id]` -> `:id` and `[...slug]` -> `*`; no tree syntax survives into the config.
  expect(paths).toContain('products/:id');
  expect(paths).toContain('docs/*');
  expect(paths.some((path) => path?.includes('['))).toBe(false);
});

test('toRouteObjects is the part that does not carry over', async () => {
  // Stated as a test so the README's claim has something holding it up: the adapter
  // describes a route with an `element`, and framework mode's config has no such field —
  // it wants a `file` it can resolve at build time. The two are not interchangeable.
  const { toRouteObjects } = await import('@hyeonqyu/typed-router-react');
  const objects = toRouteObjects(routes.routes);

  for (const object of objects) {
    expect(object).not.toHaveProperty('file');
  }

  // And the framework config carries no element, which is the same gap from the other side.
  for (const entry of routeConfig) {
    expect(entry).not.toHaveProperty('element');
    expect(typeof entry.file).toBe('string');
  }
});
