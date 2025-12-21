import {
  createAppRoutes as createAppRoutesCore,
  type BaseMetadata,
  type PartialRouteTree,
  type RoutePathname,
  type RouteTree,
} from '@hyeonqyu/typed-router-core';
import { createTypedPathname } from 'packages/next/src/pathname.hooks';
import { createTypedRouter } from 'packages/next/src/router.hooks';
import { createTypedLink } from './TypedLink';

export const createAppRoutes = <TMetadata extends BaseMetadata, TContext>() => {
  return <TRouteTree extends PartialRouteTree<TMetadata, TContext>>(appRoutes: TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>) => {
    const { _types, ...rest } = createAppRoutesCore<TMetadata, TContext>()(appRoutes);

    type Pathname = RoutePathname<TMetadata, TContext, TRouteTree>;
    const TypedLink = createTypedLink<Pathname>();
    const useTypedRouter = createTypedRouter<Pathname>();
    const useTypedPathname = createTypedPathname<Pathname>();

    return {
      ...rest,
      TypedLink,
      useTypedRouter,
      useTypedPathname,
      _types,
    };
  };
};

export * from '@hyeonqyu/typed-router-core';
export type { TypedLinkProps } from './TypedLink';
