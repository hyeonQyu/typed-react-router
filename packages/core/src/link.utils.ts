import { type SearchParams } from './query.types';
import { type SearchParamsForPath } from './routes.types';
import { replaceDynamicSegments, toSearchParamsString } from './object.utils';

export type TypedLinkHrefObject<TPathname extends string = string, TRouteTree = unknown> =
  TPathname extends infer TPath
    ? {
        pathname: TPath;
        searchParams?: SearchParamsForPath<TRouteTree, TPath & string>;
        hash?: string;
      }
    : never;

export const buildTypedHref = (
  pathname: string,
  searchParams?: SearchParams,
  hash?: string,
): string => {
  const { pathname: replacedPathname, remainingParams } = replaceDynamicSegments(pathname, searchParams);
  const queryString = toSearchParamsString(remainingParams, { includeQuestionMark: true });
  return `${replacedPathname}${queryString}${hash ?? ''}`;
};
