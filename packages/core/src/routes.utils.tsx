import { createContext, ReactNode, useContext } from 'react';
import { findObjectPath, getSafely, replaceDynamicSegments } from './object.utils';
import { SearchParams } from './query.types';
import { BaseMetadata, PartialRouteTree, ResolvedRouteTree, RouteNode, RoutePathname, RouteTree } from './routes.types';

export const createAppRoutes =
  <TMetadata extends BaseMetadata, TContext>() =>
  <TRouteTree extends PartialRouteTree<TMetadata, TContext>>(appRoutes: TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>) => {
    type Routes = ResolvedRouteTree<TMetadata, TContext, TRouteTree>;
    type Pathname = RoutePathname<TMetadata, TContext, TRouteTree>;
    type AppRouteNode = RouteNode<TMetadata, TContext>;

    const Context = createContext<Routes>(appRoutes as Routes);

    const useAppRoutes = (): Routes => {
      return useContext(Context);
    };

    const useCurrentRouteNode = <TPath extends Pathname>(pathname: TPath) => {
      const routes = useContext(Context);
      return getSafely('/', routes, pathname) as RouteNode<TMetadata, TContext>;
    };

    const AppRoutesProvider = ({ children }: { children: ReactNode }) => {
      return <Context.Provider value={appRoutes as Routes}>{children}</Context.Provider>;
    };

    const getPathnameFromNode = (
      targetNode: AppRouteNode,
      params?: SearchParams,
    ): string | undefined => {
      const pathname = findObjectPath(appRoutes, targetNode);
      if (!pathname) return undefined;
      return replaceDynamicSegments(pathname, params);
    };

    return {
      AppRoutesProvider,
      useAppRoutes,
      useCurrentRouteNode,
      getPathnameFromNode,
      _types: {} as {
        AppRoutesMetadata: TMetadata;
        AppRoutesContext: TContext;
        AppRoutesPathname: Pathname;
        AppRouteNode: AppRouteNode;
      },
    };
  };
