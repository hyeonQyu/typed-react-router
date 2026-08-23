import type { HasRequiredKeys, RouteArgs } from '@hyeonqyu/typed-router-core';

/** Next-specific navigation options layered on top of the shared route args. */
export type NavigateOptions = {
  scroll?: boolean;
};

export type NavigateArgs<TTree, TPath extends string> = RouteArgs<TTree, TPath> & NavigateOptions;

/**
 * Makes the argument object optional when the route requires nothing, so
 * `push('/cart')` is legal while `push('/products/[id]')` is a compile error.
 */
export type NavigateArgsTuple<TTree, TPath extends string> =
  HasRequiredKeys<RouteArgs<TTree, TPath>> extends true ? [args: NavigateArgs<TTree, TPath>] : [args?: NavigateArgs<TTree, TPath>];
