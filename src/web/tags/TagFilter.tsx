import type { Tag } from "../../shared/api.ts";
import { useI18n } from "../i18n/index.tsx";

export function TagFilter(props: {
  tags: Tag[]; // sorted
  value: string | null; // the chosen tag id, null for all images
  shown: number;
  total: number;
  onChange: (tagId: string | null) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="tag-filter">
      <label>
        {t("filter.label")}
        <select
          value={props.value ?? ""}
          onChange={(e) => props.onChange(e.target.value === "" ? null : e.target.value)}
        >
          <option value="">{t("filter.all")}</option>
          {props.tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>
      {props.value !== null ? (
        <span>
          {t("filter.showing", { shown: String(props.shown), total: String(props.total) })}
        </span>
      ) : null}
    </div>
  );
}
