import type { BaseMetadata, PartialRouteTree, PathValue, ResolvedRouteTree, RoutePathname, RouteTree } from '@hyeonqyu/typed-router-core';
import { createAppRoutes as createAppRoutesCore } from '@hyeonqyu/typed-router-core/routes.utils';
import { createTypedPathname } from './pathname.hooks';
import { createTypedRouter } from './router.hooks';
import { createTypedLink } from './TypedLink';

export const createAppRoutes = <TMetadata extends BaseMetadata, TContext>() => {
  return <TRouteTree extends PartialRouteTree<TMetadata, TContext>>(appRoutes: TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>) => {
    const { AppRoutesProvider, useAppRoutes, useCurrentRouteNode, _types } = createAppRoutesCore<TMetadata, TContext>()(appRoutes);

    type Pathname = RoutePathname<TMetadata, TContext, TRouteTree>;
    type Routes = ResolvedRouteTree<TMetadata, TContext, TRouteTree>;

    const TypedLink = createTypedLink<Pathname>();
    const useTypedRouter = createTypedRouter<Pathname>();
    const useTypedPathname = createTypedPathname<Pathname>();

    return {
      AppRoutesProvider,
      useAppRoutes: useAppRoutes as () => Routes,
      useCurrentRouteNode: useCurrentRouteNode as <TPath extends Pathname>(pathname: TPath) => PathValue<TRouteTree, TPath, '/'>,
      TypedLink,
      useTypedRouter,
      useTypedPathname,
      _types: {
        ..._types,
        AppRoutesPathname: {} as Pathname,
      },
    };
  };
};

export * from '@hyeonqyu/typed-router-core';
export type { TypedLinkProps } from './TypedLink';
