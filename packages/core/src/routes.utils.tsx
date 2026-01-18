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

      const ROUTE_NODE_COMMON_KEY: keyof AppRouteNode = '_metadata';

      const freezeAppRoutes = () => {
        const copiedAppRoutes = { ...appRoutes };

        const freeze = (obj: Record<string, unknown>) => {
          Object.entries(obj).forEach(([key, value]) => {
            Object.defineProperty(obj, key, {
              writable: false,
              enumerable: key !== ROUTE_NODE_COMMON_KEY,
              configurable: false,
            });

            if (typeof value === 'object' && value !== null) {
              freeze(value as Record<string, unknown>);
            }
          });
        };

        freeze(copiedAppRoutes as Record<string, unknown>);
        return copiedAppRoutes as Routes;
      };

      const frozenAppRoutes = freezeAppRoutes();

      const Context = createContext<Routes>(frozenAppRoutes);

      const useAppRoutes = (): Routes => {
        return useContext(Context);
      };

      const useCurrentRouteNode = <TPath extends Pathname>(pathname: TPath) => {
        const routes = useContext(Context);
        return getSafely('/', routes, pathname) as RouteNode<TMetadata, TContext>;
      };

      const AppRoutesProvider = ({ children }: { children: ReactNode }) => {
        return <Context.Provider value={frozenAppRoutes}>{children}</Context.Provider>;
      };

      const getPathnameFromNode = (targetNode: AppRouteNode, params?: SearchParams): string | undefined => {
        const pathname = findObjectPath(frozenAppRoutes, targetNode);
        if (!pathname) return undefined;
        const { pathname: replacedPathname } = replaceDynamicSegments(pathname, params);
        return replacedPathname;
      };

      return {
        AppRoutesProvider,
        useAppRoutes,
        useCurrentRouteNode,
        getPathnameFromNode,
        freezeAppRoutes,
        _types: {} as {
          AppRoutesMetadata: TMetadata;
          AppRoutesContext: TContext;
          AppRoutesPathname: Pathname;
          AppRouteNode: AppRouteNode;
        },
      };
    };
