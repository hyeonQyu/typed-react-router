import { createContext, ReactNode, useContext } from 'react';
import { getSafely } from './object.utils';
import { PathValue } from './path.types';
import { BaseMetadata, PartialRouteTree, ResolvedRouteTree, RoutePathname, RouteTree } from './routes.types';

export const createAppRoutes =
  <TMetadata extends BaseMetadata, TContext>() =>
  <TRouteTree extends PartialRouteTree<TMetadata, TContext>>(appRoutes: TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>) => {
    type Routes = ResolvedRouteTree<TMetadata, TContext, TRouteTree>;
    type Pathname = RoutePathname<TMetadata, TContext, TRouteTree>;

    const Context = createContext<Routes>(appRoutes as Routes);

    const useAppRoutes = (): Routes => {
      return useContext(Context);
    };

    const useCurrentRouteNode = <TPath extends Pathname>(pathname: TPath): PathValue<TRouteTree, TPath, '/'> => {
      const routes = useContext(Context);
      return getSafely('/', routes, pathname) as PathValue<TRouteTree, TPath, '/'>;
    };

    const AppRoutesProvider = ({ children }: { children: ReactNode }) => {
      return <Context.Provider value={appRoutes as Routes}>{children}</Context.Provider>;
    };

    return {
      AppRoutesProvider,
      useAppRoutes,
      useCurrentRouteNode,
      _types: {} as {
        AppRoutesMetadata: TMetadata;
        AppRoutesContext: TContext;
        AppRoutesPathname: Pathname;
      },
    };
  };
