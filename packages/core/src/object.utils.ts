import { Paths, PathValue } from './path.types';
import { SearchParams } from './query.types';

export const getSafely = <TObject, TSplitter extends string, TPath extends string & Paths<TObject, TSplitter>>(
  splitter: TSplitter,
  obj: TObject,
  path: TPath,
): PathValue<TObject, TPath, TSplitter> => {
  if (path === '' || path === splitter) return obj as PathValue<TObject, TPath, TSplitter>;

  const keys = (path as string).split(splitter).filter((key) => key);
  let value: unknown = obj;

  for (const key of keys) {
    if (typeof value === 'object' && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined as PathValue<TObject, TPath, TSplitter>;
    }
  }

  return value as PathValue<TObject, TPath, TSplitter>;
};

export type SearchParamsStringOptions = {
  includeQuestionMark?: boolean;
};

export const toSearchParamsString = (
  searchParams: SearchParams,
  options: SearchParamsStringOptions = { includeQuestionMark: true },
): string => {
  const params: string[] = [];

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const encodedKey = encodeURIComponent(key);

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          params.push(`${encodedKey}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      params.push(`${encodedKey}=${encodeURIComponent(String(value))}`);
    }
  });

  if (params.length === 0) {
    return '';
  }

  const searchParamsString = params.join('&');
  return options.includeQuestionMark ? `?${searchParamsString}` : searchParamsString;
};

export const findObjectPath = <T>(
  root: Record<string, unknown>,
  target: T,
  splitter = '/',
  path = splitter,
): string | undefined => {
  for (const key in root) {
    const current = root[key];

    if (current === target) return path + key;

    if (typeof current === 'object' && current !== null) {
      const result = findObjectPath(current as Record<string, unknown>, target, splitter, path + key + splitter);
      if (result) return result;
    }
  }

  return undefined;
};

export type ReplaceDynamicSegmentsResult = {
  pathname: string;
  remainingParams: SearchParams;
};

const DYNAMIC_SEGMENT_REGEX = /\[([^\]]+)\]/g;

export const extractDynamicSegmentKeys = (pathname: string): string[] => {
  const matches = Array.from(pathname.matchAll(DYNAMIC_SEGMENT_REGEX));
  return matches.map((match) => match[1]);
};

export const replaceDynamicSegments = (
  pathname: string,
  params?: SearchParams,
): ReplaceDynamicSegmentsResult => {
  if (!params) {
    return {
      pathname,
      remainingParams: {},
    };
  }

  const usedKeys = new Set<string>();

  const replacedPathname = pathname.replace(DYNAMIC_SEGMENT_REGEX, (_, key) => {
    usedKeys.add(key);
    const value = params[key.toString()];
    if (value === undefined || value === null) return `[${key}]`;
    return Array.isArray(value) ? value.join(',') : value.toString();
  });

  const remainingParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => !usedKeys.has(key))
  ) as SearchParams;

  return {
    pathname: replacedPathname,
    remainingParams,
  };
};
