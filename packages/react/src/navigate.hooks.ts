import { replaceDynamicSegments, SearchParams, SearchParamsForPath, toSearchParamsString } from '@hyeonqyu/typed-router-core';
import { NavigateOptions, useNavigate } from 'react-router-dom';

type TypedNavigateOptions<TSearchParams = SearchParams> = Omit<NavigateOptions, 'searchParams'> & {
  /** Custom typed search params */
  searchParams?: TSearchParams;
};

export const createTypedNavigate = <TPathname extends string = string, TRouteTree = unknown>() => {
  const getHrefWithSearchParams = (href: TPathname, searchParams?: SearchParams) => {
    const { pathname, remainingParams } = replaceDynamicSegments(href as string, searchParams);
    return `${pathname}${toSearchParamsString(remainingParams, { includeQuestionMark: true })}`;
  };

  return () => {
    const navigate = useNavigate();

    return <TPath extends TPathname>(href: TPath, options?: TypedNavigateOptions<SearchParamsForPath<TRouteTree, TPath>>) => {
      const finalHref = getHrefWithSearchParams(href, options?.searchParams as SearchParams);
      return navigate(finalHref, options);
    };
  };
};
