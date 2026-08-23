import type { BuildHrefArgs, HasRequiredKeys, RouteArgs } from '@hyeonqyu/typed-router-core';
import type { NavigateOptions as ReactRouterNavigateOptions } from 'react-router-dom';

/** React Router navigation options, minus the ones this library derives for you. */
export type NavigateOptions = Omit<ReactRouterNavigateOptions, 'replace' | 'relative'>;

export type NavigateArgs<TTree, TPath extends string> = RouteArgs<TTree, TPath> & NavigateOptions;

/** What a navigation call carries once the typed wrapper has erased its pathname generic. */
export type RawNavigateArgs = BuildHrefArgs & NavigateOptions;

/**
 * Makes the argument object optional when the route requires nothing, so
 * `push('/cart')` is legal while `push('/products/[id]')` is a compile error.
 */
export type NavigateArgsTuple<TTree, TPath extends string> =
  HasRequiredKeys<RouteArgs<TTree, TPath>> extends true ? [args: NavigateArgs<TTree, TPath>] : [args?: NavigateArgs<TTree, TPath>];
