# @hyeonqyu/typed-router-next

[한국어](./README.ko.md)

Type-safe routing for the Next.js App Router. If you're new to typed-router, [the project overview](../../README.md) covers why it exists and how the route tree works in general — this doc is the complete, Next-specific guide: install → declare → use, nothing else required.

```bash
npm install @hyeonqyu/typed-router-next zod
```

## 1. Declare your tree

Keys are path segments, so the tree mirrors your `src/app/` directory one for one — `[id]`, `[...slug]` and `(group)` mean exactly what they mean in Next.js.

```ts
// routes.ts
import { defineRoutes } from '@hyeonqyu/typed-router-next';
import { z } from 'zod';

export const routes = defineRoutes({
  home: {
    _metadata: { title: 'Home' },
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
  '(account)': {
    // a route group: organises the tree, adds nothing to the URL
    profile: { _metadata: { title: 'Profile' } },
  },
});

export const { TypedLink, useCurrentRoute, useTypedParams, useTypedRouter, useTypedSearchParams } = routes;
```

Your `src/app/` folders — `home/`, `products/`, `products/[id]/`, `(account)/profile/` — stay exactly as Next.js expects. `routes` doesn't render anything; it only describes the shape you already have.

## 2. Navigate

```tsx
'use client';
import { useTypedRouter } from './routes';

function Actions() {
  const router = useTypedRouter();

  router.push('/products/[id]', { params: { id: 42 }, scroll: false }); // Next's `scroll` option, alongside params/searchParams
  router.replace('/products', { searchParams: { sort: 'price-asc' } });
  router.prefetch('/products/[id]', { params: { id: 42 } });
  router.back();
  router.forward();
  router.refresh();
}
```

`push`/`replace`/`prefetch` require exactly the `params` and `searchParams` your tree declares for that pathname — see the project overview for the full list of what does and doesn't compile.

## 3. Link

```tsx
import { TypedLink } from './routes';

<TypedLink href="/products/[id]" params={{ id: 42 }}>Detail</TypedLink>
<TypedLink href="/products" searchParams={{ sort: 'price-asc', page: 2 }} hash="top">Sorted</TypedLink>
```

`TypedLink` wraps `next/link` and forwards every other prop (`className`, `prefetch`, `scroll`, …) untouched.

## 4. Read the current route

```tsx
'use client';
import { useTypedParams, useCurrentRoute } from './routes';

function ProductDetail() {
  const params = useTypedParams('/products/[id]');
  params.id; // string

  const { pathname, url, metadata } = useCurrentRoute();
  // on /products/42 → pathname: '/products/[id]', url: '/products/42'
}
```

A dynamic segment reads back as a `string` unless it says otherwise. Give the segment's node a `paramSchema` — `'[id]': { _metadata: { title: 'Detail', paramSchema: z.number() } }` — and `params.id` is a `number`, validated, with `/products/abc` throwing `PathParamsParseError` instead of flowing in as a bad string. The name comes from the tree key, so the schema is bare rather than an object, and nested routes inherit it. It takes the same `onError` modes as `useTypedSearchParams`.

`useCurrentRouteNode()` and `useTypedPathname()` are also available if you only need the tree node or the declared pattern.

## 5. Read search params — and the Suspense rule

```tsx
'use client';
import { Suspense } from 'react';
import { useTypedSearchParams } from './routes';

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsView />
    </Suspense>
  );
}

function ProductsView() {
  const searchParams = useTypedSearchParams('/products');
  searchParams.page; // number — ?page=2 really is 2 at runtime, not "2"
  searchParams.sort; // 'price-asc' | 'price-desc' | undefined
}
```

`useTypedSearchParams` builds on Next's `useSearchParams`, which opts a page out of static prerendering — Next requires a `<Suspense>` boundary around any component that calls it, the same rule as calling `useSearchParams` directly. Skip the split above and Next's build will tell you exactly where. See [`examples/next-example/src/app/products/page.tsx`](../../examples/next-example/src/app/products/page.tsx) for the full pattern, and the project overview for the `onError` modes this hook accepts.

## 6. Server components and non-hook use

`routes` is plain data, so importing it from a server component is safe. Only the hooks are client-side:

```ts
// app/page.tsx — a server component
import { redirect } from 'next/navigation';
import { routes } from './routes';

export default function Index() {
  redirect(routes.buildHref('/home'));
}
```

Calling a hook like `useTypedSearchParams` from a server component fails exactly the way calling `useSearchParams` there would — the client-only code lives behind its own `'use client'` boundary, so it never leaks into your server bundle just because you imported `routes`.

## Metadata

`title`, `label`, `description` and `accessible` may be plain values or functions of a context object; `resolveMetadata` (from `@hyeonqyu/typed-router-core`, re-exported here) resolves them. See the [project overview](../../README.md#route-metadata) for the full explanation, including `defineRoutes.withMeta`.

## Example

[`examples/next-example`](../../examples/next-example) is a complete app built on this guide — `yarn workspace next-example dev`.

## License

MIT
