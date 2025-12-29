import { SearchParams, SearchParamsForPath, toSearchParamsString } from '@hyeonqyu/typed-router-core';
import { useRouter } from 'next/navigation';

type NavigateOptions<TSearchParams = SearchParams> = {
  scroll?: boolean;
  searchParams?: TSearchParams;
};

type PrefetchOptions<TSearchParams = SearchParams> = Pick<NavigateOptions<TSearchParams>, 'searchParams'>;

export const createTypedRouter = <TPathname extends string = string, TRouteTree = unknown>() => {
  const getHrefWithSearchParams = (href: TPathname, searchParams?: SearchParams) => {
    return `${href}${toSearchParamsString(searchParams ?? {}, { includeQuestionMark: true })}`;
  };

  return () => {
    const router = useRouter();

    return {
      back: router.back,
      forward: router.forward,
      refresh: router.refresh,
      push: <TPath extends TPathname>(href: TPath, options?: NavigateOptions<SearchParamsForPath<TRouteTree, TPath>>) => {
        return router.push(getHrefWithSearchParams(href, options?.searchParams as SearchParams), options);
      },
      replace: <TPath extends TPathname>(href: TPath, options?: NavigateOptions<SearchParamsForPath<TRouteTree, TPath>>) => {
        return router.replace(getHrefWithSearchParams(href, options?.searchParams as SearchParams), options);
      },
      prefetch: <TPath extends TPathname>(href: TPath, options?: PrefetchOptions<SearchParamsForPath<TRouteTree, TPath>>) => {
        return router.prefetch(getHrefWithSearchParams(href, options?.searchParams as SearchParams));
      },
    };
  };
};
