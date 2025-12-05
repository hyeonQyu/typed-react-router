import { createContext, ReactNode, useContext } from 'react';
import { getSafely } from './object.utils';
import { PathValue } from './path.types';
import { BaseMetadata, PartialRouteTree, RoutePathname, RouteTree } from './routes.types';

export const createAppRoutes =
  <TMetadata extends BaseMetadata, TContext>() =>
  <TRouteTree extends PartialRouteTree<TMetadata, TContext>>(appRoutes: TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>) => {
    const Context = createContext<TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>>(appRoutes);

    const useAppRoutes = () => {
      return useContext(Context);
    };

    const useCurrentRouteNode = <TPath extends RoutePathname<TMetadata, TContext, TRouteTree>>(pathname: TPath) => {
      const routes = useContext(Context);
      return getSafely('/', routes, pathname) as PathValue<TRouteTree, TPath, '/'>;
    };

    const AppRoutesProvider = ({ children }: { children: ReactNode }) => {
      return <Context.Provider value={appRoutes}>{children}</Context.Provider>;
    };

    return {
      AppRoutesProvider,
      useAppRoutes,
      useCurrentRouteNode,
      _types: {} as {
        AppRoutesMetadata: TMetadata;
        AppRoutesContext: TContext;
        AppRoutesPathname: RoutePathname<TMetadata, TContext, TRouteTree>;
      },
    };
  };
