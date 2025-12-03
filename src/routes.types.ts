import { ReactNode } from 'react';

export type BaseMetadata = NonNullable<unknown>;

export type RouteNode<TMetadata extends BaseMetadata, TContext> = {
  _metadata: RouteNodeMetadata<TMetadata, TContext>;
  _component: ReactNode;
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
  [K in '_metadata' | '_component' | keyof TSubRouteTree]: K extends '_metadata'
    ? RouteNodeMetadata<TMetadata, TContext>
    : K extends '_component'
      ? ReactNode
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
