# @hyeonqyu/typed-router-next — agent guide

**Mental model:** the route tree object is the source of truth for the application's information architecture — its pathnames, params, search-param types and metadata. You declare the IA once as a nested object whose keys mirror `src/app/`; pathnames, path params, search-param types, navigation, and route metadata are all *derived* from that declaration and checked by the compiler. Writing a URL string by hand, or keeping a second list of routes anywhere, defeats the entire point of the library.

**One caveat, and it matters.** On the Next.js App Router the tree does not decide which routes *exist* — the `src/app/` directory does. The tree mirrors it by hand, and nothing checks the two agree: delete a page from `app/` and the tree still type-checks its pathname, so a `TypedLink` to it compiles cleanly and 404s at runtime. Add a page to `app/` without declaring it and the route is live but invisible to `routes.paths`. So: **the tree is authoritative for types and metadata; `app/` is authoritative for route existence.** Keep them in step deliberately. (This caveat is specific to Next — on the React Router adapter, `toRouteObjects()` builds the router *from* the tree, so a route cannot exist without being declared.)

Import **everything** from `@hyeonqyu/typed-router-next`. It re-exports the core surface — never add `@hyeonqyu/typed-router-core` to a consumer's dependencies. Peer deps: `next ^13 || ^14 || ^15 || ^16` and `react`/`react-dom` `^16.8 || ^17 || ^18 || ^19`; `zod` is an *optional* peer dep: schemas are matched structurally, so Zod v3/v4 or any [Standard Schema](https://standardschema.dev) validator works, and routes without a query string need no schema at all.

## Setup (the whole thing)

```ts
// src/routes.ts — NO 'use client' here. This module must stay importable from server components.
import { defineRoutes } from '@hyeonqyu/typed-router-next';
import { z } from 'zod';

export const routes = defineRoutes({
  home: { _metadata: { title: 'Home' } },
  products: {
    _metadata: {
      title: 'Products',
      searchParamsSchema: z.object({
        q: z.string().optional(),
        page: z.number().default(1),
        tags: z.array(z.string()).optional(),
      }),
    },
    '[id]': {
      _metadata: { title: 'Product detail' },
      reviews: { _metadata: { title: 'Reviews', searchParamsSchema: z.object({ star: z.number().default(5) }) } },
    },
  },
  docs: { '[...slug]': { _metadata: { title: 'Docs' } } },
  files: { '[[...path]]': { _metadata: { title: 'Files' } } },
  '(account)': { profile: { _metadata: { title: 'Profile' } } }, // route group → lives at /profile
  internal: { stats: { _metadata: { title: 'Stats' } } }, // `internal` itself is NOT a destination
});

export const {
  TypedLink,
  useCurrentRoute,
  useCurrentRouteNode,
  useTypedParams,
  useTypedPathname,
  useTypedRouter,
  useTypedSearchParams,
} = routes;

export type AppPathname = typeof routes.$types.pathname;
// '/home' | '/products' | '/products/[id]' | '/products/[id]/reviews' | '/docs/[...slug]'
// | '/files/[[...path]]' | '/profile' | '/internal/stats'
```

There is no provider, no generic, nothing to mount. Segment keys are Next.js syntax: `products` static, `[id]` dynamic, `[...slug]` catch-all, `[[...path]]` optional catch-all, `(group)` contributes no URL segment. **A node is a navigable destination only when it carries a `_metadata` block** — nodes without one only namespace their children (add `_metadata: {}` to make one navigable).

## Server components — the data half

`routes` is plain data. Use these anywhere a hook cannot run: server components, `generateMetadata`, route handlers, `middleware`.

```tsx
import { redirect } from 'next/navigation';
import { routes } from '@/routes';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params; // Next 15+ only — in Next 13/14 `params` and `searchParams` are plain objects, so drop the `await`
  const raw = await searchParams;

  // Next types values as `string | string[] | undefined`; strip undefined before parsing.
  const clean: Record<string, string | string[]> = Object.fromEntries(
    Object.entries(raw).filter((e): e is [string, string | string[]] => e[1] !== undefined),
  );

  const query = routes.parseSearchParams('/products', clean, { onError: 'default' }); // { q?: string; page: number; tags?: string[] }
  const href = routes.buildHref('/products/[id]/reviews', { params: { id }, searchParams: { star: 5 }, hash: 'top' });

  const matched = routes.match('/products/42?q=x#y'); // { path: '/products/[id]', node, metadata, params: { id: '42' } }
  if (!matched) redirect(routes.buildHref('/home'));

  return <a href={href}>{routes.getMetadata('/products').title}</a>;
}
```

