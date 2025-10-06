import { ZodError, z } from 'zod';

const PROMPT_TITLE_MAX_LENGTH = 120;
const PROMPT_BODY_MAX_LENGTH = 8000;
const PROMPT_VARIABLE_LIMIT = 50;
const PROMPT_VARIABLE_KEY_MAX_LENGTH = 1000;
const PROMPT_VARIABLE_VALUE_MAX_LENGTH = 1000;
const PROMPT_TAG_MAX = 10;
const PROMPT_TAG_MAX_LENGTH = 32;
const PROMPT_NOTES_MAX_LENGTH = 4000;

const variableKeySchema = z
  .string()
  .min(1, 'Variable names must contain at least one character.')
  .max(
    PROMPT_VARIABLE_KEY_MAX_LENGTH,
    `Variable names must be ${PROMPT_VARIABLE_KEY_MAX_LENGTH} characters or fewer.`,
  );

const variableValueSchema = z
  .string()
  .max(
    PROMPT_VARIABLE_VALUE_MAX_LENGTH,
    `Variable values must be ${PROMPT_VARIABLE_VALUE_MAX_LENGTH} characters or fewer.`,
  );

const variablesSchema = z
  .record(variableKeySchema, variableValueSchema)
  .superRefine((value, ctx) => {
    const entries = Object.entries(value);
    if (entries.length > PROMPT_VARIABLE_LIMIT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Provide ${PROMPT_VARIABLE_LIMIT} variables or fewer.`,
      });
    }
  });

const tagInputSchema = z
  .string()
  .trim()
  .min(1, 'Tags must not be empty.')
  .max(PROMPT_TAG_MAX_LENGTH, `Tags must be ${PROMPT_TAG_MAX_LENGTH} characters or fewer.`);

export const promptCreationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required.')
      .max(PROMPT_TITLE_MAX_LENGTH, `Title must be ${PROMPT_TITLE_MAX_LENGTH} characters or fewer.`),
    body: z
      .string()
      .min(1, 'Body is required.')
      .max(PROMPT_BODY_MAX_LENGTH, `Body must be ${PROMPT_BODY_MAX_LENGTH} characters or fewer.`),
    variables: variablesSchema.optional(),
    tags: z.array(tagInputSchema).max(PROMPT_TAG_MAX, `Provide ${PROMPT_TAG_MAX} tags or fewer.`).optional(),
    logging: z.boolean().optional(),
    teamId: z.string().trim().min(1).optional().nullable(),
    notes: z
      .string()
      .max(
        PROMPT_NOTES_MAX_LENGTH,
        `Notes must be ${PROMPT_NOTES_MAX_LENGTH} characters or fewer.`,
      )
      .optional()
      .transform((value) => value?.trim())
      .nullable(),
  })
  .strict();

export const promptRunSchema = z
  .object({
    variables: variablesSchema.optional(),
  })
  .strict();

export type PromptCreationInput = z.infer<typeof promptCreationSchema>;
export type PromptRunInput = z.infer<typeof promptRunSchema>;

export function normalizeTagName(name: string): string {
  return name.normalize('NFKC').trim().toLowerCase();
}

export function normalizeTags(tags?: string[]): string[] {
  if (!tags) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const normalized = normalizeTagName(tag);
    if (!normalized) {
      continue;
    }
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

export function formatValidationError(error: ZodError) {
  const flattened = error.flatten();
  return {
    error: {
      fieldErrors: flattened.fieldErrors,
      formErrors: flattened.formErrors,
    },
  };
}

export function logValidationFailure(scope: string, error: ZodError) {
  console.warn(`[validation] ${scope} failed`, {
    issues: error.issues.map((issue) => ({
      code: issue.code,
      path: issue.path.join('.') || '(root)',
    })),
  });
}
