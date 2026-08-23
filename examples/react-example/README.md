# react-example

A React Router 7 app built on `@hyeonqyu/typed-router-react`.

```bash
yarn workspace react-example dev
```

It declares the same tree as `next-example` and shares `Nav.tsx` and `RouteInspector.tsx` verbatim — the point being that neither file needs a single change between adapters.

What is specific to this adapter:

- [`src/routes.tsx`](./src/routes.tsx) puts `element` on each node, and `layout` on the `(account)` group.
- [`src/App.tsx`](./src/App.tsx) shows that generation costs no control: `routes.toRouteObjects()` is nested under a hand-written shell and combined with an index redirect and a `*` catch-all that the tree knows nothing about.
- `/home` renders the generated `RouteObject[]` so you can compare it against the tree.
- `/docs/a/b/c` reports `slug`, even though the generated React Router path is `*`.