`parseSearchParams` also takes an entries iterable directly: `routes.parseSearchParams('/products', new URLSearchParams(search))`.

## Client components — hooks and links

Every hook needs `'use client'` **in the consuming file** (not in `routes.ts`). `TypedLink` does not: it calls no hooks and wraps `next/link`, so it renders in server components too.

```tsx
'use client';
import { TypedLink, useTypedRouter } from '@/routes';

export function Nav() {
  const router = useTypedRouter();

  router.push('/home'); // no args object needed
  router.push('/products/[id]', { params: { id: 42 }, scroll: false });
  router.replace('/products', { searchParams: { q: 'a', page: 2 } });
  router.prefetch('/products/[id]/reviews', { params: { id: 7 }, searchParams: { star: 4 } });
  router.back(); router.forward(); router.refresh();

  return (
    <nav>
      <TypedLink href="/products/[id]" params={{ id: 42 }} className="link" prefetch={false}>Product 42</TypedLink>
      <TypedLink href="/products" searchParams={{ q: 'shoes', page: 2 }} hash="top">Search</TypedLink>
      <TypedLink href="/docs/[...slug]" params={{ slug: ['guide', 'intro'] }}>Docs</TypedLink>
      <TypedLink href="/files/[[...path]]">All files</TypedLink>
      <TypedLink href="/profile">Profile</TypedLink>
    </nav>
  );
}
```

**Reading the current location:**

```tsx
'use client';
import { useCurrentRoute, useCurrentRouteNode, useTypedParams, useTypedPathname } from '@/routes';

export function Info() {
  const pattern = useTypedPathname();          // '/products/[id]' — the DECLARED pattern, or null
  const current = useCurrentRoute();           // { pathname, url, node, metadata, params } — pathname/node/metadata are `null` when nothing matches
  const node = useCurrentRouteNode<'/products/[id]'>(); // no runtime arg; the generic only narrows
  const { id } = useTypedParams('/products/[id]');      // { id: string }
  const { slug } = useTypedParams('/docs/[...slug]');   // { slug: string[] }

  return <p>{pattern} {current.url} {id} {slug.join('/')}</p>; // current.url is the live '/products/42'
}
```

**Search params require a `<Suspense>` boundary** — the hook builds on Next's `useSearchParams`, and without a boundary the build fails with a CSR-bailout error.

```tsx
'use client';
import { Suspense } from 'react';
import { useTypedSearchParams } from '@/routes';

function ProductsView() {
  const { q, page, tags } = useTypedSearchParams('/products', { onError: 'default' });
  return <p>{q} {page} {tags?.length}</p>; // `page` really is the number 2 for ?page=2
}

export default function ProductsPage() {
  return <Suspense fallback={null}><ProductsView /></Suspense>;
}
```

## Shared metadata contract (optional)

```ts
import { defineRoutes, resolveMetadataValue } from '@hyeonqyu/typed-router-next';

type AppMeta = { title: string; roles?: string[] };
type AuthContext = { isAdmin: boolean };

export const metaRoutes = defineRoutes.withMeta<AppMeta, AuthContext>()({
  dashboard: { _metadata: { title: 'Dashboard' } },
  admin: { _metadata: { title: 'Admin', roles: ['owner'], accessible: (ctx) => ctx.isAdmin } },
});

// Builtin resolvable keys — title, label, description, accessible — may be functions of the context.
export const canSeeAdmin = (ctx: AuthContext) => resolveMetadataValue(metaRoutes.getMetadata('/admin').accessible, ctx);

// Nav generated from the tree, never from a hand-written array — enumeration keeps metadata typed.
export const navItems = metaRoutes.collected.map((route) => ({ path: route.path, title: route.metadata.title }));
```

Use `withMeta` **only** when every node must satisfy one contract; plain `defineRoutes` infers each node's metadata individually and keeps custom fields.

## Rules

**Never hand-write a URL.** Pass the declared pattern plus `params`.
```ts
router.push('/products/42');                              // ✗ compile error — not a declared pattern
<TypedLink href={`/products/${id}`}>                      // ✗ compile error
router.push('/products/[id]', { params: { id: 42 } });    // ✓
<TypedLink href="/products/[id]" params={{ id }} />       // ✓
redirect(routes.buildHref('/products/[id]', { params: { id } })); // ✓ server side
```

**Path params go in `params`, never in `searchParams`.** (This compiled in 1.x; it does not in 2.0.)
```ts
router.push('/products/[id]/reviews', { searchParams: { id: 42, star: 4 } });          // ✗
router.push('/products/[id]/reviews', { params: { id: 42 }, searchParams: { star: 4 } }); // ✓
```
`searchParams` is *only* the query string described by `_metadata.searchParamsSchema`; on a route with no schema the key is typed `?: never` and rejected outright.

