import { Paths } from './path.types';

export type BaseMetadata = NonNullable<unknown>;

export type RouteNode<TMetadata extends BaseMetadata, TContext> = {
  _metadata: RouteNodeMetadata<TMetadata, TContext>;
};

export type RouteNodeMetadata<TMetadata extends BaseMetadata, TContext> = {
  title?: string;
  label?: string;
  description?: string;
  href?: (context: TContext) => string;
  accessible?: (context: TContext) => boolean;
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
