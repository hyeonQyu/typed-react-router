import type { Pathname, PathParams, RouteMetadataOf, SearchParams } from '@hyeonqyu/typed-router-core';
import { routes, type Routes } from './fixtures';

/**
 * Compile-time assertions. `Expect<...>` only accepts `true`, and every
 * `@ts-expect-error` below fails the build if the error it predicts stops happening —
 * so `tsc --noEmit` passing means both halves of this file hold.
 */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

/* ────────────────────────────────────────────────────────────────────────────
 * 1. Pathname union — route groups collapse, metadata-less nodes are excluded
 * ────────────────────────────────────────────────────────────────────────── */

type AllPaths = Pathname<Routes>;

type _pathnameUnion = Expect<
  Equal<
    AllPaths,
    | '/home'
    | '/products'
    | '/products/[id]'
    | '/products/[id]/reviews'
    | '/cart'
    | '/search'
    | '/docs/[...slug]'
    | '/files/[[...path]]'
    | '/internal/stats'
  >
>;

// @ts-expect-error — route groups do not contribute a URL segment
const groupPath: AllPaths = '/(shop)/products';

// @ts-expect-error — `internal` has no `_metadata`, so it is not a destination itself
const organisationalPath: AllPaths = '/internal';

/* ────────────────────────────────────────────────────────────────────────────
 * 2. Path params — typed per segment kind, optional only for optional catch-alls
 * ────────────────────────────────────────────────────────────────────────── */

type _dynamicParam = Expect<Equal<PathParams<'/products/[id]/reviews'>, { id: string | number }>>;
type _catchAllParam = Expect<Equal<PathParams<'/docs/[...slug]'>, { slug: readonly (string | number)[] }>>;
type _optionalCatchAll = Expect<Equal<PathParams<'/files/[[...path]]'>, { path?: readonly (string | number)[] }>>;
type _staticHasNoParams = Expect<Equal<keyof PathParams<'/cart'>, never>>;

/* ────────────────────────────────────────────────────────────────────────────
 * 3. buildHref — params required exactly when the path has dynamic segments
 * ────────────────────────────────────────────────────────────────────────── */

routes.buildHref('/cart');
routes.buildHref('/home');
routes.buildHref('/products/[id]', { params: { id: 42 } });
routes.buildHref('/products/[id]/reviews', { params: { id: 'abc' }, searchParams: { star: 5 } });
routes.buildHref('/docs/[...slug]', { params: { slug: ['a', 'b'] } });
routes.buildHref('/files/[[...path]]', {});
routes.buildHref('/search', { searchParams: { q: 'hi' } });
routes.buildHref('/search', { searchParams: { q: 'hi' }, hash: 'results' });

// @ts-expect-error — `/products/[id]` needs `params.id`
routes.buildHref('/products/[id]');

// @ts-expect-error — `params` is required, not optional, when the path is dynamic
routes.buildHref('/products/[id]', {});

// @ts-expect-error — wrong param name
routes.buildHref('/products/[id]', { params: { productId: 1 } });

// @ts-expect-error — `/cart` has no dynamic segments, so `params` is forbidden
routes.buildHref('/cart', { params: { id: 1 } });

// @ts-expect-error — `/cart` declares no schema, so arbitrary search params are rejected
routes.buildHref('/cart', { searchParams: { junk: 'yes' } });

// @ts-expect-error — `/search` requires `q`
routes.buildHref('/search', { searchParams: {} });

// @ts-expect-error — `q` must be a string
routes.buildHref('/search', { searchParams: { q: 123 } });

// @ts-expect-error — `category` is a closed enum
routes.buildHref('/search', { searchParams: { q: 'hi', category: 'toys' } });

// @ts-expect-error — unknown search param key
routes.buildHref('/search', { searchParams: { q: 'hi', typo: 1 } });

// @ts-expect-error — pathname is not part of the tree
routes.buildHref('/nope');

/* ────────────────────────────────────────────────────────────────────────────
 * 4. Schema input vs output — `.default()` is optional to write, present to read
 * ────────────────────────────────────────────────────────────────────────── */

routes.buildHref('/products', { searchParams: { sort: 'name' } });
routes.buildHref('/products', { searchParams: { page: 2, tags: ['a'], inStock: true } });

type _defaultedIsPresentOnRead = Expect<Equal<SearchParams<Routes, '/products'>['page'], number>>;
type _requiredString = Expect<Equal<SearchParams<Routes, '/search'>['q'], string>>;
type _optionalEnum = Expect<Equal<SearchParams<Routes, '/search'>['category'], 'electronics' | 'books' | undefined>>;
type _nestedSchema = Expect<Equal<SearchParams<Routes, '/products/[id]/reviews'>['star'], number>>;

/* ────────────────────────────────────────────────────────────────────────────
 * 5. Inference survives three levels of nesting behind a route group
 * ────────────────────────────────────────────────────────────────────────── */

const reviewParams = routes.parseSearchParams('/products/[id]/reviews', { star: '5' });
type _parsedShape = Expect<Equal<typeof reviewParams, { star: number }>>;

const reviewsMetadata = routes.getMetadata('/products/[id]/reviews');
type _metadataLiteral = Expect<Equal<(typeof reviewsMetadata)['title'], 'Reviews'>>;
type _metadataViaHelper = Expect<Equal<RouteMetadataOf<Routes, '/products'>['title'], 'Products'>>;

/* ────────────────────────────────────────────────────────────────────────────
 * 6. Runtime surface stays typed
 * ────────────────────────────────────────────────────────────────────────── */

const matched = routes.match('/products/123/reviews');
type _matchIsNullable = Expect<Equal<typeof matched, NonNullable<typeof matched> | null>>;
type _pathsAreTyped = Expect<Equal<(typeof routes.paths)[number], AllPaths>>;

export type {
  _catchAllParam,
  _defaultedIsPresentOnRead,
  _dynamicParam,
  _matchIsNullable,
  _metadataLiteral,
  _metadataViaHelper,
  _nestedSchema,
  _optionalCatchAll,
  _optionalEnum,
  _parsedShape,
  _pathnameUnion,
  _pathsAreTyped,
  _requiredString,
  _staticHasNoParams,
};
export { groupPath, organisationalPath };