**A node without `_metadata` is not a destination.**
```ts
router.push('/internal');       // ✗ — `internal` only namespaces `/internal/stats`
<TypedLink href="/files" />     // ✗ — the metadata sits on `[[...path]]`
<TypedLink href="/files/[[...path]]" />                     // ✓ params optional
<TypedLink href="/files/[[...path]]" params={{ path: ['a'] }} /> // ✓
```
Just as in Next's filesystem router, an optional catch-all also serves the bare parent URL — you simply address it by its declared pattern: `buildHref('/files/[[...path]]')` returns `/files`, and `match('/files')` resolves back to `/files/[[...path]]`. What does not exist is a separate `/files` entry in the pathname union, which is why `href="/files"` above is a compile error.

**The link prop is `href`, flat.** Not `to` (React Router), not a nested object (1.x).
```tsx
<TypedLink to="/home" />                                  // ✗
<TypedLink href={{ pathname: '/products', searchParams }} />  // ✗
<TypedLink href="/products" searchParams={{ q: 'books' }} hash="top" /> // ✓
```

**Do not invent a provider or a factory.** There is no `<RoutesProvider>`, no `useAppRoutes()`, no `createAppRoutes<M, C>()(...)`. `export const routes = defineRoutes({...})` at module scope, then import it.

**Do not put `'use client'` in `routes.ts`.** It would drag the tree and its Zod schemas into the client bundle. Put it on the files that call hooks or render `TypedLink`. Conversely, never call `useTypedRouter` / `useTypedSearchParams` / `useTypedParams` / `useCurrentRoute` from a server component.

**Search-param parsing throws by default.** A stale or hand-edited `?page=abc` will crash the component.
```ts
useTypedSearchParams('/products');                          // onError: 'throw' → SearchParamsParseError
useTypedSearchParams('/products', { onError: 'default' });  // drop invalid fields, keep schema defaults
useTypedSearchParams('/products', { onError: 'raw' });      // on failure, return the coerced values instead of throwing
useTypedSearchParams('/products', { onError: 'ignore' });   // ✗ not a valid mode
```
`onError` is the only option key. Catch with `error instanceof SearchParamsParseError`.

**Only call `useTypedSearchParams` on routes that declare a `searchParamsSchema`.** Without one the output type resolves to `never` and the runtime values are uncoerced raw strings.

**`useTypedPathname()` returns the pattern, not the URL.** `useTypedPathname()` → `/products/[id]`; `useCurrentRoute().url` → `/products/42`. String-comparing the former against a live URL silently never matches.

**`useTypedParams(pathname)`'s argument is a type key only.** It is never read at runtime — it returns the *current* route's params. Pass the pathname of the route the component actually renders on, or you get correct data under a wrong type with no error.

**Never re-declare routes elsewhere.** No `type AppRoute = '/home' | ...`, no `paths.ts` of constants, no hand-written nav array. Derive: `typeof routes.$types.pathname` or `Pathname<typeof routes>` for the union, `routes.paths` for the runtime list, `SearchParams<typeof routes, '/products'>` for a query type, `routes.getMetadata(path)` for titles.

**Two type-helper families, easy to mix up.** `Pathname` / `SearchParams` / `RouteNodeOf` / `RouteMetadataOf` take `typeof routes`; `CurrentRoute<TTree>` / `TypedRoutes<TTree>` / `RouteArgs<TTree, TPath>` take the **tree** (`typeof routes.$types.tree`).

**The tree is frozen.** `routes.routes` is deep-frozen (except `_metadata` objects); runtime mutation no-ops or throws.

**A few core types are not re-exported here.** `ParseSearchParamsOptions`, `RawSearchParams`, `BuildHrefArgs`, `CollectedRoute` and `GetCollectedRoute` (their routes-object-taking counterpart `CollectedRouteOf` **is** re-exported), `GetRouteNode`, `RouteArgsTuple`, `SearchParamsInput/Output`, `RouteTreeInput`, and the `TypedRouter` type are absent from this package's index. `ParseSearchParamsOptions` itself is absent, but its one member type **is** re-exported: write `{ onError?: SearchParamsErrorMode }` rather than inlining the literals. Prefer that, or deriving the shape (`ReturnType<typeof routes.useTypedRouter>`) rather than adding a core dependency.

## API reference

Everything below is a member of the object returned by `defineRoutes`, unless marked *(export)*.

