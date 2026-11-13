import { useRef, useState } from "react";
import { MAX_TAG_LENGTH, type Tag } from "../../shared/api.ts";
import { useI18n } from "../i18n/index.tsx";
import { sameTag, suggest } from "./tags.ts";

export function TagPanel({
  tags,
  all,
  onAdd,
  onRemove,
}: {
  tags: Tag[]; // the open image's tags, in order
  all: Tag[]; // the library's tags, sorted
  onAdd: (name: string) => Promise<boolean>; // false when it could not be saved
  onRemove: (tagId: string) => Promise<boolean>;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const adding = useRef(false);

  async function add(name: string): Promise<void> {
    const trimmed = name.trim();
    if (trimmed === "") return;
    if (tags.some((tag) => sameTag(tag.name, trimmed))) {
      setText("");
      return;
    }
    if (adding.current) return;
    adding.current = true;
    try {
      const ok = await onAdd(trimmed);
      if (ok) setText("");
      setFailed(!ok);
    } finally {
      adding.current = false;
    }
    inputRef.current?.focus();
  }

  async function remove(tagId: string): Promise<void> {
    setFailed(!(await onRemove(tagId)));
  }

  const suggestions = suggest(all, tags, text);
  return (
    <div className="tags">
      {tags.length > 0 ? (
        <ul className="tag-list" aria-label={t("tag.listLabel")}>
          {tags.map((tag) => {
            const label = t("tag.remove", { name: tag.name });
            return (
              <li key={tag.id}>
                <span>{tag.name}</span>
                <button
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={() => void remove(tag.id)}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <form
        className="tag-form"
        onSubmit={(event) => {
          event.preventDefault();
          void add(text);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          aria-label={t("tag.newLabel")}
          placeholder={t("tag.placeholder")}
          maxLength={MAX_TAG_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit">{t("tag.add")}</button>
      </form>
      {failed ? <p role="alert">{t("error.notSaved")}</p> : null}
      {suggestions.length > 0 ? (
        <ul className="tag-suggestions" aria-label={t("tag.suggestions")}>
          {suggestions.map((tag) => (
            <li key={tag.id}>
              <button type="button" onClick={() => void add(tag.name)}>
                {tag.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
