import { collectRoutes, parseSegment, splitPath, type RouteMetadata } from '@hyeonqyu/typed-router-core';
import type { RouteConfig, RouteConfigEntry } from '@react-router/dev/routes';
import { routes } from '../src/routes';

/**
 * The bridge from the route tree to framework mode's route config.
 *
 * `toRouteObjects()` from `@hyeonqyu/typed-router-react` is **not** usable here, and
 * not because of a bug: it emits `element` / `Component` — React elements, resolved at
 * runtime — while framework mode's `RouteConfigEntry` wants `file`, a module path it
 * resolves at build time so it can code-split each route and generate its types. The
 * two describe the same routes in units the other cannot read.
 *
 * What does carry over is the tree itself. `collectRoutes` already flattens it to one
 * entry per navigable route, with route groups collapsed and metadata attached — so
 * the config below is fifteen lines, and `src/routes.ts` stays the single place a route
 * is declared.
 *
 * Framework mode's own `routes.ts` conventions (`index()`, `route()`, `layout()`) build
 * the same array by hand; this builds it from the tree instead.
 */

/** `[id]` -> `:id`, `[...slug]` / `[[...slug]]` -> `*`, everything else unchanged. */
const toFrameworkSegment = (segment: string): string => {
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

/** The module path a node declared for itself, or `undefined` when it declared none. */
const fileOf = (metadata: RouteMetadata | undefined): string | undefined =>
  typeof metadata?.file === 'string' ? metadata.file : undefined;

const toRouteConfig = (tree: unknown): RouteConfigEntry[] => {
  const entries: RouteConfigEntry[] = [];

  for (const collected of collectRoutes(tree)) {
    const file = fileOf(collected.metadata);
    // A node with no module is a place in the information architecture, not a page —
    // framework mode has nothing to build for it, so it contributes no entry.
    if (!file) continue;

    const path = splitPath(collected.path).map(toFrameworkSegment).join('/');

    // The root is declared with the empty key, and joins to a path of `''` — which is
    // exactly what framework mode calls an index route.
    entries.push(path === '' ? { file, index: true } : { file, path });
  }

  return entries;
};

export default toRouteConfig(routes.routes) satisfies RouteConfig;
