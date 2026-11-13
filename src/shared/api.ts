import { z } from "zod";

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_INTENT_LENGTH = 10_000;
export const MAX_NOTE_LENGTH = 10_000;
export const MAX_COMMENT_LENGTH = 2_000;
export const MAX_TAG_LENGTH = 60;
export const MAX_CROP_BYTES = 100 * 1024 * 1024;

export const MarkKindSchema = z.enum(["like", "dislike"]);
// The four edges of a mark, as fractions (0 to 1) of the image's width and height.
export const AreaSchema = z
  .object({
    left: z.number().min(0).max(1),
    top: z.number().min(0).max(1),
    right: z.number().min(0).max(1),
    bottom: z.number().min(0).max(1),
  })
  .refine((area) => area.left < area.right && area.top < area.bottom);
export const MarkSchema = z.object({
  id: z.uuid(),
  kind: MarkKindSchema,
  area: AreaSchema,
  comment: z.string(),
});
// The body of PUT /api/marks/:id/kind.
export const MarkKindBodySchema = z.object({ kind: MarkKindSchema });
// The body of PUT /api/marks/:id/comment.
export const MarkCommentSchema = z.object({ comment: z.string().max(MAX_COMMENT_LENGTH) });

export const TagSchema = z.object({ id: z.uuid(), name: z.string() });
// The body of POST /api/images/:id/tags. Spaces at both ends are not part of the tag.
export const TagBodySchema = z.object({ name: z.string().trim().min(1).max(MAX_TAG_LENGTH) });
// The body of PUT /api/draft/selection: every image, or only those with the tag.
export const SelectionBodySchema = z.object({ selected: z.boolean(), tagId: z.uuid().optional() });

export const ImageSchema = z.object({
  id: z.uuid(),
  originalName: z.string(),
  url: z.string(),
  selected: z.boolean(),
  note: z.string(),
  marks: z.array(MarkSchema),
  tags: z.array(TagSchema),
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
// The body of PUT /api/images/:id/note.
export const NoteSchema = z.object({ note: z.string().max(MAX_NOTE_LENGTH) });
export const PackCreatedSchema = z.object({ path: z.string(), count: z.number().int().positive() });

export type Image = z.infer<typeof ImageSchema>;
export type MarkKind = z.infer<typeof MarkKindSchema>;
export type Area = z.infer<typeof AreaSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type Mark = z.infer<typeof MarkSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type PackCreated = z.infer<typeof PackCreatedSchema>;
