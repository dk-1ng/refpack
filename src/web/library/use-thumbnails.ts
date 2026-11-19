import { useEffect, useRef } from "react";
import type { Image } from "../../shared/api.ts";
import { uploadThumbnail } from "../api.ts";
import { makeThumbnail } from "./thumbnail.ts";

// While the screen is open, makes the missing thumbnails one at a time, in the order of `images`
// (ADR-0020, item 2). Each image is tried once per page load, whatever the outcome.
export function useThumbnails(
  images: Image[] | null,
  onThumb: (id: string, thumbUrl: string) => void,
): void {
  const latest = useRef<Image[] | null>(images);
  const onThumbRef = useRef(onThumb);
  const tried = useRef(new Set<string>());
  const running = useRef(false);
  latest.current = images;
  onThumbRef.current = onThumb;

  useEffect(() => {
    if (images === null || running.current) return;
    running.current = true;
    void (async () => {
      try {
        for (;;) {
          const next = latest.current?.find(
            (image) => image.thumbUrl === null && !tried.current.has(image.id),
          );
          if (next === undefined) return;
          tried.current.add(next.id);
          try {
            const response = await fetch(next.url);
            if (!response.ok) continue;
            const thumb = await makeThumbnail(await response.blob());
            if (thumb === null) continue;
            const thumbUrl = await uploadThumbnail(next.id, thumb);
            if (thumbUrl !== null) onThumbRef.current(next.id, thumbUrl);
          } catch {
            // Tried once; the grade keeps showing the original.
          }
        }
      } finally {
        running.current = false;
      }
    })();
  }, [images]);
}
