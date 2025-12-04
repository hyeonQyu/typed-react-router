import { createContext, ReactNode, useContext } from 'react';
import { BaseMetadata, PartialRouteTree, RouteTree } from './routes.types';

export const createAppRoutes =
  <TMetadata extends BaseMetadata, TContext>() =>
  <TRouteTree extends PartialRouteTree<TMetadata, TContext>>(appRoutes: TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>) => {
    const Context = createContext<TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>>(appRoutes);

    const useAppRoutes = () => {
      return useContext(Context);
    };

    const AppRoutesProvider = ({ children }: { children: ReactNode }) => {
      return <Context.Provider value={appRoutes}>{children}</Context.Provider>;
    };

    return {
      AppRoutesProvider,
      useAppRoutes,
    };
  };
