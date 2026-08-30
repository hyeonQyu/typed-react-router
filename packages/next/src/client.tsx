'use client';

import type { ParsePathParamsOptions, ParseSearchParamsOptions, RouteMetadata, RouteTree } from '@hyeonqyu/typed-router-core';
import { buildHref, type BuildHrefArgs } from '@hyeonqyu/typed-router-core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { NavigateOptions } from './navigation.types';

/**
 * The client half of the adapter, behind its own `'use client'` boundary.
 *
 * These are plain functions taking the route tree as their first argument rather than
 * a factory, so `defineRoutes` can reference them from a server-safe module without
 * ever calling them during server render.
 */

export type RawCurrentRoute = {
  pathname: string | null;
  url: string;
  node: unknown;
  metadata: RouteMetadata | null;
  params: Record<string, string | string[]>;
};

export const useCurrentRouteImpl = (routes: RouteTree<unknown>): RawCurrentRoute => {
  const url = usePathname() ?? '';

  return useMemo(() => {
    const matched = routes.match(url);

    return {
      pathname: matched?.path ?? null,
      url,
      node: matched?.node ?? null,
      metadata: (matched?.metadata as RouteMetadata | undefined) ?? null,
      params: matched?.params ?? {},
    };
  }, [routes, url]);
};

export const useTypedSearchParamsImpl = (routes: RouteTree<unknown>, pathname: string, options?: ParseSearchParamsOptions): unknown => {
  const searchParams = useSearchParams();
  const onError = options?.onError;
  const parse = routes.parseSearchParams as ParseUntyped;

  return useMemo(
    () => parse(pathname, searchParams ? Array.from(searchParams.entries()) : [], { onError }),
    [parse, pathname, searchParams, onError],
  );
};

type ParseUntyped = (path: string, raw: Iterable<[string, string]>, options?: ParseSearchParamsOptions) => unknown;

export const useTypedParamsImpl = (routes: RouteTree<unknown>, pathname: string, options?: ParsePathParamsOptions): unknown => {
  const { params } = useCurrentRouteImpl(routes);
  const onError = options?.onError;
  const parse = routes.parseParams as ParseParamsUntyped;

  return useMemo(() => parse(pathname, params, { onError }), [parse, pathname, params, onError]);
};

type ParseParamsUntyped = (
  path: string,
  raw: Record<string, string | string[]>,
  options?: ParsePathParamsOptions,
) => Record<string, unknown>;

/** What a navigation call carries once the typed wrapper has erased its pathname generic. */
export type RawNavigateArgs = BuildHrefArgs & NavigateOptions;

export type RawTypedRouter = {
  push: (pathname: string, args?: RawNavigateArgs) => void;
  replace: (pathname: string, args?: RawNavigateArgs) => void;
  prefetch: (pathname: string, args?: RawNavigateArgs) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
};

export const useTypedRouterImpl = (): RawTypedRouter => {
  const router = useRouter();

  return useMemo(() => {
    const toHref = (pathname: string, args?: RawNavigateArgs) => buildHref(pathname, args);

    return {
      push: (pathname, args) => router.push(toHref(pathname, args), { scroll: args?.scroll }),
      replace: (pathname, args) => router.replace(toHref(pathname, args), { scroll: args?.scroll }),
      prefetch: (pathname, args) => router.prefetch(toHref(pathname, args)),
      back: () => router.back(),
      forward: () => router.forward(),
      refresh: () => router.refresh(),
    };
  }, [router]);
};
