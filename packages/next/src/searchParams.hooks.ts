import type { SearchParamsForPath } from '@hyeonqyu/typed-router-core';
import { useSearchParams } from 'next/navigation';

type ParseOptions = {
  /**
   * Error handling mode
   * - 'throw': Throw error on validation failure
   * - 'default': Return schema defaults on validation failure
   * - 'raw': Return raw unparsed values on validation failure
   */
  onError?: 'throw' | 'default' | 'raw';
};

export const createTypedSearchParams = <TRouteTree = unknown, TPathname extends string = string>() => {
  return (_pathname: TPathname, _options?: ParseOptions) => {
    const searchParams = useSearchParams();

    type ExpectedParams = SearchParamsForPath<TRouteTree, TPathname>;

    // Convert URLSearchParams to plain object
    const rawParams: Record<string, unknown> = {};
    searchParams.forEach((value, key) => {
      const existing = rawParams[key];
      if (existing !== undefined) {
        // Handle multiple values for the same key
        rawParams[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        rawParams[key] = value;
      }
    });

    // For now, return raw params as ExpectedParams
    // When schema is available at runtime, we would parse with Zod here
    return rawParams as ExpectedParams;
  };
};
