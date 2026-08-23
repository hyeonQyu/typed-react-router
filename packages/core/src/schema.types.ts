/**
 * Structural description of a validation schema.
 *
 * Deliberately does not import any validation library: it matches Zod v3, Zod v4
 * and any Standard Schema (https://standardschema.dev) validator by shape alone,
 * so `zod` stays an optional peer dependency.
 */
export type AnySchema = {
  _input?: unknown;
  _output?: unknown;
  ['~standard']?: unknown;
};

/**
 * The type a schema accepts. Used when *writing* search params (navigation),
 * so fields with `.default()` stay optional at the call site.
 */
export type InferSchemaInput<TSchema> = TSchema extends { _input: infer TInput }
  ? TInput
  : TSchema extends { ['~standard']: { types?: { input: infer TInput } | undefined } }
    ? TInput
    : never;

/**
 * The type a schema produces. Used when *reading* search params, so defaults and
 * transforms are reflected in what the hook returns.
 */
export type InferSchemaOutput<TSchema> = TSchema extends { _output: infer TOutput }
  ? TOutput
  : TSchema extends { ['~standard']: { types?: { output: infer TOutput } | undefined } }
    ? TOutput
    : never;

/** Runtime view of a schema that can validate a whole object. */
export type ParsableSchema = {
  parse?: (data: unknown) => unknown;
  safeParse?: (data: unknown) => { success: boolean; data?: unknown; error?: unknown };
  shape?: Record<string, ParsableSchema>;
  ['~standard']?: {
    validate: (value: unknown) => { value?: unknown; issues?: readonly unknown[] } | Promise<unknown>;
  };
};
