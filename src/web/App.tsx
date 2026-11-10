import { useEffect, useState } from "react";
import { fetchImages } from "./api.ts";
import { LANGUAGES, type Language, useI18n } from "./i18n/index.tsx";

export function App() {
  const { language, setLanguage, t } = useI18n();
  const [imageCount, setImageCount] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    fetchImages().then(
      (images) => {
        if (!cancelled) {
          setImageCount(images.length);
        }
      },
      () => {
        if (!cancelled) {
          setImageCount(null);
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
      {imageCount === 0 ? <p>{t("library.empty")}</p> : null}
    </main>
  );
}
