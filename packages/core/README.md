# @hyeonqyu/typed-router-core

The framework-free core of [typed-router](https://github.com/hyeonQyu/typed-router): the route tree, its types, and the URL helpers derived from it.

Most applications should install an adapter instead:

- [`@hyeonqyu/typed-router-next`](https://www.npmjs.com/package/@hyeonqyu/typed-router-next) — Next.js App Router
- [`@hyeonqyu/typed-router-react`](https://www.npmjs.com/package/@hyeonqyu/typed-router-react) — React Router 6/7

Use this package directly when you want the tree without any router — on a server, in a CLI, or in tests:

```ts
import { defineRoutes } from '@hyeonqyu/typed-router-core';
import { z } from 'zod';

const routes = defineRoutes({
  products: {
    _metadata: { searchParamsSchema: z.object({ page: z.number().default(1) }) },
    '[id]': { _metadata: { title: 'Detail' } },
  },
});

routes.paths;                                                   // '/products' | '/products/[id]'
routes.buildHref('/products/[id]', { params: { id: 42 } });     // '/products/42'
routes.match('/products/42');                                   // { path: '/products/[id]', params: { id: '42' }, … }
routes.parseSearchParams('/products', { page: '2' });           // { page: 2 }
```

`zod` is an optional peer dependency — schemas are matched structurally, so Zod v3, Zod v4 and any [Standard Schema](https://standardschema.dev) validator work.

MIT
