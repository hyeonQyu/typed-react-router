# typed-router

**English** | [한국어](./README.ko.md)

## When you need this

Route paths and search params are usually just strings — the compiler cannot tell you that `/products/[id]` needs an `id`, or that `?sort=` only accepts three values, or that a page you renamed still has three dangling links pointing at the old path. Those bugs show up at runtime, if they show up at all.

typed-router turns your route map into a single typed object. You declare it once; pathnames, path params, search-param types, navigation, and (for React Router) the router configuration itself are all derived from that one declaration and checked by the compiler.

```bash
npm install @hyeonqyu/typed-router-next zod   # Next.js App Router
npm install @hyeonqyu/typed-router-react zod  # React Router
```

`zod` is optional — only routes that declare a search-param schema need it, and any [Standard Schema](https://standardschema.dev) validator works too.

**Already know your stack?** Each guide is self-contained — read only yours:

- **[Next.js App Router →](./packages/next/README.md)**
- **[React Router →](./packages/react/README.md)**

The rest of this page explains the ideas both guides build on.

## The route tree

A route tree is a nested object. Each key is a URL segment; a node becomes a real, navigable route the moment it has a `_metadata` block:

```ts
// import from '@hyeonqyu/typed-router-next' or '@hyeonqyu/typed-router-react' —
// the declaration below is identical either way.
import { defineRoutes } from '@hyeonqyu/typed-router-next';
import { z } from 'zod';

export const routes = defineRoutes({
  cart: {
    _metadata: { title: 'Cart' },
  },
  products: {
    _metadata: {
      title: 'Products',
      searchParamsSchema: z.object({
        sort: z.enum(['price-asc', 'price-desc']).optional(),
        page: z.number().default(1),
      }),
    },
    '[id]': {
      _metadata: { title: 'Product detail' },
    },
  },
});
```

No generics, no currying, no provider to wrap your app in. The key syntax is borrowed directly from Next.js, so the tree can mirror your `app/` directory one for one:

| key | means |
| --- | --- |
| `products` | a static segment |
| `[id]` | a required dynamic segment |
| `[...slug]` | a required catch-all (one or more segments) |
| `[[...slug]]` | an optional catch-all (zero or more segments) |
| `(group)` | organises the tree without adding a URL segment |
| node with no `_metadata` | namespaces its children but is not itself a destination |

## Type-safe navigation

From that declaration, `routes` derives every pathname (`/products`, `/products/[id]`, `/cart`, …) as a compile-time string union, and — the part that actually catches bugs — ties each pathname to exactly the arguments it needs. `useTypedRouter()` is one of the hooks `routes` gives you; both framework guides show the rest.

```ts
const router = useTypedRouter();

router.push('/products/[id]', { params: { id: 42 } });          // ✅
router.push('/products', { searchParams: { sort: 'price-asc' } }); // ✅
router.push('/cart');                                            // ✅ nothing required

router.push('/products/[id]');            // ❌ params.id is required
router.push('/produtcs');                 // ❌ no such route
router.push('/products', { searchParams: { sort: 'cheap' } });  // ❌ not in the enum
router.push('/products', { searchParams: { pge: 1 } });         // ❌ unknown key
router.push('/cart', { searchParams: { anything: 1 } });        // ❌ /cart declares no schema
router.push('/products', { params: { id: 1 } });                // ❌ no dynamic segments here
```

Path params (`params`) and search params (`searchParams`) are always separate arguments, so it's never ambiguous which one fills the URL and which one fills the query string.

## Reading params back

Reading search params runs your schema for real — values arrive from the URL as strings, so each field's own schema is asked which reading it accepts. A `z.number()` field gets `2`, not `"2"`; a `z.string()` field keeps `"0123"` intact; `.default()` values are filled in.

If a hand-edited URL fails validation, you choose what happens:

```ts
useTypedSearchParams('/search', { onError: 'throw' });   // default — surfaces bad links early
useTypedSearchParams('/search', { onError: 'default' }); // drop bad fields, keep the rest
useTypedSearchParams('/search', { onError: 'raw' });     // skip validation
```

## Route metadata

`_metadata` is inferred per node, so different routes can carry different fields — `title`, `label`, `description` and `accessible` may be plain values or functions of an app context:

```ts
import { resolveMetadata } from '@hyeonqyu/typed-router-core';

const meta = resolveMetadata(routes.getMetadata('/cart'), { locale, userId });
```

Want every node to share one metadata contract instead? Opt in explicitly:

```ts
const routes = defineRoutes.withMeta<{ name: string }, { locale: string }>()({ ... });
```

## Framework-agnostic use

The route tree is plain data. `@hyeonqyu/typed-router-core` exposes the same declaration with no React dependency at all — for scripts, tests, or a sitemap generator — and the `routes` object from either framework package carries these same methods alongside its hooks:

```ts
import { defineRoutes } from '@hyeonqyu/typed-router-core';

const routes = defineRoutes({ /* same shape as above */ });

routes.paths;                        // every declared pathname
routes.buildHref('/products/[id]', { params: { id: 42 } }); // '/products/42'
routes.match('/products/42');        // → { path: '/products/[id]', params: { id: '42' }, node, metadata }
routes.getMetadata('/products');
routes.parseSearchParams('/products', new URLSearchParams(search));
```

## Packages

| package | for |
| --- | --- |
| [`@hyeonqyu/typed-router-core`](./packages/core/README.md) | the tree, types and URL helpers — framework-free |
| [`@hyeonqyu/typed-router-next`](./packages/next/README.md) | Next.js App Router |
| [`@hyeonqyu/typed-router-react`](./packages/react/README.md) | React Router 6/7 |

## Examples

Two runnable apps declare the *same* tree and share component code verbatim — proof that the API is genuinely identical across adapters:

```bash
yarn workspace next-example dev    # http://localhost:3000
yarn workspace react-example dev   # http://localhost:5173
```

## Upgrading from 1.x

2.0 is a breaking rewrite. See [MIGRATION.md](./MIGRATION.md).

## Development

```bash
yarn install
yarn build                         # all packages + both examples
yarn test                          # type tests, including cases that must fail to compile
node --test tests/runtime.test.mjs # runs against the built dist, so build first
yarn lint
```

`tests/core.types.test-d.ts` is half positive assertions and half `@ts-expect-error`, so `yarn test` fails both when something that should compile stops compiling *and* when something that should be rejected starts slipping through.

## License

MIT
