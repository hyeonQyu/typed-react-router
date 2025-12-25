import { Paths, PathValue } from './path.types';
import { QueryParams } from './query.types';

export const getSafely = <TObject, TSplitter extends string, TPath extends string & Paths<TObject, TSplitter>>(
  splitter: TSplitter,
  obj: TObject,
  path: TPath,
): PathValue<TObject, TPath, TSplitter> => {
  if (path === '' || path === splitter) return obj as PathValue<TObject, TPath, TSplitter>;

  const keys = (path as string).split(splitter);
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

export type QueryStringOptions = {
  includeQuestionMark?: boolean;
};

export const toQueryString = (query: QueryParams, options: QueryStringOptions = { includeQuestionMark: true }): string => {
  const params: string[] = [];

  Object.entries(query).forEach(([key, value]) => {
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

  const queryString = params.join('&');
  return options.includeQuestionMark ? `?${queryString}` : queryString;
};
