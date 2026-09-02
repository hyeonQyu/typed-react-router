import type { GetRouteNode, PathParams, PathParamsOutput, Simplify } from './path.types';
import type { AnySchema, InferSchemaInput, InferSchemaOutput } from './schema.types';

/** A metadata value that may be computed from the app context instead of fixed. */
export type MetadataValue<TValue, TContext> = TValue | ((context: TContext) => TValue);

/**
 * Metadata every route understands. Anything else you put on `_metadata` is kept
 * as-is and inferred per node, so adapters (and your own code) can read it.
 */
export type BuiltinMetadata<TContext = unknown> = {
  title?: MetadataValue<string, TContext>;
  label?: MetadataValue<string, TContext>;
  description?: MetadataValue<string, TContext>;
  accessible?: MetadataValue<boolean, TContext>;
  searchParamsSchema?: AnySchema;
  /**
   * The schema for *this node's own* dynamic segment — only meaningful on a node
   * whose key is `[param]`, `[...param]` or `[[...param]]`. Nested routes inherit it,
   * since the segment is part of their pathname too.
   */
  paramSchema?: AnySchema;
};

/** Loosest shape a `_metadata` block can take. */
export type RouteMetadata = Record<string, unknown>;

/** The built-in fields `resolveMetadata` evaluates against a context. */
export type ResolvableMetadataKey = 'title' | 'label' | 'description' | 'accessible';

/** `(context) => TValue` collapses to `TValue`; anything else is already its own value. */
type Resolved<TValue> = TValue extends (context: never) => infer TResolved ? TResolved : TValue;

/**
 * Metadata as `resolveMetadata` returns it: the four built-in fields have been called
 * and are now plain values, and every other field — including your own functions, like
 * a `loader` — is untouched.
 */
export type ResolvedMetadata<TMetadata> = {
  [K in keyof TMetadata]: K extends ResolvableMetadataKey ? Resolved<TMetadata[K]> : TMetadata[K];
};

export interface RouteNodeInput {
  readonly _metadata?: RouteMetadata;
  readonly [segment: string]: unknown;
}

/** The object literal you hand to `defineRoutes`. */
export type RouteTreeInput = { readonly [segment: string]: RouteNodeInput };

/** Constraint used by `defineRoutes.withMeta`, where every node shares a metadata contract. */
export type RouteTreeInputWithMeta<TMetadata, TContext> = {
  readonly [segment: string]: RouteNodeInputWithMeta<TMetadata, TContext>;
};

/**
 * A node under a shared metadata contract. Recursive on purpose: nesting a route
 * deeper must not exempt it, or the contract would only ever hold one level down
 * from the root — which reads as enforcement while being none.
 *
 * The index signature repeats the metadata type because TypeScript requires a
 * declared property to conform to its own index signature, and `_metadata` is a
 * property of the node like any other.
 */
export type RouteNodeInputWithMeta<TMetadata, TContext> = {
  readonly _metadata?: TMetadata & BuiltinMetadata<TContext>;
  readonly [segment: string]: RouteNodeInputWithMeta<TMetadata, TContext> | (TMetadata & BuiltinMetadata<TContext>) | undefined;
};

/** The search params a route *accepts* — schema input, so `.default()` fields stay optional. */
export type SearchParamsInput<TTree, TPath extends string> = InferSchemaInput<SchemaOf<TTree, TPath>>;

/** The search params a route *produces* — schema output, with defaults and transforms applied. */
export type SearchParamsOutput<TTree, TPath extends string> = InferSchemaOutput<SchemaOf<TTree, TPath>>;

/** The path params a route *accepts* — each segment's declared schema input, or text. */
export type PathParamsInput<TTree, TPath extends string> = PathParams<TPath, TTree>;

/** The path params a route *produces* — each segment's declared schema output, or text. */
export type ParsedPathParams<TTree, TPath extends string> = PathParamsOutput<TPath, TTree>;

type SchemaOf<TTree, TPath extends string> =
  GetRouteNode<TTree, TPath> extends { _metadata: { searchParamsSchema: infer TSchema } } ? TSchema : never;

type RequiredKeys<T> = { [K in keyof T]-?: object extends Pick<T, K> ? never : K }[keyof T];

type HasKeys<T> = [keyof T] extends [never] ? false : true;

/** True when a value cannot be omitted, i.e. it has at least one required property. */
export type HasRequiredKeys<T> = [RequiredKeys<T>] extends [never] ? false : true;

type ParamsArg<TTree, TPath extends string> =
  PathParamsInput<TTree, TPath> extends infer TParams
    ? HasRequiredKeys<TParams> extends true
      ? { params: TParams }
      : HasKeys<TParams> extends true
        ? { params?: TParams }
        : { params?: never }
    : never;

type SearchParamsArg<TTree, TPath extends string> =
  SearchParamsInput<TTree, TPath> extends infer TSearch
    ? [TSearch] extends [never]
      ? { searchParams?: never }
      : HasRequiredKeys<TSearch> extends true
        ? { searchParams: TSearch }
        : { searchParams?: TSearch }
    : never;

/**
 * Everything a navigation call may pass for a given pathname.
 *
 * Both keys follow the same rule: required when something about them is required,
 * optional when they exist but everything in them is optional, and forbidden
 * (`?: never`) when the route has nothing of that kind at all.
 */
export type RouteArgs<TTree, TPath extends string> = Simplify<ParamsArg<TTree, TPath> & SearchParamsArg<TTree, TPath> & { hash?: string }>;

/**
 * Spreadable argument list that makes the options object itself optional when the
 * route needs nothing — so `router.push('/cart')` is legal but
 * `router.push('/products/[id]')` is a compile error.
 */
export type RouteArgsTuple<TTree, TPath extends string> =
  HasRequiredKeys<RouteArgs<TTree, TPath>> extends true ? [args: RouteArgs<TTree, TPath>] : [args?: RouteArgs<TTree, TPath>];
