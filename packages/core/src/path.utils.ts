import type { PathParamValue } from './path.types';
import type { RouteMetadata, RouteNodeInput } from './tree.types';

export const METADATA_KEY = '_metadata';

export type SegmentPattern =
  | { kind: 'static'; value: string }
  | { kind: 'dynamic'; name: string }
  | { kind: 'catchAll'; name: string }
  | { kind: 'optionalCatchAll'; name: string };

const OPTIONAL_CATCH_ALL = /^\[\[\.\.\.(.+)\]\]$/;
const CATCH_ALL = /^\[\.\.\.(.+)\]$/;
const DYNAMIC = /^\[(.+)\]$/;

/** A key wrapped in parentheses organises the tree without adding a URL segment. */
export const isRouteGroup = (key: string): boolean => key.startsWith('(') && key.endsWith(')');

export const parseSegment = (segment: string): SegmentPattern => {
  const optionalCatchAll = OPTIONAL_CATCH_ALL.exec(segment);
  if (optionalCatchAll) return { kind: 'optionalCatchAll', name: optionalCatchAll[1] };

  const catchAll = CATCH_ALL.exec(segment);
  if (catchAll) return { kind: 'catchAll', name: catchAll[1] };

  const dynamic = DYNAMIC.exec(segment);
  if (dynamic) return { kind: 'dynamic', name: dynamic[1] };

  return { kind: 'static', value: segment };
};

export const splitPath = (path: string): string[] => path.split('/').filter(Boolean);

export type RouteParams = Record<string, PathParamValue | readonly PathParamValue[]>;

export type CollectedRoute = {
  /** The declared pathname, e.g. `/products/[id]` — route groups removed. */
  path: string;
  segments: SegmentPattern[];
  node: RouteNodeInput;
  metadata: RouteMetadata | undefined;
};

/**
 * Walks the tree and lists every navigable route (a node declaring `_metadata`),
 * skipping route-group keys so `(auth)/login` is reachable at `/login`.
 */
export const collectRoutes = (tree: unknown, basePath = ''): CollectedRoute[] => {
  const routes: CollectedRoute[] = [];

  const walk = (node: unknown, currentPath: string) => {
    if (typeof node !== 'object' || node === null) return;

    for (const [key, child] of Object.entries(node)) {
      if (key === METADATA_KEY) continue;
      if (typeof child !== 'object' || child === null) continue;

      const childPath = isRouteGroup(key) ? currentPath : `${currentPath}/${key}`;
      const childNode = child as RouteNodeInput;

      if (!isRouteGroup(key) && METADATA_KEY in childNode) {
        routes.push({
          path: childPath,
          segments: splitPath(childPath).map(parseSegment),
          node: childNode,
          metadata: childNode[METADATA_KEY] as RouteMetadata | undefined,
        });
      }

      walk(child, childPath);
    }
  };

  walk(tree, basePath);
  return routes;
};

export type RouteMatch = {
  path: string;
  node: RouteNodeInput;
  metadata: RouteMetadata | undefined;
  params: Record<string, string | string[]>;
};

const SEGMENT_SCORE: Record<SegmentPattern['kind'], number> = {
  static: 3,
  dynamic: 2,
  catchAll: 1,
  optionalCatchAll: 1,
};

const matchSegments = (
  patterns: SegmentPattern[],
  parts: string[],
): { params: Record<string, string | string[]>; score: number } | null => {
  const params: Record<string, string | string[]> = {};
  let score = 0;
  let index = 0;

  for (const pattern of patterns) {
    score += SEGMENT_SCORE[pattern.kind];

    if (pattern.kind === 'static') {
      if (parts[index] !== pattern.value) return null;
      index += 1;
      continue;
    }

    if (pattern.kind === 'dynamic') {
      if (index >= parts.length) return null;
      params[pattern.name] = safeDecode(parts[index]);
      index += 1;
      continue;
    }

    const rest = parts.slice(index).map(safeDecode);
    if (pattern.kind === 'catchAll' && rest.length === 0) return null;
    if (rest.length > 0) params[pattern.name] = rest;
    index = parts.length;
  }

  return index === parts.length ? { params, score } : null;
};

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Resolves a *live* URL (`/products/123`) back to the declared route (`/products/[id]`).
 * Static segments outrank dynamic ones, which outrank catch-alls.
 */
export const matchRoute = (routes: CollectedRoute[], url: string): RouteMatch | null => {
  const pathname = url.split('#')[0].split('?')[0];
  const parts = splitPath(pathname);

  let best: RouteMatch | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const route of routes) {
    const result = matchSegments(route.segments, parts);
    if (!result || result.score <= bestScore) continue;

    bestScore = result.score;
    best = { path: route.path, node: route.node, metadata: route.metadata, params: result.params };
  }

  return best;
};

/** Names a value in an error message without stringifying something unstringifiable. */
const describe = (value: unknown): string => {
  if (typeof value === 'number') return `the number ${value}`;
  if (typeof value === 'symbol') return 'a symbol';
  if (typeof value === 'function') return 'a function';
  if (typeof value === 'object' && value !== null) {
    const name = value.constructor?.name;
    return !name || name === 'Object' ? 'an object' : `a ${name}`;
  }
  return `a ${typeof value}`;
};

