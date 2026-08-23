import { defineRoutes } from '@hyeonqyu/typed-router-core';
import { z } from 'zod';

/**
 * The tree every type test shares. It deliberately mixes the awkward cases:
 * a route group, three nesting levels, dynamic and catch-all segments, routes
 * with and without a schema, and a schema with both required and defaulted fields.
 */
export const routes = defineRoutes({
  home: { _metadata: { title: 'Home' } },

  '(shop)': {
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
            searchParamsSchema: z.object({ star: z.number() }),
          },
        },
      },
    },
    cart: { _metadata: { title: 'Cart' } },
  },

  search: {
    _metadata: {
      title: 'Search',
      searchParamsSchema: z.object({
        q: z.string(),
        category: z.enum(['electronics', 'books']).optional(),
      }),
    },
  },

  docs: {
    '[...slug]': { _metadata: { title: 'Docs' } },
  },

  files: {
    '[[...path]]': { _metadata: { title: 'Files' } },
  },

  // An organisational node with no metadata: it namespaces children but is not a destination.
  internal: {
    stats: { _metadata: { title: 'Stats' } },
  },
});

export type Routes = typeof routes;
