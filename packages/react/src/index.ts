import { type PartialRouteTree, type ResolvedRouteTree, type RoutePathname, type RouteTree } from '@hyeonqyu/typed-router-core';
import { createAppRoutes as coreCreateAppRoutes } from '@hyeonqyu/typed-router-core/routes.utils';
import { ReactNode } from 'react';
import { createTypedNavigate } from './navigate.hooks';

export const createAppRoutes = <TMetadata extends { component: ReactNode }, TContext>() => {
  return <TRouteTree extends PartialRouteTree<TMetadata, TContext>>(appRoutes: TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>) => {
    const { AppRoutesProvider, useAppRoutes, getPathnameFromNode, freezeAppRoutes, useCurrentRouteNode, _types } = coreCreateAppRoutes<
      TMetadata,
      TContext
    >()(appRoutes);

    type Pathname = RoutePathname<TMetadata, TContext, TRouteTree>;
    type Routes = ResolvedRouteTree<TMetadata, TContext, TRouteTree>;

    const useTypedNavigate = createTypedNavigate<Pathname, TRouteTree>();

    return {
      AppRoutesProvider,
      useAppRoutes: useAppRoutes as () => Routes,
      useTypedNavigate,
      getPathnameFromNode,
      freezeAppRoutes,
      useCurrentRouteNode,
      appRoutes,
      _types: {
        ..._types,
        AppRoutesPathname: {} as Pathname,
      },
    };
  };
};

export * from '@hyeonqyu/typed-router-core';
