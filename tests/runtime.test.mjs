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

// --- search param serialisation (issue #3) ------------------------------------

const serial = defineRoutes({
  search: {
    _metadata: {
      title: 'Search',
      searchParamsSchema: z.object({
        f: z.object({ min: z.number(), max: z.number() }).optional(),
        grid: z.array(z.array(z.number())).optional(),
        tags: z.array(z.string()).optional(),
        nums: z.array(z.number()).optional(),
        raw: z.string().optional(),
        n: z.number().optional(),
        since: z.coerce.date().optional(),
        plainDate: z.date().optional(),
      }),
    },
  },
  plain: { _metadata: { title: 'Plain' } },
  item: { '[id]': { _metadata: { title: 'Item' } } },
});

/** Writes the params to a URL, then reads that URL back the way a consumer would. */
const roundTrip = (searchParams) => {
  const href = serial.buildHref('/search', { searchParams });
  return serial.parseSearchParams('/search', new URLSearchParams(href.split('?')[1] ?? ''));
};

test('objects round-trip through buildHref and parseSearchParams', () => {
  assert.equal(
    serial.buildHref('/search', { searchParams: { f: { min: 1, max: 9 } } }),
    '/search?f=%7B%22min%22%3A1%2C%22max%22%3A9%7D',
  );
  assert.deepEqual(roundTrip({ f: { min: 1, max: 9 } }), { f: { min: 1, max: 9 } });
});

test('nested arrays round-trip instead of comma-joining', () => {
  assert.equal(
    serial.buildHref('/search', { searchParams: { grid: [[1, 2], [3]] } }),
    '/search?grid=%5B1%2C2%5D&grid=%5B3%5D',
  );
  assert.deepEqual(roundTrip({ grid: [[1, 2], [3]] }), { grid: [[1, 2], [3]] });
  assert.deepEqual(roundTrip({ grid: [[1, 2]] }), { grid: [[1, 2]] });
});

test('flat primitive arrays keep their existing repeated-key form', () => {
  assert.equal(serial.buildHref('/search', { searchParams: { tags: ['a', 'b'] } }), '/search?tags=a&tags=b');
  assert.equal(serial.buildHref('/search', { searchParams: { nums: [1, 2] } }), '/search?nums=1&nums=2');
  assert.deepEqual(roundTrip({ tags: ['a', 'b'] }), { tags: ['a', 'b'] });
  assert.deepEqual(roundTrip({ nums: [1, 2] }), { nums: [1, 2] });
  assert.deepEqual(roundTrip({ tags: ['solo'] }), { tags: ['solo'] });
});

test('a JSON-shaped string stays a string when the schema asks for one', () => {
  assert.deepEqual(roundTrip({ raw: '{"a":1}' }), { raw: '{"a":1}' });
  assert.deepEqual(roundTrip({ raw: '[1,2]' }), { raw: '[1,2]' });
});

test('values with no faithful text form fail loudly instead of corrupting the URL', () => {
  const cases = [
    [{ n: NaN }, /the number NaN/],
    [{ n: Infinity }, /the number Infinity/],
    [{ f: Symbol('nope') }, /a symbol/],
    [{ f: new Map([['a', 1]]) }, /a Map/],
    [{ f: new Set([1]) }, /a Set/],
    [{ f: () => 1 }, /a function/],
    [{ f: new Date('nonsense') }, /a Date/],
  ];

  for (const [searchParams, message] of cases) {
    assert.throws(() => serial.buildHref('/search', { searchParams }), message);
    assert.throws(() => serial.buildHref('/search', { searchParams }), /cannot be serialised/);
  }
});

test('a cyclic object fails loudly rather than throwing out of JSON.stringify', () => {
  const cyclic = { a: 1 };
  cyclic.self = cyclic;
  assert.throws(() => serial.buildHref('/search', { searchParams: { f: cyclic } }), /cannot be serialised/);
});

test('an unserialisable value inside an array fails loudly too', () => {
  assert.throws(() => serial.buildHref('/search', { searchParams: { nums: [1, NaN] } }), /cannot be serialised/);
});

test('a bigint is written as its decimal form, like a Date is written as ISO', () => {
  assert.equal(serial.buildHref('/plain', { searchParams: { big: 9007199254740993n } }), '/plain?big=9007199254740993');
});

test('a custom toJSON is honoured', () => {
  class Range {
    constructor(min, max) {
      this.min = min;
      this.max = max;
    }
    toJSON() {
      return { min: this.min, max: this.max };
    }
  }
  assert.deepEqual(roundTrip({ f: new Range(1, 9) }), { f: { min: 1, max: 9 } });
});

test('path params reject values a segment cannot carry', () => {
  assert.throws(() => serial.buildHref('/item/[id]', { params: { id: { a: 1 } } }), /route param "id" for "\/item\/\[id\]"/);
  assert.throws(() => serial.buildHref('/item/[id]', { params: { id: NaN } }), /cannot be serialised/);
  assert.equal(serial.buildHref('/item/[id]', { params: { id: 42 } }), '/item/42');
  assert.equal(serial.buildHref('/item/[id]', { params: { id: true } }), '/item/true');
});

test('Date is written as ISO, and z.coerce.date() is what reads it back', () => {
  const since = new Date('2026-08-28T00:00:00.000Z');
  assert.equal(serial.buildHref('/search', { searchParams: { since } }), '/search?since=2026-08-28T00%3A00%3A00.000Z');
  assert.deepEqual(roundTrip({ since }), { since });

  // A plain z.date() field cannot read back a URL typed-router itself produced.
  assert.throws(() => roundTrip({ plainDate: since }), /failed validation/);
});

test('routes without a schema still serialise objects as JSON', () => {
  assert.equal(serial.buildHref('/plain', { searchParams: { f: { a: 1 } } }), '/plain?f=%7B%22a%22%3A1%7D');
});

test('a value that declares its own text form keeps it, as String(value) used to give it', () => {
  class Slug {
    constructor(value) {
      this.value = value;
    }
    toString() {
      return this.value;
    }
  }

  assert.equal(serial.buildHref('/item/[id]', { params: { id: new Slug('hello') } }), '/item/hello');
  assert.equal(serial.buildHref('/plain', { searchParams: { slug: new Slug('hello') } }), '/plain?slug=hello');

  // Boxed primitives declare a text form too.
  assert.equal(serial.buildHref('/plain', { searchParams: { a: new String('hi'), b: new Number(5) } }), '/plain?a=hi&b=5');

  // An object that declares nothing is still refused — `[object Object]` is not a text form.
  assert.throws(() => serial.buildHref('/item/[id]', { params: { id: { a: 1 } } }), /cannot be serialised/);
  assert.throws(() => serial.buildHref('/search', { searchParams: { f: new Map([['a', 1]]) } }), /a Map/);
});

test('toJSON wins over toString, so such an object still round-trips', () => {
  class Range {
    toJSON() {
      return { min: 1, max: 9 };
    }
    toString() {
      return 'range';
    }
  }
  assert.deepEqual(roundTrip({ f: new Range() }), { f: { min: 1, max: 9 } });
});

test('an invalid Date still throws rather than writing its "Invalid Date" text', () => {
  assert.throws(() => serial.buildHref('/search', { searchParams: { since: new Date('nonsense') } }), /a Date/);
  assert.throws(() => serial.buildHref('/item/[id]', { params: { id: new Date('nonsense') } }), /cannot be serialised/);
});
