import type { Image } from "../../shared/api.ts";
import { useI18n } from "../i18n/index.tsx";

export function ImageGrid({
  images,
  onToggle,
  onOpenNote,
}: {
  images: Image[];
  onToggle: (image: Image) => void;
  onOpenNote: (image: Image) => void;
}) {
  const { t } = useI18n();
  return (
    <ul className="image-grid">
      {images.map((image) => (
        <li key={image.id}>
          <label>
            <input type="checkbox" checked={image.selected} onChange={() => onToggle(image)} />
            <img src={image.url} alt={image.originalName} draggable={false} />
          </label>
          <button type="button" className="note-button" onClick={() => onOpenNote(image)}>
            {t("note.open")}
            {image.note.trim() !== "" ? <span className="note-mark" title={t("note.has")} /> : null}
            {image.marks.length > 0 ? (
              <span
                className="mark-count"
                title={t("mark.count", { count: String(image.marks.length) })}
              >
                {image.marks.length}
              </span>
            ) : null}
          </button>
          {image.tags.length > 0 ? (
            <p className="image-tags">
              {image.tags.map((tag) => (
                <span key={tag.id} className="tag-chip">
                  {tag.name}
                </span>
              ))}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
