import type { Area } from "../../shared/api.ts";
import { pixelRect } from "./area.ts";

// A PNG with the part of the image the area covers, at the image's own resolution
// (pixelRect of naturalWidth × naturalHeight, drawn on a canvas of that size).
// null when the browser cannot make it.
export async function cropToPng(image: HTMLImageElement, area: Area): Promise<Blob | null> {
  try {
    if (image.naturalWidth === 0 || image.naturalHeight === 0) return null;
    const rect = pixelRect(area, { width: image.naturalWidth, height: image.naturalHeight });
    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    const context = canvas.getContext("2d");
    if (context === null) return null;
    context.drawImage(
      image,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height,
    );
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  } catch {
    return null;
  }
}
