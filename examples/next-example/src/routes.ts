import { defineRoutes } from '@hyeonqyu/typed-router-next';
import { z } from 'zod';

/**
 * One declaration, no generics, no currying.
 *
 * The shape mirrors `src/app/` exactly — including the `(account)` route group —
 * so the tree and the file system stay in step.
 */
export const routes = defineRoutes({
  home: {
    _metadata: { title: 'Home', description: 'Everything this example demonstrates' },
  },

  products: {
    _metadata: {
      title: 'Products',
      searchParamsSchema: z.object({
        sort: z.enum(['price-asc', 'price-desc', 'name']).optional(),
        page: z.number().default(1),
        inStock: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      }),
    },

    '[id]': {
      _metadata: { title: 'Product detail' },

      reviews: {
        _metadata: {
          title: 'Reviews',
          searchParamsSchema: z.object({ star: z.number().min(1).max(5).optional() }),
        },
      },
    },
  },

  search: {
    _metadata: {
      title: 'Search',
      // `q` is required, so `searchParams` is required at every call site.
      searchParamsSchema: z.object({
        q: z.string(),
        category: z.enum(['electronics', 'books', 'clothing']).optional(),
      }),
    },
  },

  docs: {
    '[...slug]': { _metadata: { title: 'Docs' } },
  },

  // A route group organises the tree without adding a URL segment:
  // these live at /profile and /orders, not /(account)/profile.
  '(account)': {
    profile: { _metadata: { title: 'Profile' } },
    orders: { _metadata: { title: 'Orders' } },
  },
});

export const { TypedLink, useCurrentRoute, useTypedParams, useTypedPathname, useTypedRouter, useTypedSearchParams } = routes;

export type AppPathname = typeof routes.$types.pathname;
