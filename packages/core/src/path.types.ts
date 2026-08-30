import type { InferSchemaInput, InferSchemaOutput } from './schema.types';

/** The reserved key that marks a tree node as a real, navigable route. */
export type MetadataKey = '_metadata';

/**
 * A key wrapped in parentheses — borrowed from Next.js route groups.
 * It organises the tree without contributing a URL segment.
 */
export type RouteGroupKey = `(${string})`;

/** Flattens intersections so IDE hovers show one clean object instead of `A & B & C`. */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/** Every key of a node that is a path segment (i.e. not `_metadata`). */
export type SegmentKeys<TNode> = Exclude<Extract<keyof TNode, string>, MetadataKey>;

type HasMetadata<TNode> = TNode extends { _metadata: unknown } ? true : false;

/**
 * Every navigable pathname in a route tree.
 *
 * A node is navigable when it declares `_metadata`; organisational nodes without
 * metadata contribute a segment but are not themselves destinations. Route group
 * keys `(name)` are skipped entirely.
 *
 * There is no artificial depth cap — a route tree is a finite object literal, so
 * the recursion always terminates on its own.
 */
export type RoutePaths<TTree> = PathsOf<TTree, ''>;

type PathsOf<TNode, TPrefix extends string> = {
  [K in SegmentKeys<TNode>]: K extends RouteGroupKey
    ? PathsOf<TNode[K], TPrefix>
    : (HasMetadata<TNode[K]> extends true ? `${TPrefix}/${K}` : never) | PathsOf<TNode[K], `${TPrefix}/${K}`>;
}[SegmentKeys<TNode>];

/** Values accepted for a dynamic path segment that declares no schema. */
export type PathParamValue = string | number;

/**
 * The schema a dynamic segment declares for itself, on the node whose key *is* that
 * segment — `never` when it declares none. The segment's name comes from the tree
 * key, so only its type is written down:
 *
 * ```ts
 * '[id]': { _metadata: { title: 'Detail', paramSchema: z.number() } }
 * ```
 */
type DeclaredSchema<TNode> = TNode extends { _metadata: { paramSchema: infer TSchema } } ? TSchema : never;

/** The declared schema's input type, or `TFallback` when the segment declares nothing. */
type DeclaredInput<TNode, TFallback> = [DeclaredSchema<TNode>] extends [never] ? TFallback : InferSchemaInput<DeclaredSchema<TNode>>;

/** The declared schema's output type, or `TFallback` when the segment declares nothing. */
type DeclaredOutput<TNode, TFallback> = [DeclaredSchema<TNode>] extends [never] ? TFallback : InferSchemaOutput<DeclaredSchema<TNode>>;

type SegmentParams<TNode, TSegment extends string> = TSegment extends `[[...${infer TName}]]`
  ? { [K in TName]?: DeclaredInput<TNode, readonly PathParamValue[]> }
  : TSegment extends `[...${infer TName}]`
    ? { [K in TName]: DeclaredInput<TNode, readonly PathParamValue[]> }
    : TSegment extends `[${infer TName}]`
      ? { [K in TName]: DeclaredInput<TNode, PathParamValue> }
      : unknown;

type SegmentParamsOutput<TNode, TSegment extends string> = TSegment extends `[[...${infer TName}]]`
  ? { [K in TName]?: DeclaredOutput<TNode, string[]> }
  : TSegment extends `[...${infer TName}]`
    ? { [K in TName]: DeclaredOutput<TNode, string[]> }
    : TSegment extends `[${infer TName}]`
      ? { [K in TName]: DeclaredOutput<TNode, string> }
      : unknown;

/**
 * Walks a pathname and its tree in step, so each segment is read against the node
 * that declared it. Mirrors {@link GetRouteNode}'s walk, including looking through
 * route groups.
 */
type PathParamsOf<TNode, TPath extends string> = TPath extends `/${infer TSegment}/${infer TRest}`
  ? SegmentParams<ResolveSegment<TNode, TSegment>, TSegment> & PathParamsOf<ResolveSegment<TNode, TSegment>, `/${TRest}`>
  : TPath extends `/${infer TSegment}`
    ? SegmentParams<ResolveSegment<TNode, TSegment>, TSegment>
    : unknown;

type PathParamsOutputOf<TNode, TPath extends string> = TPath extends `/${infer TSegment}/${infer TRest}`
  ? SegmentParamsOutput<ResolveSegment<TNode, TSegment>, TSegment> & PathParamsOutputOf<ResolveSegment<TNode, TSegment>, `/${TRest}`>
  : TPath extends `/${infer TSegment}`
    ? SegmentParamsOutput<ResolveSegment<TNode, TSegment>, TSegment>
    : unknown;

/**
 * The dynamic segments of a pathname, as the object type a navigation call *writes*.
 *
 * `/products/[id]/reviews`   -> `{ id: string | number }`
 * `/docs/[...slug]`          -> `{ slug: readonly (string | number)[] }`
 * `/shop/[[...filters]]`     -> `{ filters?: readonly (string | number)[] }`
 * `/cart`                    -> `{}`
 *
 * Pass the tree as `TTree` and a segment that declares a `paramSchema` narrows to
 * that schema's input type instead — so `'[id]': { _metadata: { paramSchema: z.number() } }`
 * makes `{ id: number }`. Without a tree every segment reads as the untyped default,
 * which is what it was before schemas existed.
 */
export type PathParams<TPath extends string, TTree = unknown> = Simplify<PathParamsOf<TTree, TPath>>;

/**
 * The dynamic segments as they come *back* from a URL. A segment that declares no
 * schema is a string (or `string[]` for a catch-all), since that is all a URL can
 * carry; one that declares a `paramSchema` is that schema's output type, because
 * `parsePathParams` has run it. Optionality is preserved from {@link PathParams}.
 */
export type PathParamsOutput<TPath extends string, TTree = unknown> = Simplify<PathParamsOutputOf<TTree, TPath>>;

/**
 * Resolves one segment against a node, transparently looking through route groups
 * so `/login` still resolves when it is declared under `(auth)`.
 */
type ResolveSegment<TNode, TSegment extends string> = TSegment extends keyof TNode
  ? TNode[TSegment]
  : {
      [K in SegmentKeys<TNode>]: K extends RouteGroupKey ? ResolveSegment<TNode[K], TSegment> : never;
    }[SegmentKeys<TNode>];

/** The tree node a pathname points at. */
export type GetRouteNode<TTree, TPath extends string> = TPath extends `/${infer TSegment}/${infer TRest}`
  ? GetRouteNode<ResolveSegment<TTree, TSegment>, `/${TRest}`>
  : TPath extends `/${infer TSegment}`
    ? ResolveSegment<TTree, TSegment>
    : never;

/** The metadata declared on the node a pathname points at. */
export type GetRouteMetadata<TTree, TPath extends string> =
  GetRouteNode<TTree, TPath> extends { _metadata: infer TMetadata } ? TMetadata : never;
