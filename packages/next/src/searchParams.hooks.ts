import type { AnyZodSchema, SearchParamsForPath } from '@hyeonqyu/typed-router-core';
import { useSearchParams } from 'next/navigation';

type ParseOptions = {
  /**
   * Error handling mode
   * - 'throw': Throw error on validation failure
   * - 'default': Return schema defaults on validation failure
   * - 'raw': Return raw unparsed values on validation failure
   */
  onError?: 'throw' | 'default' | 'raw';
  /**
   * Zod schema for parsing and validation
   */
  schema?: AnyZodSchema;
};

export const createTypedSearchParams = <TRouteTree = unknown, TPathname extends string = string>() => {
  return (_pathname: TPathname, options?: ParseOptions) => {
    const searchParams = useSearchParams();

    type ExpectedParams = SearchParamsForPath<TRouteTree, TPathname>;

    const rawParamsArrays = Array.from(searchParams.entries()).reduce<Record<string, string[]>>((acc, [key, value]) => {
      (acc[key] ||= []).push(value);
      return acc;
    }, {});

    if (options?.schema) {
      try {
        const rawParams = Object.entries(rawParamsArrays).reduce<Record<string, unknown>>((acc, [key, values]) => {
          acc[key] = values.length === 1 ? values[0] : values;
          return acc;
        }, {});

        const parsed = options.schema.parse(rawParams);
        return parsed as ExpectedParams;
      } catch (error) {
        if (options?.onError === 'throw' || !options?.onError) {
          throw error;
        }
        if (options.onError === 'default') {
          try {
            return options.schema.parse({}) as ExpectedParams;
          } catch {
            return {} as ExpectedParams;
          }
        }
      }
    }

    const rawParams = Object.entries(rawParamsArrays).reduce<Record<string, unknown>>((acc, [key, values]) => {
      acc[key] = values.length === 1 ? values[0] : values;
      return acc;
    }, {});

    return rawParams as ExpectedParams;
  };
};
