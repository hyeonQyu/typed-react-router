import type { ParsableSchema } from './schema.types';
import { isDefined, toBoolean, toNumber, validate as validateWith, type ValidationResult } from './schema.utils';

const validate = (schema: ParsableSchema, data: unknown) => validateWith(schema, data, 'path params');

/**
 * What to do when a path segment does not satisfy the schema its route declared.
 *
 * The same three modes as `parseSearchParams`' `onError`, so both halves of a URL
 * tell one story:
 *
 * - `throw`   — raise the validation error (default; surfaces bad links early)
 * - `default` — drop the offending segment, keeping whatever the schema still
 *               produces on its own (`.optional()`, `.default(...)`)
 * - `raw`     — return the decoded segment as-is instead of throwing
 */
export type PathParamsErrorMode = 'throw' | 'default' | 'raw';

export type ParsePathParamsOptions = {
  onError?: PathParamsErrorMode;
};

/** Path params as `matchRoute` produces them: decoded text, arrays for catch-alls. */
export type RawPathParams = Record<string, string | string[]>;

/** The schema each dynamic segment of a route declared, keyed by segment name. */
export type PathParamSchemas = Record<string, ParsableSchema>;

/**
 * Every plausible reading of one decoded path segment, most literal first.
 *
 * Deliberately narrower than the search-param candidates: a segment carries one
 * value, so there is no single-item-list reading, and `buildHref` refuses to write
 * an object into a segment, so there is no JSON reading to read back either.
 */
const scalarCandidates = (value: string): unknown[] => [value, toNumber(value), toBoolean(value)].filter(isDefined);

/** The same readings for a catch-all, which is a list of segments rather than one. */
const listCandidates = (values: string[]): unknown[] => {
  const readings: unknown[][] = [values, values.map(toNumber), values.map(toBoolean)];
  return readings.filter((reading) => reading.every(isDefined));
};

const candidatesFor = (value: string | string[]): unknown[] => (Array.isArray(value) ? listCandidates(value) : scalarCandidates(value));

/**
 * Reads one segment as the type its schema declares, by offering each candidate
 * reading until one is accepted — the same trick `parseSearchParams` uses per field.
 *
 * An absent value is validated too, so an optional catch-all that matched nothing
 * still picks up whatever the schema produces for `undefined`.
 */
const parseOne = (schema: ParsableSchema, value: string | string[] | undefined): ValidationResult => {
  if (value === undefined) return validate(schema, undefined);

  for (const candidate of candidatesFor(value)) {
    const result = validate(schema, candidate);
    if (result.ok) return result;
  }

  // No reading was accepted. Re-run the literal one so the error describes what was in the URL.
  return validate(schema, value);
};

export class PathParamsParseError extends Error {
  readonly cause: unknown;
  /** The segment that failed, e.g. `id` for `/products/[id]`. */
  readonly param: string;

  constructor(path: string, param: string, cause: unknown) {
    super(`typed-router: path param "${param}" for "${path}" failed validation.`);
    this.name = 'PathParamsParseError';
    this.param = param;
    this.cause = cause;
  }
}

/** Leaves the key absent rather than present-and-undefined, as an unmatched segment is. */
const assign = (target: Record<string, unknown>, name: string, value: unknown): void => {
  if (value !== undefined) target[name] = value;
};

/**
 * Validates a route's dynamic segments against the schemas they declared, coercing
 * the decoded text to the declared types first so the runtime value matches the
 * inferred type.
 *
 * Segments with no declared schema are passed through as the strings they are, so a
 * route that declares nothing behaves exactly as it did before schemas existed.
 */
export const parsePathParams = (
  schemas: PathParamSchemas,
  raw: RawPathParams,
  { onError = 'throw' }: ParsePathParamsOptions = {},
  path = '',
): Record<string, unknown> => {
  const names = new Set([...Object.keys(schemas), ...Object.keys(raw)]);
  const parsed: Record<string, unknown> = {};

  for (const name of names) {
    const schema = schemas[name];
    const value = raw[name];

    if (!schema) {
      assign(parsed, name, value);
      continue;
    }

    const result = parseOne(schema, value);

    if (result.ok) {
      assign(parsed, name, result.value);
      continue;
    }

    if (onError === 'throw') throw new PathParamsParseError(path, name, result.error);

    if (onError === 'raw') {
      assign(parsed, name, value);
      continue;
    }

    // `default`: drop the offending segment, but keep what the schema produces without it.
    const fallback = validate(schema, undefined);
    if (fallback.ok) assign(parsed, name, fallback.value);
  }

  return parsed;
};
