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

/** Values accepted for a dynamic path segment. */
export type PathParamValue = string | number;

type SegmentParams<TSegment extends string> = TSegment extends `[[...${infer TName}]]`
  ? { [K in TName]?: readonly PathParamValue[] }
  : TSegment extends `[...${infer TName}]`
    ? { [K in TName]: readonly PathParamValue[] }
    : TSegment extends `[${infer TName}]`
      ? { [K in TName]: PathParamValue }
      : unknown;

type PathParamsOf<TPath extends string> = TPath extends `${infer TSegment}/${infer TRest}`
  ? SegmentParams<TSegment> & PathParamsOf<TRest>
  : SegmentParams<TPath>;

/**
 * The dynamic segments of a pathname, as an object type.
 *
 * `/products/[id]/reviews`   -> `{ id: string | number }`
 * `/docs/[...slug]`          -> `{ slug: readonly (string | number)[] }`
 * `/shop/[[...filters]]`     -> `{ filters?: readonly (string | number)[] }`
 * `/cart`                    -> `{}`
 */
export type PathParams<TPath extends string> = Simplify<PathParamsOf<TPath>>;

type ReadParam<TValue> = TValue extends readonly unknown[] ? string[] : string;

/**
 * The dynamic segments as they come *back* from a URL — always strings, since that
 * is all a URL can carry. Optionality is preserved from {@link PathParams}.
 */
export type PathParamsOutput<TPath extends string> = Simplify<{
  [K in keyof PathParams<TPath>]: ReadParam<NonNullable<PathParams<TPath>[K]>>;
}>;

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
