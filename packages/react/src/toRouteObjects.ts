import { isRouteGroup, METADATA_KEY, parseSegment, type RouteMetadata } from '@hyeonqyu/typed-router-core';
import type { RouteObject } from 'react-router-dom';

/**
 * Fields that describe *this node's page*. When a node has children, they move to an
 * `index` route so the page renders at the exact path instead of only through `<Outlet />`.
 */
const PAGE_FIELDS = ['element', 'Component', 'lazy', 'loader', 'action', 'shouldRevalidate', 'handle', 'middleware'] as const;

/** Fields that describe the route itself and stay on the parent when a node is split. */
const ROUTE_FIELDS = ['errorElement', 'ErrorBoundary', 'HydrateFallback', 'hydrateFallbackElement', 'caseSensitive', 'id'] as const;

const pick = (metadata: RouteMetadata | undefined, keys: readonly string[]): Record<string, unknown> => {
  if (!metadata) return {};

  const picked: Record<string, unknown> = {};
  for (const key of keys) {
    if (metadata[key] !== undefined) picked[key] = metadata[key];
  }
  return picked;
};

const hasAny = (metadata: RouteMetadata | undefined, keys: readonly string[]): boolean =>
  Boolean(metadata) && keys.some((key) => metadata?.[key] !== undefined);

/** `[id]` -> `:id`, `[...slug]` / `[[...slug]]` -> `*`, everything else unchanged. */
export const toReactRouterSegment = (segment: string): string => {
  const pattern = parseSegment(segment);

  switch (pattern.kind) {
    case 'dynamic':
      return `:${pattern.name}`;
    case 'catchAll':
    case 'optionalCatchAll':
      return '*';
    default:
      return pattern.value;
  }
};

const toChildren = (node: unknown): RouteObject[] => {
  if (typeof node !== 'object' || node === null) return [];

  const children: RouteObject[] = [];

  for (const [key, child] of Object.entries(node)) {
    if (key === METADATA_KEY) continue;
    if (typeof child !== 'object' || child === null) continue;

    children.push(...toRouteObjectsForKey(key, child as Record<string, unknown>));
  }

  return children;
};

const layoutElement = (metadata: RouteMetadata | undefined): Record<string, unknown> =>
  metadata?.layout === undefined ? {} : { element: metadata.layout };

/** A `(group)` key: no URL segment of its own, which is React Router's pathless layout route. */
const toPathlessLayoutRoute = (metadata: RouteMetadata | undefined, children: RouteObject[]): RouteObject =>
  ({
    ...pick(metadata, ROUTE_FIELDS),
    ...pick(metadata, PAGE_FIELDS),
    ...layoutElement(metadata),
    children,
  }) as RouteObject;

/** A node with no children: its page and its route are the same object. */
const toLeafRoute = (path: string, metadata: RouteMetadata | undefined): RouteObject =>
  ({
    path,
    ...pick(metadata, ROUTE_FIELDS),
    ...(metadata?.element === undefined ? layoutElement(metadata) : {}),
    ...pick(metadata, PAGE_FIELDS),
  }) as RouteObject;

/**
 * A node with children: its own page moves into an `index` route, so it renders at the
 * exact path rather than only through the parent's `<Outlet />`.
 */
const toParentRoute = (path: string, metadata: RouteMetadata | undefined, children: RouteObject[]): RouteObject => {
  const page = pick(metadata, PAGE_FIELDS);
  const indexRoute = { index: true, ...page } as RouteObject;

  return {
    path,
    ...pick(metadata, ROUTE_FIELDS),
    ...layoutElement(metadata),
    children: hasAny(metadata, PAGE_FIELDS) ? [indexRoute, ...children] : children,
  } as RouteObject;
};

const toRouteObjectsForKey = (key: string, node: Record<string, unknown>): RouteObject[] => {
  const metadata = node[METADATA_KEY] as RouteMetadata | undefined;
  const children = toChildren(node);

  if (isRouteGroup(key)) return [toPathlessLayoutRoute(metadata, children)];

  const path = toReactRouterSegment(key);

  return [children.length === 0 ? toLeafRoute(path, metadata) : toParentRoute(path, metadata, children)];
};

/**
 * Turns a route tree into plain React Router `RouteObject[]`.
 *
 * The result is ordinary data, so you stay in control: pass it straight to
 * `createBrowserRouter`, nest it under your own layout, append a `*` catch-all,
 * or filter it by feature flag.
 *
 * ```ts
 * createBrowserRouter([
 *   { element: <RootLayout />, errorElement: <Error />, children: toRouteObjects(routes) },
 *   { path: '*', element: <NotFound /> },
 * ]);
 * ```
 *
 * Every React Router route field you put on `_metadata` (`loader`, `action`, `lazy`,
 * `errorElement`, `handle`, …) is forwarded verbatim. `_metadata.layout` marks an
 * element that wraps the node's children via `<Outlet />`; `_metadata.element` marks
 * the node's own page, and becomes an `index` route when the node also has children.
 */
export const toRouteObjects = (tree: unknown): RouteObject[] => toChildren(tree);
