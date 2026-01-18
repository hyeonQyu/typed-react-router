import { extractDynamicSegmentKeys, type SearchParamsForPath } from '@hyeonqyu/typed-router-core';
import { useParams, useSearchParams } from 'next/navigation';

type ParseOptions = {
  /**
   * Error handling mode
   * - 'throw': Throw error on validation failure
   * - 'default': Return schema defaults on validation failure
   * - 'raw': Return raw unparsed values on validation failure
   */
  onError?: 'throw' | 'default' | 'raw';
};

export const createTypedSearchParams = <TPathname extends string = string, TRouteTree = unknown>() => {
  return <T extends TPathname>(pathname: T, _options?: ParseOptions) => {
    const searchParams = useSearchParams();
    const pathParams = useParams();

    type ExpectedParams = SearchParamsForPath<TRouteTree, T>;

    const queryParams: Record<string, unknown> = {};
    searchParams.forEach((value, key) => {
      const existing = queryParams[key];
      if (existing !== undefined) {
        // Handle multiple values for the same key
        queryParams[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        queryParams[key] = value;
      }
    });

    const dynamicKeys = extractDynamicSegmentKeys(pathname as string);

    const routeParams: Record<string, unknown> = {};
    dynamicKeys.forEach((key) => {
      if (pathParams[key] !== undefined) {
        routeParams[key] = pathParams[key];
      }
    });

    return { ...queryParams, ...routeParams } as ExpectedParams;
  };
};
