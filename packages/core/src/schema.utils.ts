import type { ParsableSchema } from './schema.types';

/**
 * The runtime half of the schema story, shared by search params and path params.
 *
 * Both halves of a URL arrive as text and have to be handed to a validator that was
 * written for real types. These helpers are the part that does not care which half
 * it is looking at: how to read a string as something else, and how to ask a schema
 * — Zod v3, Zod v4 or any Standard Schema validator — whether it accepts a value.
 */

export type ValidationResult = { ok: true; value: unknown } | { ok: false; error: unknown };

export const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

export const toNumber = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const toBoolean = (value: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

/**
 * Asks a schema whether it accepts a value, without knowing which library wrote it.
 *
 * `subject` names the half of the URL being validated, so the one thing we cannot
 * support — asynchronous validation, since these are synchronous read paths — says
 * which call it came from.
 */
export const validate = (schema: ParsableSchema, data: unknown, subject: string): ValidationResult => {
  if (typeof schema.safeParse === 'function') {
    const result = schema.safeParse(data);
    return result.success ? { ok: true, value: result.data } : { ok: false, error: result.error };
  }

  const standard = schema['~standard'];
  if (standard && typeof standard.validate === 'function') {
    const result = standard.validate(data);

    if (result instanceof Promise) {
      throw new Error(`typed-router: asynchronous schema validation is not supported for ${subject}.`);
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

/** The per-field schemas of an object schema, when the validator exposes them. */
export const getShape = (schema: ParsableSchema): Record<string, ParsableSchema> | undefined => {
  const shape = schema.shape;
  return shape && typeof shape === 'object' ? shape : undefined;
};
