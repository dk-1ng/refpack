import { useI18n } from "../i18n/index.tsx";

export function SelectionBar(props: {
  selected: number;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="selection-bar">
      <span>
        {t("selection.count", { selected: String(props.selected), total: String(props.total) })}
      </span>
      <button type="button" onClick={props.onSelectAll}>
        {t("selection.all")}
      </button>
      <button type="button" onClick={props.onClear}>
        {t("selection.clear")}
      </button>
    </div>
  );
}
