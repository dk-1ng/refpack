import { useCallback, useEffect, useState } from "react";
import type { Image } from "../shared/api.ts";
import { fetchImages, setAllSelected, setImageSelected } from "./api.ts";
import { LANGUAGES, type Language, type Notice, useI18n } from "./i18n/index.tsx";
import { AddImages } from "./library/AddImages.tsx";
import { ImageGrid } from "./library/ImageGrid.tsx";
import { IncomingFiles } from "./library/IncomingFiles.tsx";
import { SelectionBar } from "./library/SelectionBar.tsx";
import { PackPanel } from "./pack/PackPanel.tsx";

export function App() {
  const { language, setLanguage, t } = useI18n();
  const [images, setImages] = useState<Image[] | null>(null);
  const [refusals, setRefusals] = useState<Notice[]>([]);

  const addImage = useCallback(
    (image: Image) => setImages((current) => [image, ...(current ?? [])]),
    [],
  );
  const refuse = useCallback(
    (notice: Notice) => setRefusals((current) => [...current, notice]),
    [],
  );

  const toggle = useCallback(
    async (image: Image) => {
      const saved = await setImageSelected(image.id, !image.selected);
      if (!saved) {
        refuse({ key: "error.notSaved" });
        return;
      }
      setImages((current) =>
        current === null
          ? current
          : current.map((item) =>
              item.id === image.id ? { ...item, selected: !image.selected } : item,
            ),
      );
    },
    [refuse],
  );
  const selectAll = useCallback(
    async (selected: boolean) => {
      const saved = await setAllSelected(selected);
      if (!saved) {
        refuse({ key: "error.notSaved" });
        return;
      }
      setImages((current) =>
        current === null ? current : current.map((item) => ({ ...item, selected })),
      );
    },
    [refuse],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    fetchImages().then(
      (loaded) => {
        if (!cancelled) {
          setImages((current) => (current === null ? loaded : [...current, ...loaded]));
        }
      },
      () => {
        if (!cancelled) {
          setImages(null);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <header>
        <h1>refpack</h1>
        <label>
          {t("language.label")}
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {t(code === "pt-BR" ? "language.pt-BR" : "language.en")}
              </option>
            ))}
          </select>
        </label>
      </header>
      <AddImages onAdded={addImage} onRefused={refuse} />
      <IncomingFiles onAdded={addImage} onRefused={refuse} />
      <PackPanel
        imageCount={images?.length ?? 0}
        selectedCount={images?.filter((image) => image.selected).length ?? 0}
        onFailed={refuse}
      />
      {refusals.length > 0 ? (
        <ul role="alert" className="refusals">
          {refusals.map((notice, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: append-only list of messages
            <li key={index}>{t(notice.key, notice.vars)}</li>
          ))}
        </ul>
      ) : null}
      {images !== null && images.length === 0 ? <p>{t("library.empty")}</p> : null}
      {images !== null && images.length > 0 ? (
        <>
          <SelectionBar
            selected={images.filter((image) => image.selected).length}
            total={images.length}
            onSelectAll={() => selectAll(true)}
            onClear={() => selectAll(false)}
          />
          <ImageGrid images={images} onToggle={toggle} />
        </>
      ) : null}
    </main>
  );
}
