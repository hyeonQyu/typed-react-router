import {
  getSafely,
  RouteNode,
  type BaseMetadata,
  type PartialRouteTree,
  type ResolvedRouteTree,
  type RoutePathname,
  type RouteTree,
} from '@hyeonqyu/typed-router-core';
import { createAppRoutes as createAppRoutesCore } from '@hyeonqyu/typed-router-core/routes.utils';
import { createTypedPathname } from './pathname.hooks';
import { createTypedRouter } from './router.hooks';
import { createTypedSearchParams } from './searchParams.hooks';
import { createTypedLink } from './TypedLink';

export const createAppRoutes = <TMetadata extends BaseMetadata, TContext>() => {
  return <TRouteTree extends PartialRouteTree<TMetadata, TContext>>(appRoutes: TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>) => {
    const { AppRoutesProvider, useAppRoutes, _types } = createAppRoutesCore<TMetadata, TContext>()(appRoutes);

    type Pathname = RoutePathname<TMetadata, TContext, TRouteTree>;
    type Routes = ResolvedRouteTree<TMetadata, TContext, TRouteTree>;

    const TypedLink = createTypedLink<Pathname, TRouteTree>();
    const useTypedRouter = createTypedRouter<Pathname, TRouteTree>();
    const useTypedPathname = createTypedPathname<Pathname>();
    const useTypedSearchParams = createTypedSearchParams<Pathname, TRouteTree>();

    const getCurrentRouteNode = (pathname: Pathname) => {
      return getSafely('/', appRoutes, pathname) as RouteNode<TMetadata, TContext>;
    };

    const useCurrentRouteNode = () => {
      const pathname = useTypedPathname();
      return getCurrentRouteNode(pathname);
    };

    return {
      AppRoutesProvider,
      useAppRoutes: useAppRoutes as () => Routes,
      useCurrentRouteNode,
      TypedLink,
      useTypedRouter,
      useTypedPathname,
      useTypedSearchParams,
      getCurrentRouteNode,
      appRoutes,
      _types: {
        ..._types,
        AppRoutesPathname: {} as Pathname,
      },
    };
  };
};

export * from '@hyeonqyu/typed-router-core';
export type { TypedLinkProps } from './TypedLink';
