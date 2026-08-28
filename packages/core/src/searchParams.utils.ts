import type { ParsableSchema } from './schema.types';

/**
 * What to do when the URL does not satisfy the route's schema.
 *
 * - `throw`   — raise the validation error (default; surfaces bad links early)
 * - `default` — drop the offending fields and keep whatever still validates
 * - `raw`     — skip validation and return the coerced values as-is
 */
export type SearchParamsErrorMode = 'throw' | 'default' | 'raw';

export type ParseSearchParamsOptions = {
  onError?: SearchParamsErrorMode;
};

export type RawSearchParams = Record<string, string | string[]>;

/** Collects a `URLSearchParams`-like object, folding repeated keys into arrays. */
export const collectRawSearchParams = (source: Iterable<[string, string]>): RawSearchParams => {
  const raw: RawSearchParams = {};

  for (const [key, value] of source) {
    const existing = raw[key];
    if (existing === undefined) {
      raw[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      raw[key] = [existing, value];
    }
  }

  return raw;
};

const toNumber = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toBoolean = (value: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const isDefined = <T,>(value: T | undefined): value is T => value !== undefined;

/**
 * `buildHref` writes objects and nested arrays as JSON, so a value shaped like one
 * gets a decoded reading too. Only `{` and `[` prefixes qualify: that covers exactly
 * what the write path encodes, and leaves every scalar reading — including a
 * `z.string()` field's raw string — ahead of it, untouched.
 */
const toJson = (value: string): unknown | undefined => {
  const trimmed = value.trim();
  if (trimmed[0] !== '{' && trimmed[0] !== '[') return undefined;

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
};

const scalarReadings = (value: string): unknown[] => [value, toNumber(value), toBoolean(value), toJson(value)].filter(isDefined);

const listReadings = (values: string[]): unknown[] => {
  const readings: unknown[][] = [values, values.map(toNumber), values.map(toBoolean), values.map(toJson)];
  return readings.filter((reading) => reading.every(isDefined));
};

/**
 * Every plausible reading of a raw URL value, ordered from most literal to most
 * converted. The field schema decides which one is right, so a `z.string()` field
 * keeps `"123"` as a string while a `z.number()` field gets `123`.
 */
const candidatesFor = (value: string | string[]): unknown[] => {
  if (Array.isArray(value)) return listReadings(value);

  const readings = scalarReadings(value);
  const asSingleItemList = readings.map((reading) => [reading]);

  return [...readings, ...asSingleItemList];
};

type ValidationResult = { ok: true; value: unknown } | { ok: false; error: unknown };

const validate = (schema: ParsableSchema, data: unknown): ValidationResult => {
  if (typeof schema.safeParse === 'function') {
    const result = schema.safeParse(data);
    return result.success ? { ok: true, value: result.data } : { ok: false, error: result.error };
  }

  const standard = schema['~standard'];
  if (standard && typeof standard.validate === 'function') {
    const result = standard.validate(data);

    if (result instanceof Promise) {
      throw new Error('typed-router: asynchronous schema validation is not supported for search params.');
    }

    return result.issues && result.issues.length > 0 ? { ok: false, error: result.issues } : { ok: true, value: result.value };
  }

  if (typeof schema.parse === 'function') {
    try {
      return { ok: true, value: schema.parse(data) };
    } catch (error) {
      return { ok: false, error };
    }
  }

  return { ok: true, value: data };
};

const getShape = (schema: ParsableSchema): Record<string, ParsableSchema> | undefined => {
  const shape = schema.shape;
  return shape && typeof shape === 'object' ? shape : undefined;
};

/**
 * Turns raw URL strings into the types the schema expects, by asking each field's
 * own schema which reading it accepts. Needs no knowledge of the validation
 * library beyond `.shape` and a validate method.
 */
const coerce = (schema: ParsableSchema, raw: RawSearchParams): Record<string, unknown> => {
  const shape = getShape(schema);
  if (!shape) return { ...raw };

  const coerced: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const field = shape[key];

    if (!field) {
      coerced[key] = value;
      continue;
    }

    const match = candidatesFor(value).find((candidate) => validate(field, candidate).ok);
    coerced[key] = match === undefined ? value : match;
  }

  return coerced;
};

/** Keeps only the entries that individually satisfy their field schema. */
const keepValidFields = (schema: ParsableSchema, coerced: Record<string, unknown>): Record<string, unknown> => {
  const shape = getShape(schema);
  if (!shape) return {};

  const kept: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(coerced)) {
    const field = shape[key];
    if (field && validate(field, value).ok) kept[key] = value;
  }

  return kept;
};

export class SearchParamsParseError extends Error {
  readonly cause: unknown;

  constructor(path: string, cause: unknown) {
    super(`typed-router: search params for "${path}" failed validation.`);
    this.name = 'SearchParamsParseError';
    this.cause = cause;
  }
}

/**
 * Validates raw URL search params against a route's schema, coercing strings to
 * the declared types first so the runtime value matches the inferred type.
 *
 * Without a schema the raw values are returned untouched.
 */
export const parseSearchParams = (
  schema: ParsableSchema | undefined,
  raw: RawSearchParams,
  { onError = 'throw' }: ParseSearchParamsOptions = {},
  path = '',
): Record<string, unknown> => {
  if (!schema) return { ...raw };

  const coerced = coerce(schema, raw);
  const result = validate(schema, coerced);

  if (result.ok) return result.value as Record<string, unknown>;

  if (onError === 'throw') throw new SearchParamsParseError(path, result.error);
  if (onError === 'raw') return coerced;

  const salvaged = validate(schema, keepValidFields(schema, coerced));
  if (salvaged.ok) return salvaged.value as Record<string, unknown>;

  const defaults = validate(schema, {});
  return defaults.ok ? (defaults.value as Record<string, unknown>) : coerced;
};
