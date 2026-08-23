import { defineRoutes } from '@hyeonqyu/typed-router-react';
import { z } from 'zod';
import { AppLayout } from './components/AppLayout';
import { DocsPage } from './pages/DocsPage';
import { HomePage } from './pages/HomePage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReviewsPage } from './pages/ReviewsPage';
import { SearchPage } from './pages/SearchPage';

/**
 * The same tree the Next.js example declares — only the metadata differs, because
 * React Router needs to know which element renders each route.
 *
 * `element` is the node's own page; `layout` wraps its children through `<Outlet />`.
 * Any other React Router field (`loader`, `action`, `lazy`, `errorElement`, `handle`, …)
 * is forwarded to the generated route object untouched.
 */
export const routes = defineRoutes({
  home: {
    _metadata: { title: 'Home', element: <HomePage /> },
  },

  products: {
    _metadata: {
      title: 'Products',
      element: <ProductsPage />,
      searchParamsSchema: z.object({
        sort: z.enum(['price-asc', 'price-desc', 'name']).optional(),
        page: z.number().default(1),
        inStock: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      }),
    },

    '[id]': {
      _metadata: { title: 'Product detail', element: <ProductDetailPage /> },

      reviews: {
        _metadata: {
          title: 'Reviews',
          element: <ReviewsPage />,
          searchParamsSchema: z.object({ star: z.number().min(1).max(5).optional() }),
        },
      },
    },
  },

  search: {
    _metadata: {
      title: 'Search',
      element: <SearchPage />,
      searchParamsSchema: z.object({
        q: z.string(),
        category: z.enum(['electronics', 'books', 'clothing']).optional(),
      }),
    },
  },

  docs: {
    '[...slug]': { _metadata: { title: 'Docs', element: <DocsPage /> } },
  },

  // A route group becomes a pathless layout route: /profile and /orders share
  // `AppLayout` without `(account)` ever appearing in the URL.
  '(account)': {
    _metadata: { layout: <AppLayout /> },
    profile: { _metadata: { title: 'Profile', element: <ProfilePage /> } },
    orders: { _metadata: { title: 'Orders', element: <OrdersPage /> } },
  },
});

export const { TypedLink, useCurrentRoute, useTypedParams, useTypedPathname, useTypedRouter, useTypedSearchParams } = routes;

export type AppPathname = typeof routes.$types.pathname;
