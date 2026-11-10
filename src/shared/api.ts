import { z } from "zod";

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

export const ImageSchema = z.object({ id: z.uuid(), originalName: z.string(), url: z.string() });
export const ImageListSchema = z.object({ images: z.array(ImageSchema) });
export const ErrorCodeSchema = z.enum([
  "unsupported-type",
  "too-large",
  "empty-library",
  "forbidden",
  "not-found",
]);
export const ErrorSchema = z.object({ error: z.object({ code: ErrorCodeSchema }) });
export const PackCreatedSchema = z.object({ path: z.string(), count: z.number().int().positive() });

export type Image = z.infer<typeof ImageSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type PackCreated = z.infer<typeof PackCreatedSchema>;
