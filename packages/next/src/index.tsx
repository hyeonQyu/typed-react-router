export * from '@hyeonqyu/typed-router-core';
export type { SafeLinkProps } from './SafeLink';

import {
  createAppRoutes as createAppRoutesCore,
  type BaseMetadata,
  type PartialRouteTree,
  type RoutePathname,
  type RouteTree,
} from '@hyeonqyu/typed-router-core';
import { createSafeLink } from './SafeLink';

export const createAppRoutes = <TMetadata extends BaseMetadata, TContext>() => {
  return <TRouteTree extends PartialRouteTree<TMetadata, TContext>>(appRoutes: TRouteTree & RouteTree<TMetadata, TContext, TRouteTree>) => {
    const { _types, ...rest } = createAppRoutesCore<TMetadata, TContext>()(appRoutes);
    const SafeLink = createSafeLink<RoutePathname<TMetadata, TContext, TRouteTree>>();

    return {
      ...rest,
      SafeLink,
      _types,
    };
  };
};