const isInvalidDate = (value: Date): boolean => Number.isNaN(value.getTime());

/** A value whose text form is faithful: it lands in the URL as itself, not as a summary of itself. */
const asPlainText = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : undefined;
  if (typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  if (value instanceof Date) return isInvalidDate(value) ? undefined : value.toISOString();
  return undefined;
};

/**
 * The text form a value declares for itself. An overridden `toString` is the author
 * saying what this value looks like as text — the same signal `toJSON` gives — so it
 * is honoured. The inherited `Object.prototype.toString`, which only ever yields
 * `[object Object]`, is not.
 */
const asDeclaredText = (value: object): string | undefined => {
  const { toString } = value as { toString?: unknown };
  if (typeof toString !== 'function' || toString === Object.prototype.toString) return undefined;

  try {
    const text = (value as { toString(): unknown }).toString();
    return typeof text === 'string' ? text : undefined;
  } catch {
    return undefined;
  }
};

/** A `Date` states its own text form, but the ISO one above is the reading we want. */
const isTextBearingObject = (value: unknown): value is object => typeof value === 'object' && value !== null && !(value instanceof Date);

/**
 * Serialises a value for a URL *path segment*. A segment carries text and reads back
 * as text, so only values with a faithful text form are accepted — anything else
 * would land in the URL as `[object Object]` or `NaN`.
 */
const serializePathParam = (value: unknown, path: string, name: string): string => {
  const text = asPlainText(value) ?? (isTextBearingObject(value) ? asDeclaredText(value) : undefined);
  if (text !== undefined) return text;

  throw new Error(
    `typed-router: route param "${name}" for "${path}" cannot be serialised (${describe(value)}). ` +
      'Path segments carry text — pass a string, number or boolean.',
  );
};

const isPlainObject = (value: object): boolean => {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const hasToJSON = (value: object): boolean => typeof (value as { toJSON?: unknown }).toJSON === 'function';

/**
 * Serialises a value for a *search param*. Scalars keep their plain text form;
 * objects and nested arrays are written as JSON so `parseSearchParams` can read
 * them back as what they were; a value that declares its own text form keeps it.
 * A value that would only survive as a summary of itself — `NaN`, a symbol, a
 * `Map` — throws instead of corrupting the URL.
 */
const serializeSearchParam = (value: unknown, key: string, path: string): string => {
  const text = asPlainText(value);
  if (text !== undefined) return text;

  if (isTextBearingObject(value)) {
    if (Array.isArray(value) || isPlainObject(value) || hasToJSON(value)) {
      try {
        const json = JSON.stringify(value);
        if (json !== undefined) return json;
      } catch {
        // A cycle or a bigint inside — fall through to the error below.
      }
    } else {
      const declared = asDeclaredText(value);
      if (declared !== undefined) return declared;
    }
  }

  const where = path ? `"${key}" for "${path}"` : `"${key}"`;
  throw new Error(
    `typed-router: search param ${where} cannot be serialised (${describe(value)}). ` +
      'Convert it to a string, number, boolean, or a JSON-serialisable object first.',
  );
};

export const toSearchParamsString = (searchParams: Record<string, unknown> | undefined, path = ''): string => {
  if (!searchParams) return '';

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) params.append(key, serializeSearchParam(item, key, path));
      }
      continue;
    }

    params.append(key, serializeSearchParam(value, key, path));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export type BuildHrefArgs = {
  params?: RouteParams;
  searchParams?: Record<string, unknown>;
  hash?: string;
};

/** Fills the dynamic segments of a declared path and appends the query string and hash. */
export const buildHref = (path: string, args?: BuildHrefArgs): string => {
  const parts: string[] = [];

  for (const segment of splitPath(path)) {
    const pattern = parseSegment(segment);

    if (pattern.kind === 'static') {
      parts.push(pattern.value);
      continue;
    }

    const value = args?.params?.[pattern.name];

    if (pattern.kind === 'dynamic') {
      if (value === undefined || value === null) {
        throw new Error(`typed-router: missing route param "${pattern.name}" for "${path}".`);
      }
      parts.push(encodeURIComponent(serializePathParam(value, path, pattern.name)));
      continue;
    }

    if (value === undefined || value === null) {
      if (pattern.kind === 'catchAll') {
        throw new Error(`typed-router: missing catch-all route param "${pattern.name}" for "${path}".`);
      }
      continue;
    }

    for (const item of Array.isArray(value) ? value : [value]) {
      parts.push(encodeURIComponent(serializePathParam(item, path, pattern.name)));
    }
  }

  const pathname = `/${parts.join('/')}`;
  const hash = args?.hash ? (args.hash.startsWith('#') ? args.hash : `#${args.hash}`) : '';

  return `${pathname}${toSearchParamsString(args?.searchParams, path)}${hash}`;
};
