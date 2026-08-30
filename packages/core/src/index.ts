export { createRouteTree, resolveMetadata, resolveMetadataValue, type RouteTree } from './createRouteTree';
export {
  defineRoutes,
  type CollectedRouteOf,
  type Pathname,
  type RouteMetadataOf,
  type RouteNodeOf,
  type SearchParams,
  type TypedRoutes,
} from './defineRoutes';

export type {
  GetRouteMetadata,
  GetRouteNode,
  MetadataKey,
  PathParams,
  PathParamsOutput,
  PathParamValue,
  RouteGroupKey,
  RoutePaths,
  SegmentKeys,
  Simplify,
} from './path.types';

export {
  buildHref,
  collectRoutes,
  isRouteGroup,
  matchRoute,
  METADATA_KEY,
  parseSegment,
  splitPath,
  toSearchParamsString,
  type BuildHrefArgs,
  type CollectedRoute,
  type GetCollectedRoute,
  type RouteMatch,
  type RouteParams,
  type SegmentPattern,
} from './path.utils';

export type { AnySchema, InferSchemaInput, InferSchemaOutput, ParsableSchema } from './schema.types';

export {
  collectRawSearchParams,
  parseSearchParams,
  SearchParamsParseError,
  type ParseSearchParamsOptions,
  type RawSearchParams,
  type SearchParamsErrorMode,
} from './searchParams.utils';

export type {
  BuiltinMetadata,
  HasRequiredKeys,
  MetadataValue,
  RouteArgs,
  RouteArgsTuple,
  RouteMetadata,
  RouteNodeInput,
  RouteNodeInputWithMeta,
  RouteTreeInput,
  RouteTreeInputWithMeta,
  SearchParamsInput,
  SearchParamsOutput,
} from './tree.types';
