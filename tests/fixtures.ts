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

/**
 * A second tree, for the segments that declare their own type. It mixes the cases
 * that have to keep working together: a declared segment with an undeclared one
 * nested under it, a route inheriting two ancestors' declarations, a segment that
 * declares nothing at all, and both flavours of catch-all.
 */
export const typedParamRoutes = defineRoutes({
  orgs: {
    '[orgId]': {
      _metadata: { title: 'Org', paramSchema: z.number() },

      projects: {
        // Declares no schema of its own, but `orgId` is still part of its pathname.
        _metadata: { title: 'Projects' },

        '[projectId]': {
          _metadata: { title: 'Project', paramSchema: z.string().min(3) },

          settings: { _metadata: { title: 'Settings' } },
        },
      },
    },
  },

  // Declares nothing, so it reads back exactly as it did before schemas existed.
  posts: {
    '[slug]': { _metadata: { title: 'Post' } },
  },

  archive: {
    '[...date]': { _metadata: { title: 'Archive', paramSchema: z.array(z.number()).length(3) } },
  },

  gallery: {
    '[[...filters]]': { _metadata: { title: 'Gallery', paramSchema: z.array(z.string()).default([]) } },
  },
});

export type TypedParamRoutes = typeof typedParamRoutes;
