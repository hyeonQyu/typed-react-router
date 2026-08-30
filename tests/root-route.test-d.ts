import { defineRoutes, type Pathname } from '@hyeonqyu/typed-router-core';

/**
 * The root route. `app/page.tsx` serves `/`, and the tree declares it with the empty
 * key — a path is built by joining a node's key onto its parent's, so `''` joins to
 * exactly `/`. This file pins that down: without it the root would be a live route
 * the typed API cannot name, which is the drift `assertRoutesMatchAppDir` reports.
 */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const routes = defineRoutes({
  '': { _metadata: { title: 'Index' } },
  home: { _metadata: { title: 'Home' } },
  products: {
    _metadata: { title: 'Products' },
    '[id]': { _metadata: { title: 'Detail' } },
  },
});

type _rootIsPartOfThePathnameUnion = Expect<Equal<Pathname<typeof routes>, '/' | '/home' | '/products' | '/products/[id]'>>;

/** The declared pathname is `/`, not `''` — the key is how you write it, not how you call it. */
const rootHref = routes.buildHref('/');
type _rootHrefIsAString = Expect<Equal<typeof rootHref, string>>;

const rootMetadata = routes.getMetadata('/');
type _rootKeepsItsOwnMetadata = Expect<Equal<typeof rootMetadata.title, 'Index'>>;

// @ts-expect-error — the empty key names the root, so `''` is not itself a pathname
const emptyIsNotAPathname: Pathname<typeof routes> = '';

/**
 * The root key takes no children: `app/page.tsx` is a file, so every other route is its
 * sibling. Nesting under `''` doubles the separator, which matches nothing on disk —
 * pinned here so the shape stays visibly wrong rather than quietly plausible.
 */
const nestedUnderRoot = defineRoutes({
  '': { _metadata: { title: 'Index' }, dashboard: { _metadata: { title: 'Dashboard' } } },
});

type _nestingUnderRootDoublesTheSlash = Expect<Equal<Pathname<typeof nestedUnderRoot>, '/' | '//dashboard'>>;

export type { _nestingUnderRootDoublesTheSlash, _rootHrefIsAString, _rootIsPartOfThePathnameUnion, _rootKeepsItsOwnMetadata };
export { emptyIsNotAPathname, nestedUnderRoot, rootHref, rootMetadata, routes };
