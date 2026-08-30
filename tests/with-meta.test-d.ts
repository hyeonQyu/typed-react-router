import { defineRoutes, type RouteMetadataOf } from '@hyeonqyu/typed-router-core';

/**
 * `defineRoutes.withMeta<TMetadata>()` is the opt-in shared contract: every node that
 * declares `_metadata` must satisfy `TMetadata` in full. This file pins down both
 * halves of that promise — the contract is enforced, and per-node literal inference
 * survives it — because either one silently lapsing would look exactly like success.
 */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type AppMeta = { title: string; icon: string };

const routes = defineRoutes.withMeta<AppMeta>()({
  home: { _metadata: { title: 'Home', icon: 'house' } },

  // A node may still carry fields the contract never mentioned…
  products: {
    _metadata: { title: 'Products', icon: 'box', badge: 'new' },
    '[id]': { _metadata: { title: 'Detail', icon: 'tag' } },
  },

  // …and a node that declares no `_metadata` at all is organisational, not a route,
  // so the contract has nothing to enforce on it.
  docs: { '[...slug]': { _metadata: { title: 'Docs', icon: 'book' } } },
});

/** The contract does not flatten metadata to `TMetadata`: each node keeps what it wrote. */
type _titleStaysALiteral = Expect<Equal<RouteMetadataOf<typeof routes, '/home'>['title'], 'Home'>>;
type _extraFieldsSurvive = Expect<Equal<RouteMetadataOf<typeof routes, '/products'>['badge'], 'new'>>;

const productsMeta = routes.getMetadata('/products');
type _readingBackKeepsTheLiteral = Expect<Equal<typeof productsMeta.icon, 'box'>>;

/* Negative cases: the contract is the point, so each of these must fail to compile. */

const missingRequiredField = defineRoutes.withMeta<AppMeta>()({
  // @ts-expect-error — `icon` is required by the contract and this node omits it
  home: { _metadata: { title: 'Home' } },
});

const wrongFieldType = defineRoutes.withMeta<AppMeta>()({
  // @ts-expect-error — `title` is declared `string`, and a number is not one
  home: { _metadata: { title: 1, icon: 'house' } },
});

const missingOnANestedNode = defineRoutes.withMeta<AppMeta>()({
  products: {
    _metadata: { title: 'Products', icon: 'box' },
    // @ts-expect-error — nesting does not exempt a node from the contract
    '[id]': { _metadata: { title: 'Detail' } },
  },
});

/** A built-in field keeps its own type alongside the contract's. */
const withBuiltins = defineRoutes.withMeta<AppMeta, { locale: string }>()({
  // `title` comes from `AppMeta`; `accessible` is built in, and may be a function of context.
  home: { _metadata: { title: 'Home', icon: 'house', accessible: (context) => context.locale === 'ko' } },
});

const contextualMissing = defineRoutes.withMeta<AppMeta, { locale: string }>()({
  // @ts-expect-error — the context overload does not relax the contract either
  home: { _metadata: { icon: 'house' } },
});

export type { _extraFieldsSurvive, _readingBackKeepsTheLiteral, _titleStaysALiteral };
export { contextualMissing, missingOnANestedNode, missingRequiredField, productsMeta, routes, withBuiltins, wrongFieldType };
