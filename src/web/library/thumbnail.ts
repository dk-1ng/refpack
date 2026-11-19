export const THUMB_SIZE = 384;

// The centre square of a width × height image, and the side of the thumbnail drawn from it.
export function centreSquare(
  width: number,
  height: number,
): { x: number; y: number; side: number; size: number } {
  const side = Math.min(width, height);
  return {
    x: Math.floor((width - side) / 2),
    y: Math.floor((height - side) / 2),
    side,
    size: Math.min(THUMB_SIZE, side),
  };
}

// The thumbnail of an image file: the centre square on a size × size canvas, as WebP (the browser
// may hand back PNG instead). null when the image cannot be read or drawn; never throws.
export async function makeThumbnail(file: Blob): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const { x, y, side, size } = centreSquare(bitmap.width, bitmap.height);
      if (side <= 0) return null;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (context === null) return null;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, x, y, side, side, 0, 0, size, size);
      return await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.85),
      );
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
}
