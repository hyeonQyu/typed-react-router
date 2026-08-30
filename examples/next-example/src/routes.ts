import { defineRoutes } from '@hyeonqyu/typed-router-next';
import { z } from 'zod';

/**
 * One declaration, no generics, no currying.
 *
 * The shape mirrors `src/app/` exactly — including the `(account)` route group —
 * so the tree and the file system stay in step.
 */
export const routes = defineRoutes({
  // The empty key is the root: `app/page.tsx` lives at `/`, so it is declared as `''`
  // and reached as `routes.buildHref('/')`. Without it `/` would be a live route the
  // typed API cannot see — exactly the drift `assertRoutesMatchAppDir` reports.
  '': {
    _metadata: { title: 'Index', description: 'Redirects to /home' },
  },

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
      // `paramSchema` types this one segment; its name comes from the key.
      // `/products/42` reads back as the number 42, and `/products/abc` is rejected.
      _metadata: { title: 'Product detail', paramSchema: z.number() },

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
