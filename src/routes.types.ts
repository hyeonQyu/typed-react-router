import { ReactNode } from 'react';

export type BaseMetadata = NonNullable<unknown>;

export type RouteNode<TMetadata extends BaseMetadata> = {
  _metadata: RouteNodeMetadata<TMetadata>;
  _component: ReactNode;
};

export type RouteNodeMetadata<TMetadata extends BaseMetadata> = {
  title?: string;
  label?: string;
  description?: string;
  href?: () => string | undefined;
  accessible?: () => boolean | undefined;
} & TMetadata;

export type PartialRouteTree<TMetadata extends BaseMetadata> = {
  [key: string]: RouteNode<TMetadata> | PartialRouteTree<TMetadata>;
};

type ExtractChildRoutes<TMetadata extends BaseMetadata, TSubRouteTree, TRouteTree> = {
  [K in '_metadata' | '_component' | keyof TSubRouteTree]: K extends '_metadata'
    ? RouteNodeMetadata<TMetadata>
    : K extends '_component'
      ? ReactNode
      : K extends keyof TSubRouteTree
        ? TSubRouteTree[K] extends RouteNode<TMetadata>
          ? TSubRouteTree[K]
          : TSubRouteTree[K] extends Record<string, unknown>
            ? ExtractChildRoutes<TMetadata, TSubRouteTree[K], TRouteTree>
            : never
        : never;
};

export type RouteTree<TMetadata extends BaseMetadata, TSubRouteTree extends PartialRouteTree<TMetadata>, TRouteTree = TSubRouteTree> = {
  [K in keyof TSubRouteTree]: TSubRouteTree[K] extends RouteNode<TMetadata>
    ? TSubRouteTree[K]
    : TSubRouteTree[K] extends Record<string, unknown>
      ? ExtractChildRoutes<TMetadata, TSubRouteTree[K], TRouteTree>
      : never;
};
