import type { Image } from "../../shared/api.ts";

export function ImageGrid({ images }: { images: Image[] }) {
  return (
    <ul className="image-grid">
      {images.map((image) => (
        <li key={image.id}>
          <img src={image.url} alt={image.originalName} />
        </li>
      ))}
    </ul>
  );
}