| Name | Signature | Notes |
| --- | --- | --- |
| `defineRoutes` *(export)* | `(tree) => TypedRoutes<TTree>` | Entry point. `.withMeta<TMetadata, TContext>()(tree)` for a shared metadata contract. |
| `TypedLink` | `<TPath>(props: TypedLinkProps<TTree, TPath>) => ReactElement` | Server-safe (no hooks). Wraps `next/link`; forwards every other prop. Props: `href`, `params`, `searchParams`, `hash`. |
| `useTypedRouter()` | `() => { push, replace, prefetch, back, forward, refresh }` | `'use client'`. `push/replace/prefetch(pattern, args?)`; `args` also takes `scroll` (ignored by `prefetch`). |
| `useTypedParams(pattern)` | `(pattern) => PathParamsOutput<TPath>` | `'use client'`. Values are `string` / `string[]`. Argument is a type key only. |
| `useTypedSearchParams(pattern, opts?)` | `(pattern, { onError? }?) => SearchParamsOutput<TTree, TPath>` | `'use client'` + `<Suspense>`. Returns the schema **output** type (defaults applied). |
| `useTypedPathname()` | `() => RoutePaths<TTree> \| null` | `'use client'`. The declared pattern of the current URL. |
| `useCurrentRoute()` | `() => { pathname, url, node, metadata, params }` | `'use client'`. `pathname` / `node` / `metadata` are `null` when the URL matches no declared route; `metadata` is loose `Record<string, unknown>` — narrow it yourself. |
| `useCurrentRouteNode()` | `<TPath>() => GetRouteNode<TTree, TPath> \| null` | `'use client'`. Works on dynamic routes; no runtime argument. |
| `buildHref(pattern, args?)` | `(pattern, args?) => string` | Server-safe. URL-encodes params, `Date` → ISO, objects and nested search params → JSON. Throws on a missing required param, and on any value it cannot serialise faithfully. |
| `parseSearchParams(pattern, raw, opts?)` | `(pattern, raw, { onError? }?) => SearchParamsOutput<...>` | Server-safe. `raw` is `Record<string, string \| string[]>` or an entries iterable. |
| `match(url)` | `(url) => { path, node, metadata, params } \| null` | Server-safe. Strips `?`/`#`, decodes params, ranks static > dynamic > catch-all. |
| `paths` | `readonly RoutePaths<TTree>[]` | Every navigable pathname — sitemaps, nav, enumeration. |
| `collected` | `readonly GetCollectedRoute<TTree>[]` | Navigable routes with compiled segment patterns; each entry keeps its literal `path` and typed `metadata`. |
| `routes` | `TTree` | The declared tree, frozen. |
| `getNode(pattern)` / `getMetadata(pattern)` | `(pattern) => node` / `=> metadata` | Typed per node, so custom `_metadata` fields survive. |
| `$types` | `{ tree; pathname }` | Type-only carrier (empty at runtime). |
| `resolveMetadata` / `resolveMetadataValue` *(export)* | `(metadata \| value, context) => resolved` | Resolves only `title`, `label`, `description`, `accessible`; other fields (e.g. your own `loader`) pass through untouched. |
| `SearchParamsParseError` *(export)* | `class extends Error { cause }` | Thrown under `onError: 'throw'`. |
| `SearchParamsErrorMode` *(type)* | `'throw' \| 'default' \| 'raw'` | The `onError` modes; `ParseSearchParamsOptions` itself is not re-exported. |
| `Pathname<typeof routes>` *(type)* | union of navigable pathnames | Same as `typeof routes.$types.pathname`. |
| `SearchParams<typeof routes, TPath>` *(type)* | parsed query type of one route | |
| `RouteNodeOf` / `RouteMetadataOf` *(type)* | `<typeof routes, TPath>` | Node / `_metadata` behind one pathname. |
| `CollectedRouteOf` *(type)* | `<typeof routes, TPath?>` | The `collected` element union; pass a pathname to pick one entry. |
| `RouteArgs<TTree, TPath>` *(type)* | `params & searchParams & { hash? }` | The rule behind every call site; absent kinds are typed `?: never`. |
| `PathParams` / `PathParamsOutput` *(type)* | `<TPath>` | What you *write* (`string \| number`) vs. what you *read back* (`string`). |
| `NavigateArgs` / `NavigateArgsTuple` / `NavigateOptions` *(type)* | Next-specific navigation args | `NavigateOptions = { scroll?: boolean }`. |
| `BuiltinMetadata` / `RouteMetadata` / `MetadataValue` / `AnySchema` / `RouteMatch` / `RoutePaths` *(type)* | core types, re-exported | `AnySchema` is structural — that is why `zod` stays optional. |
| `matchRoute` / `collectRoutes` / `isRouteGroup` / `METADATA_KEY` / `toSearchParamsString` *(export)* | low-level core utilities | App code should use `routes.match` / `routes.paths` instead. |
