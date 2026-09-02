import { defineRoutes } from '@hyeonqyu/typed-router-core';
import { z } from 'zod';

/**
 * The same kind of tree the other two examples declare — with one difference that is
 * the whole point of this example.
 *
 * Framework mode compiles routes ahead of time: every route is a *module path* it can
 * code-split, load, and generate types for. So a node here declares `file` instead of
 * `element`. Everything else — pathnames, params, search params, metadata — is the
 * ordinary tree, and `@hyeonqyu/typed-router-core` gives it the same typed API.
 *
 * Note this module imports from **core**, not from the React adapter: framework mode
 * has its own `<Link>` and its own hooks, so the adapter's would be a second answer to
 * a question the framework already answers.
 */
export const routes = defineRoutes({
  '': { _metadata: { title: 'Home', file: 'routes/home.tsx' } },

  products: {
    _metadata: {
      title: 'Products',
      file: 'routes/products.tsx',
      searchParamsSchema: z.object({
        sort: z.enum(['price-asc', 'price-desc']).optional(),
        page: z.number().default(1),
      }),
    },

    '[id]': {
      _metadata: { title: 'Product detail', file: 'routes/product-detail.tsx', paramSchema: z.number() },
    },
  },

  docs: {
    '[...slug]': { _metadata: { title: 'Docs', file: 'routes/docs.tsx' } },
  },
});

export type AppPathname = typeof routes.$types.pathname;
