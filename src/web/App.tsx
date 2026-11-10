import { useEffect, useState } from "react";
import type { Image } from "../shared/api.ts";
import { fetchImages } from "./api.ts";
import { LANGUAGES, type Language, useI18n } from "./i18n/index.tsx";
import { AddImages } from "./library/AddImages.tsx";
import { ImageGrid } from "./library/ImageGrid.tsx";
import { PackPanel } from "./pack/PackPanel.tsx";

export function App() {
  const { language, setLanguage, t } = useI18n();
  const [images, setImages] = useState<Image[] | null>(null);
  const [refusals, setRefusals] = useState<string[]>([]);

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
      <AddImages
        onAdded={(image) => setImages((current) => [image, ...(current ?? [])])}
        onRefused={(message) => setRefusals((current) => [...current, message])}
      />
      <PackPanel
        imageCount={images?.length ?? 0}
        onFailed={(message) => setRefusals((current) => [...current, message])}
      />
      {refusals.length > 0 ? (
        <ul role="alert" className="refusals">
          {refusals.map((message, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: append-only list of messages
            <li key={index}>{message}</li>
          ))}
        </ul>
      ) : null}
      {images !== null && images.length === 0 ? <p>{t("library.empty")}</p> : null}
      {images !== null && images.length > 0 ? <ImageGrid images={images} /> : null}
    </main>
  );
}
