import type { GetRouteMetadata, GetRouteNode, RoutePaths } from './path.types';
import {
  buildHref as buildHrefRaw,
  collectRoutes,
  matchRoute,
  METADATA_KEY,
  type BuildHrefArgs,
  type CollectedRoute,
  type RouteMatch,
} from './path.utils';
import type { ParsableSchema } from './schema.types';
import {
  collectRawSearchParams,
  parseSearchParams as parseSearchParamsRaw,
  type ParseSearchParamsOptions,
  type RawSearchParams,
} from './searchParams.utils';
import type { MetadataValue, RouteArgsTuple, RouteMetadata, SearchParamsOutput } from './tree.types';

/** Resolves a metadata value that may be a plain value or a function of the app context. */
export const resolveMetadataValue = <TValue, TContext>(
  value: MetadataValue<TValue, TContext> | undefined,
  context: TContext,
): TValue | undefined => (typeof value === 'function' ? (value as (context: TContext) => TValue)(context) : value);

const BUILTIN_RESOLVABLE_KEYS = ['title', 'label', 'description', 'accessible'] as const;

/**
 * Resolves the built-in metadata fields against a context, leaving every other
 * field (including your own functions such as `loader`) untouched.
 */
export const resolveMetadata = <TMetadata extends RouteMetadata, TContext>(
  metadata: TMetadata | undefined,
  context: TContext,
): TMetadata | undefined => {
  if (!metadata) return metadata;

  const resolved: RouteMetadata = { ...metadata };

  for (const key of BUILTIN_RESOLVABLE_KEYS) {
    if (key in resolved) resolved[key] = resolveMetadataValue(resolved[key], context);
  }

  return resolved as TMetadata;
};

/** Freezes the tree structure without touching metadata contents (schemas, elements, functions). */
const freezeStructure = <TTree>(tree: TTree): TTree => {
  const freeze = (node: unknown) => {
    if (typeof node !== 'object' || node === null || Object.isFrozen(node)) return;

    for (const [key, child] of Object.entries(node)) {
      if (key === METADATA_KEY) continue;
      freeze(child);
    }

    Object.freeze(node);
  };

  freeze(tree);
  return tree;
};

export type RouteTree<TTree> = {
  /** The declared route tree, frozen. */
  routes: TTree;
  /** Every navigable pathname, at runtime. */
  paths: readonly RoutePaths<TTree>[];
  /** All navigable routes with their compiled segments — used by framework adapters. */
  collected: readonly CollectedRoute[];

  /** The tree node a declared pathname points at. */
  getNode: <TPath extends RoutePaths<TTree>>(path: TPath) => GetRouteNode<TTree, TPath>;
  /** The metadata a declared pathname points at. */
  getMetadata: <TPath extends RoutePaths<TTree>>(path: TPath) => GetRouteMetadata<TTree, TPath>;

  /** Resolves a live URL (`/products/123`) back to its declared route (`/products/[id]`). */
  match: (url: string) => RouteMatch | null;

  /** Builds a URL from a declared pathname plus its params, search params and hash. */
  buildHref: <TPath extends RoutePaths<TTree>>(path: TPath, ...args: RouteArgsTuple<TTree, TPath>) => string;

  /** Validates and coerces raw URL search params using the route's schema. */
  parseSearchParams: <TPath extends RoutePaths<TTree>>(
    path: TPath,
    raw: RawSearchParams | Iterable<[string, string]>,
    options?: ParseSearchParamsOptions,
  ) => SearchParamsOutput<TTree, TPath>;
};

const isIterableEntries = (value: unknown): value is Iterable<[string, string]> =>
  typeof value === 'object' && value !== null && Symbol.iterator in value;

/**
 * The framework-agnostic half of `defineRoutes`. Framework packages wrap this and
 * add their own hooks and components on top.
 */
export const createRouteTree = <TTree>(tree: TTree): RouteTree<TTree> => {
  const routes = freezeStructure(tree);
  const collected = collectRoutes(routes);
  const byPath = new Map(collected.map((route) => [route.path, route]));
  const paths = collected.map((route) => route.path) as RoutePaths<TTree>[];

  const getNode = ((path: string) => byPath.get(path)?.node) as RouteTree<TTree>['getNode'];
  const getMetadata = ((path: string) => byPath.get(path)?.metadata) as RouteTree<TTree>['getMetadata'];

  const getSchema = (path: string): ParsableSchema | undefined =>
    (byPath.get(path)?.metadata?.searchParamsSchema as ParsableSchema | undefined) ?? undefined;

  return {
    routes,
    paths,
    collected,
    getNode,
    getMetadata,
    match: (url) => matchRoute(collected, url),
    buildHref: ((path: string, args?: BuildHrefArgs) => buildHrefRaw(path, args)) as RouteTree<TTree>['buildHref'],
    parseSearchParams: ((path: string, raw: RawSearchParams | Iterable<[string, string]>, options?: ParseSearchParamsOptions) =>
      parseSearchParamsRaw(
        getSchema(path),
        isIterableEntries(raw) ? collectRawSearchParams(raw) : (raw as RawSearchParams),
        options,
        path,
      )) as RouteTree<TTree>['parseSearchParams'],
  };
};
