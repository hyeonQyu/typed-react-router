# react-router-framework-example

React Router 7 in **framework mode** (`@react-router/dev`), with the route tree from `@hyeonqyu/typed-router-core`.

```bash
yarn workspace react-router-framework-example dev   # http://localhost:5174
```

`packages/react` accepts `react-router-dom ^7.0.0`, which includes framework mode. This app exists so that claim has something behind it rather than a version range.

## The answer

**`toRouteObjects()` is not usable here.** It emits `element` / `Component` — React elements resolved at runtime — while framework mode's `RouteConfigEntry` wants `file`, a module path it resolves at build time so it can code-split each route and generate its types. The two describe the same routes in units the other cannot read. This is a boundary, not a bug: nothing about it is fixable without framework mode giving up build-time route resolution.

**Everything else carries over**, because none of it ever depended on a router:

| still works | shown in |
| --- | --- |
| `routes.paths`, `routes.collected`, `getMetadata` | [`app/routes/home.tsx`](./app/routes/home.tsx) |
| `buildHref`, type-checked against the tree | [`app/root.tsx`](./app/root.tsx) |
| `parseSearchParams` with the route's schema | [`app/routes/products.tsx`](./app/routes/products.tsx) |
| `match` + `parseParams` with `paramSchema` | [`app/routes/product-detail.tsx`](./app/routes/product-detail.tsx) |
| catch-alls keeping their declared name | [`app/routes/docs.tsx`](./app/routes/docs.tsx) |

## How the tree meets the framework

[`src/routes.ts`](./src/routes.ts) declares `file` on `_metadata` where the other examples declare `element`. [`app/routes.ts`](./app/routes.ts) walks the tree with `collectRoutes` and emits `RouteConfigEntry[]` — about fifteen lines, and the route stays declared in one place.

Two consequences worth knowing:

- Import from `@hyeonqyu/typed-router-core`, not the React adapter. Framework mode brings its own `<Link>` and hooks; the adapter's would be a second answer to a question already answered.
- A node with no `file` contributes no entry. Framework mode has nothing to build for a place in the information architecture that names no module.

`tests/framework-mode.test.ts` pins the generated config, so the README's answer above stays true.
