import { z } from "zod";

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_INTENT_LENGTH = 10_000;

export const ImageSchema = z.object({
  id: z.uuid(),
  originalName: z.string(),
  url: z.string(),
  selected: z.boolean(),
});
export const ImageListSchema = z.object({ images: z.array(ImageSchema) });
export const ErrorCodeSchema = z.enum([
  "unsupported-type",
  "too-large",
  "nothing-selected",
  "forbidden",
  "not-found",
  "invalid-request",
]);
export const ErrorSchema = z.object({ error: z.object({ code: ErrorCodeSchema }) });
export const SelectedBodySchema = z.object({ selected: z.boolean() });
// The body of PUT /api/draft/intent and the answer of GET /api/draft.
export const IntentSchema = z.object({ intent: z.string().max(MAX_INTENT_LENGTH) });
export const PackCreatedSchema = z.object({ path: z.string(), count: z.number().int().positive() });

export type Image = z.infer<typeof ImageSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type PackCreated = z.infer<typeof PackCreatedSchema>;
