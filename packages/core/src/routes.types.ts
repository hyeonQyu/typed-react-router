import { Paths } from './path.types';

export type BaseMetadata = NonNullable<unknown>;

// Zod schema type - optional import to avoid hard dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyZodSchema = { _input: any; _output: any; parse: (data: any) => any };

export type RouteNode<TMetadata extends BaseMetadata, TContext> = {
  _metadata: RouteNodeMetadata<TMetadata, TContext>;
};

export type RouteNodeMetadata<TMetadata extends BaseMetadata, TContext> = {
  title?: (context: TContext) => string;
  label?: (context: TContext) => string;
  description?: (context: TContext) => string;
  href?: (context: TContext) => string;
  accessible?: (context: TContext) => boolean;
  searchParamsSchema?: AnyZodSchema;
} & TMetadata;

export type PartialRouteTree<TMetadata extends BaseMetadata, TContext> = {
  [key: string]: RouteNode<TMetadata, TContext> | PartialRouteTree<TMetadata, TContext>;
};

type ExtractChildRoutes<TMetadata extends BaseMetadata, TContext, TSubRouteTree, TRouteTree> = {
  [K in '_metadata' | keyof TSubRouteTree]: K extends '_metadata'
    ? RouteNodeMetadata<TMetadata, TContext>
    : K extends keyof TSubRouteTree
      ? TSubRouteTree[K] extends RouteNode<TMetadata, TContext>
        ? TSubRouteTree[K]
        : TSubRouteTree[K] extends Record<string, unknown>
          ? ExtractChildRoutes<TMetadata, TContext, TSubRouteTree[K], TRouteTree>
          : never
      : never;
};

export type RouteTree<
  TMetadata extends BaseMetadata,
  TContext,
  TSubRouteTree extends PartialRouteTree<TMetadata, TContext>,
  TRouteTree = TSubRouteTree,
> = {
  [K in keyof TSubRouteTree]: TSubRouteTree[K] extends RouteNode<TMetadata, TContext>
    ? TSubRouteTree[K]
    : TSubRouteTree[K] extends Record<string, unknown>
      ? ExtractChildRoutes<TMetadata, TContext, TSubRouteTree[K], TRouteTree>
      : never;
};

type RouteTreeWithoutMetadata<T> = {
  [K in keyof T as K extends '_metadata' ? never : K]: T[K] extends object ? RouteTreeWithoutMetadata<T[K]> : T[K];
};

export type RoutePathname<TMetadata extends BaseMetadata, TContext, TRouteTree extends PartialRouteTree<TMetadata, TContext>> = Paths<
  RouteTreeWithoutMetadata<TRouteTree>,
  '/',
  ''
>;

export type SimplifyPathname<T> = T extends string ? T : never;

export type ResolvedRouteTree<
  TMetadata extends BaseMetadata,
  TContext,
  TRouteTree extends PartialRouteTree<TMetadata, TContext>,
> = TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>;

// Extract SearchParams type from a route node's schema
export type ExtractSearchParams<TNode> = TNode extends { _metadata: { searchParamsSchema: AnyZodSchema } }
  ? TNode['_metadata']['searchParamsSchema']['_output']
  : Record<string, unknown>;

// Get route node at specific path
export type GetRouteNode<TRouteTree, TPath extends string> = TPath extends `/${infer First}/${infer Rest}`
  ? First extends keyof TRouteTree
    ? GetRouteNode<TRouteTree[First], `/${Rest}`>
    : never
  : TPath extends `/${infer Key}`
    ? Key extends keyof TRouteTree
      ? TRouteTree[Key]
      : never
    : TRouteTree;

// Extract SearchParams for a specific pathname
export type SearchParamsForPath<TRouteTree, TPath extends string> = ExtractSearchParams<GetRouteNode<TRouteTree, TPath>>;
