import { type Image, ImageListSchema } from "../shared/api.ts";

export async function fetchImages(): Promise<Image[]> {
  const response = await fetch("/api/images");
  if (!response.ok) {
    throw new Error(`GET /api/images failed with status ${response.status}`);
  }
  return ImageListSchema.parse(await response.json()).images;
}
