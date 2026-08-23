export { defineRoutes, type CurrentRoute, type TypedRouter, type TypedRoutes } from './defineRoutes';
export type { NavigateArgs, NavigateArgsTuple, NavigateOptions } from './navigation.types';
export { toReactRouterSegment, toRouteObjects } from './toRouteObjects';
export type { TypedLinkProps } from './TypedLink';

export {
  buildHref,
  collectRoutes,
  isRouteGroup,
  matchRoute,
  METADATA_KEY,
  parseSearchParams,
  resolveMetadata,
  resolveMetadataValue,
  SearchParamsParseError,
  toSearchParamsString,
  type AnySchema,
  type BuiltinMetadata,
  type MetadataValue,
  type Pathname,
  type PathParams,
  type PathParamsOutput,
  type RouteArgs,
  type RouteMatch,
  type RouteMetadata,
  type RouteMetadataOf,
  type RouteNodeOf,
  type RoutePaths,
  type SearchParams,
  type SearchParamsErrorMode,
} from '@hyeonqyu/typed-router-core';
