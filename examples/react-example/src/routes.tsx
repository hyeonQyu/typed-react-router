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

/** Whoever is looking at the app. `accessible` below is a function of this. */
export type AppContext = { role: 'guest' | 'member' | 'admin' };

/**
 * The same tree the Next.js example declares — only the metadata differs, because
 * React Router needs to know which element renders each route.
 *
 * `element` is the node's own page; `layout` wraps its children through `<Outlet />`.
 * Any other React Router field (`loader`, `action`, `lazy`, `errorElement`, `handle`, …)
 * is forwarded to the generated route object untouched.
 *
 * `label` and `accessible` are built-ins: plain values, or functions of an app context
 * that `resolveMetadata` evaluates. `PermissionNav` builds a menu out of them.
 */
export const routes = defineRoutes({
  home: {
    _metadata: { title: 'Home', label: 'Home', element: <HomePage /> },
  },

  products: {
    _metadata: {
      title: 'Products',
      label: 'Products',
      element: <ProductsPage />,
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
      _metadata: { title: 'Product detail', element: <ProductDetailPage />, paramSchema: z.number() },

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
      label: 'Search',
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
    profile: {
      // Signed in or not is a runtime question, so `accessible` answers it at runtime.
      _metadata: {
        title: 'Profile',
        label: 'Profile',
        element: <ProfilePage />,
        accessible: (context: AppContext) => context.role !== 'guest',
      },
    },
    orders: {
      _metadata: {
        title: 'Orders',
        label: 'Orders',
        element: <OrdersPage />,
        accessible: (context: AppContext) => context.role === 'admin',
      },
    },
  },
});

export const { TypedLink, useCurrentRoute, useTypedParams, useTypedPathname, useTypedRouter, useTypedSearchParams } = routes;

export type AppPathname = typeof routes.$types.pathname;
