import { defineRoutes as defineNextRoutes } from '@hyeonqyu/typed-router-next';
import { defineRoutes as defineReactRoutes } from '@hyeonqyu/typed-router-react';
import { z } from 'zod';

/**
 * Proves the two adapters expose the same surface: the *same* tree declaration and
 * the *same* component body compile against both. If either adapter drifts — a hook
 * renamed, `TypedLink` going back to `to`, params merged into search params — this
 * file stops compiling.
 */

const tree = {
  home: { _metadata: { title: 'Home' } },
  '(shop)': {
    products: {
      _metadata: {
        title: 'Products',
        searchParamsSchema: z.object({
          sort: z.enum(['price-asc', 'price-desc']).optional(),
          page: z.number().default(1),
        }),
      },
      '[id]': { _metadata: { title: 'Detail' } },
    },
  },
  search: { _metadata: { title: 'Search', searchParamsSchema: z.object({ q: z.string() }) } },
} as const;

const nextRoutes = defineNextRoutes(tree);
const reactRoutes = defineReactRoutes(tree);

/** One component body, written once, type-checked against each adapter in turn. */
const useSharedBody = (routes: typeof nextRoutes | typeof reactRoutes) => {
  const router = routes.useTypedRouter();
  const pathname = routes.useTypedPathname();
  const node = routes.useCurrentRouteNode();
  const current = routes.useCurrentRoute();
  const params = routes.useTypedParams('/products/[id]');
  const query = routes.useTypedSearchParams('/products');

  router.push('/home');
  router.push('/products/[id]', { params: { id: 7 } });
  router.replace('/search', { searchParams: { q: 'hi' } });
  router.prefetch('/products', { searchParams: { page: 2 } });
  router.back();
  router.forward();
  router.refresh();

  return { pathname, node, current, id: params.id, page: query.page, sort: query.sort, url: current.url };
};

const NextNav = () => {
  const { TypedLink } = nextRoutes;
  return (
    <nav>
      <TypedLink href="/home">Home</TypedLink>
      <TypedLink href="/products/[id]" params={{ id: 1 }}>
        Detail
      </TypedLink>
      <TypedLink href="/search" searchParams={{ q: 'shoes' }} hash="top">
        Search
      </TypedLink>
    </nav>
  );
};

const ReactNav = () => {
  const { TypedLink } = reactRoutes;
  return (
    <nav>
      <TypedLink href="/home">Home</TypedLink>
      <TypedLink href="/products/[id]" params={{ id: 1 }}>
        Detail
      </TypedLink>
      <TypedLink href="/search" searchParams={{ q: 'shoes' }} hash="top">
        Search
      </TypedLink>
    </nav>
  );
};

/* Negative cases must fail identically on both adapters. */

const NextInvalid = () => {
  const router = nextRoutes.useTypedRouter();
  // @ts-expect-error — dynamic route needs params
  router.push('/products/[id]');
  // @ts-expect-error — `/home` declares no schema
  router.push('/home', { searchParams: { q: 'x' } });
  // @ts-expect-error — `q` is required
  router.push('/search', { searchParams: {} });
  // @ts-expect-error — React Router's `to` is not the prop name here
  return <nextRoutes.TypedLink to="/home">x</nextRoutes.TypedLink>;
};

const ReactInvalid = () => {
  const router = reactRoutes.useTypedRouter();
  // @ts-expect-error — dynamic route needs params
  router.push('/products/[id]');
  // @ts-expect-error — `/home` declares no schema
  router.push('/home', { searchParams: { q: 'x' } });
  // @ts-expect-error — `q` is required
  router.push('/search', { searchParams: {} });
  // @ts-expect-error — `to` is not the prop name here either
  return <reactRoutes.TypedLink to="/home">x</reactRoutes.TypedLink>;
};

/** Only the React adapter generates router config; the output is plain data. */
const routeObjects = reactRoutes.toRouteObjects();
const composed = [{ path: '/', children: routeObjects }, ...routeObjects];

export { composed, NextInvalid, NextNav, ReactInvalid, ReactNav, routeObjects, useSharedBody };
