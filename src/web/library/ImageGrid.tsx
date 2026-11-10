import type { Image } from "../../shared/api.ts";

export function ImageGrid({
  images,
  onToggle,
}: {
  images: Image[];
  onToggle: (image: Image) => void;
}) {
  return (
    <ul className="image-grid">
      {images.map((image) => (
        <li key={image.id}>
          <label>
            <input type="checkbox" checked={image.selected} onChange={() => onToggle(image)} />
            <img src={image.url} alt={image.originalName} draggable={false} />
          </label>
        </li>
      ))}
    </ul>
  );
}
