/**
 * Runtime checks against the built `dist` output — the same code consumers install.
 * Run with: node tests/runtime.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import { defineRoutes } from '../packages/core/dist/index.mjs';
import { toRouteObjects } from '../packages/react/dist/index.mjs';

const routes = defineRoutes({
  home: { _metadata: { title: 'Home' } },
  '(shop)': {
    products: {
      _metadata: {
        title: 'Products',
        searchParamsSchema: z.object({
          sort: z.enum(['price-asc', 'price-desc']).optional(),
          page: z.number().default(1),
          inStock: z.boolean().optional(),
          tags: z.array(z.string()).optional(),
          code: z.string().optional(),
        }),
      },
      '[id]': {
        _metadata: { title: 'Detail' },
        reviews: { _metadata: { title: 'Reviews', searchParamsSchema: z.object({ star: z.number() }) } },
      },
    },
  },
  docs: { '[...slug]': { _metadata: { title: 'Docs' } } },
  files: { '[[...path]]': { _metadata: { title: 'Files' } } },
});

test('pathnames collapse route groups and skip metadata-less nodes', () => {
  assert.deepEqual([...routes.paths].sort(), [
    '/docs/[...slug]',
    '/files/[[...path]]',
    '/home',
    '/products',
    '/products/[id]',
    '/products/[id]/reviews',
  ]);
});

test('buildHref fills dynamic segments and serialises search params', () => {
  assert.equal(routes.buildHref('/home'), '/home');
  assert.equal(routes.buildHref('/products/[id]', { params: { id: 42 } }), '/products/42');
  assert.equal(routes.buildHref('/products/[id]/reviews', { params: { id: 'a b' } }), '/products/a%20b/reviews');
  assert.equal(routes.buildHref('/docs/[...slug]', { params: { slug: ['a', 'b'] } }), '/docs/a/b');
  assert.equal(routes.buildHref('/files/[[...path]]'), '/files');
  assert.equal(routes.buildHref('/products', { searchParams: { page: 2, sort: 'price-asc' } }), '/products?page=2&sort=price-asc');
  assert.equal(routes.buildHref('/products', { searchParams: { tags: ['a', 'b'] } }), '/products?tags=a&tags=b');
  assert.equal(routes.buildHref('/products', { searchParams: { page: 1 }, hash: 'top' }), '/products?page=1#top');
});

test('buildHref refuses to emit a literal [param] placeholder', () => {
  assert.throws(() => routes.buildHref('/products/[id]', {}), /missing route param "id"/);
});

test('match resolves a live URL back to its declared route', () => {
  assert.equal(routes.match('/products/123')?.path, '/products/[id]');
  assert.deepEqual(routes.match('/products/123')?.params, { id: '123' });
  assert.equal(routes.match('/products/123/reviews')?.path, '/products/[id]/reviews');
  assert.equal(routes.match('/products')?.path, '/products');
  assert.deepEqual(routes.match('/docs/a/b/c')?.params, { slug: ['a', 'b', 'c'] });
  assert.equal(routes.match('/files')?.path, '/files/[[...path]]');
  assert.equal(routes.match('/nope'), null);
});

test('static segments outrank dynamic ones', () => {
  const withStatic = defineRoutes({
    products: { '[id]': { _metadata: { title: 'Detail' } }, new: { _metadata: { title: 'New' } } },
  });
  assert.equal(withStatic.match('/products/new')?.path, '/products/new');
  assert.equal(withStatic.match('/products/9')?.path, '/products/[id]');
});

test('search params are coerced to the types the schema declares', () => {
  const parsed = routes.parseSearchParams('/products', { page: '2', inStock: 'true', sort: 'price-asc' });
  assert.deepEqual(parsed, { page: 2, inStock: true, sort: 'price-asc' });
  assert.equal(typeof parsed.page, 'number');
  assert.equal(typeof parsed.inStock, 'boolean');
});

test('a numeric-looking string stays a string when the schema asks for one', () => {
  const parsed = routes.parseSearchParams('/products', { code: '0123' });
  assert.equal(parsed.code, '0123');
  assert.equal(typeof parsed.code, 'string');
});

test('defaults are applied on read', () => {
  assert.equal(routes.parseSearchParams('/products', {}).page, 1);
});

test('a single value satisfies an array schema', () => {
  assert.deepEqual(routes.parseSearchParams('/products', { tags: 'solo' }).tags, ['solo']);
  assert.deepEqual(routes.parseSearchParams('/products', { tags: ['a', 'b'] }).tags, ['a', 'b']);
});

test('repeated keys are folded into an array from URLSearchParams', () => {
  const url = new URLSearchParams('tags=a&tags=b&page=3');
  assert.deepEqual(routes.parseSearchParams('/products', url.entries()), { tags: ['a', 'b'], page: 3 });
});

test('a URLSearchParams object can be passed directly, as the README shows', () => {
  const url = new URLSearchParams('?tags=a&tags=b&page=3&inStock=true');
  assert.deepEqual(routes.parseSearchParams('/products', url), { tags: ['a', 'b'], page: 3, inStock: true });
});

test('onError modes', () => {
  const bad = { star: 'not-a-number' };
  assert.throws(() => routes.parseSearchParams('/products/[id]/reviews', bad), /failed validation/);
  assert.deepEqual(routes.parseSearchParams('/products/[id]/reviews', bad, { onError: 'raw' }), bad);

  // `page` has a default, so dropping the invalid `sort` still yields a valid object.
  const salvaged = routes.parseSearchParams('/products', { sort: 'nonsense', page: '5' }, { onError: 'default' });
  assert.deepEqual(salvaged, { page: 5 });
});

test('routes without a schema pass values through untouched', () => {
  assert.deepEqual(routes.parseSearchParams('/home', { anything: '1' }), { anything: '1' });
});

test('toRouteObjects mirrors the tree as plain React Router data', () => {
  const tree = defineRoutes({
    '(app)': {
      _metadata: { layout: 'AppLayout', errorElement: 'AppError' },
      products: {
        _metadata: { element: 'ProductList', loader: 'productsLoader' },
        '[id]': { _metadata: { element: 'ProductDetail' } },
      },
      docs: { '[...slug]': { _metadata: { element: 'Docs' } } },
    },
  });

  assert.deepEqual(toRouteObjects(tree.routes), [
    {
      element: 'AppLayout',
      errorElement: 'AppError',
      children: [
        {
          path: 'products',
          children: [
            // The node has both a page and children, so its page becomes an index route.
            { index: true, element: 'ProductList', loader: 'productsLoader' },
            { path: ':id', element: 'ProductDetail' },
          ],
        },
        { path: 'docs', children: [{ path: '*', element: 'Docs' }] },
      ],
    },
  ]);
});

test('on a childless node, layout stands in for element but never overrides it', () => {
  const tree = defineRoutes({
    onlyLayout: { _metadata: { layout: 'Layout' } },
    both: { _metadata: { layout: 'Layout', element: 'Page' } },
  });

  assert.deepEqual(toRouteObjects(tree.routes), [
    { path: 'onlyLayout', element: 'Layout' },
    { path: 'both', element: 'Page' },
  ]);
});

test('metadata is readable and route nodes are frozen', () => {
  assert.equal(routes.getMetadata('/products/[id]/reviews').title, 'Reviews');
  assert.equal(Object.isFrozen(routes.routes.home), true);
});
