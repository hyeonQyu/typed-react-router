# Migrating from 1.x to 2.0

2.0 is a breaking rewrite. The route tree you already wrote survives almost unchanged; what changes is how you declare it and how you navigate.

## Why it changed

1.x had four problems that could not be fixed compatibly:

- **Dynamic segments were invisible to the type system.** `router.push('/products/[id]')` compiled and navigated to the literal string `/products/[id]`.
- **Routes without a schema accepted anything.** The fallback was `Record<string, unknown>`, so `router.push('/cart', { searchParams: { junk: 'yes' } })` type-checked.
- **`useTypedSearchParams` never ran the schema.** It cast raw URL strings, so a field typed `number` held `"2"` at runtime.
- **`useCurrentRouteNode()` returned `undefined` on every dynamic route**, because it looked up the live URL (`/products/123`) in a tree keyed by `[id]`.

## Declaring routes

```diff
-const { useTypedRouter, TypedLink } = createAppRoutes<
-  { name: string; title?: string },
-  { locale: string; userId: string | null }
->()({
+export const routes = defineRoutes({
   products: {
     _metadata: {
-      name: 'products',
       title: 'Products',
-      href: ({ locale }) => `/${locale}/products`,
       searchParamsSchema: z.object({ page: z.number().optional() }),
     },
     '[id]': { _metadata: { title: 'Detail' } },
   },
 });
+
+export const { TypedLink, useTypedRouter, useTypedSearchParams, useTypedParams } = routes;
```

- **No generics, no currying.** Metadata is inferred per node, so different routes can carry different fields. To keep a shared contract, use `defineRoutes.withMeta<TMetadata, TContext>()({ ... })`.
- **`title` / `label` / `description` / `accessible` now accept plain values** as well as functions of a context. Resolve the function form with `resolveMetadata(metadata, context)`.
- **`_metadata.href` is gone.** The pathname is derived from the tree; a metadata field that competed with it only created two sources of truth.
- **Nodes without `_metadata` are no longer destinations.** They still namespace their children. Add `_metadata: {}` if you want such a node to be navigable.
- **`(group)` keys are new.** They organise the tree without contributing a URL segment.

## Navigating

Path params and search params are now separate, and `params` is required when the path has dynamic segments.

```diff
-router.push('/products/[id]', { searchParams: { id: 42, page: 2 } });
+router.push('/products/[id]', { params: { id: 42 }, searchParams: { page: 2 } });

-<TypedLink href={{ pathname: '/search', searchParams: { q: 'books' } }}>
+<TypedLink href="/search" searchParams={{ q: 'books' }}>
```

`TypedLink` props are flat, and the React adapter uses `href` instead of `to` so the same markup works in both.

Expect new compile errors where 1.x was silently permissive — a missing `id`, or search params on a route that declares no schema. Those are the bugs 2.0 exists to catch.

## Reading the current route

```diff
-const searchParams = useTypedSearchParams('/products');   // values were strings
+const searchParams = useTypedSearchParams('/products');   // values match the schema
+const params = useTypedParams('/products/[id]');          // new: path params

-const node = useCurrentRouteNode();          // undefined on dynamic routes
+const node = useCurrentRouteNode();          // works
+const { pathname, url, metadata, params } = useCurrentRoute();   // new
```

`useTypedPathname()` now returns the **declared** pattern (`/products/[id]`), not the live URL. Use `useCurrentRoute().url` for the live one.

Because the schema actually runs now, an invalid URL throws by default. Pick a softer mode if users hand-edit URLs:

```ts
useTypedSearchParams('/search', { onError: 'default' });   // drop bad fields, keep the rest
```

## Removed

| 1.x | 2.0 |
| --- | --- |
| `createAppRoutes<M, C>()({...})` | `defineRoutes({...})` |
| `AppRoutesProvider` / `useAppRoutes()` | not needed — `routes` is a module-level object |
| `_types.AppRoutesPathname` | `Pathname<typeof routes>` or `typeof routes.$types.pathname` |
| `_metadata.href` | derive from the tree, or `routes.buildHref(...)` |
| `getPathnameFromNode(node)` | `routes.match(url)` / `routes.paths` |
| `@hyeonqyu/typed-router-core/routes.utils` subpath | the main entry |

The provider existed to hand out a static object through context; dropping it removes a setup step without losing anything.

## New in React Router

`routes.toRouteObjects()` builds your React Router configuration from the same tree — see the README. If you would rather keep writing `<Route>` by hand, ignore it; nothing else depends on it.
