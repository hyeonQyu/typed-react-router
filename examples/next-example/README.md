# next-example

A Next.js App Router app built on `@hyeonqyu/typed-router-next`.

```bash
yarn workspace next-example dev
```

`src/app/` mirrors [`src/routes.ts`](./src/routes.ts) one for one, including the `(account)` route group. Each page prints what the library resolved for the live URL, with the runtime `typeof` next to every value — so the claims in the types are visible, not just asserted.

| page | shows |
| --- | --- |
| `/home` | the derived pathname union, and `buildHref` running in a **server** component |
| `/products` | `?page=2` arriving as a `number` and `?inStock=true` as a `boolean` |
| `/products/42` | path params, and `useCurrentRoute()` resolving `/products/[id]` |
| `/products/42/reviews?star=5` | params and search params three levels deep |
| `/docs/a/b/c` | a catch-all reported under its declared name, `slug` |
| `/search?q=x&category=toys` | `onError: 'default'` dropping only the invalid field |
| `/profile`, `/orders` | route-group keys that never reach the URL |

The `react-example` in this repo declares the same tree and shares `Nav.tsx` and `RouteInspector.tsx` verbatim.
