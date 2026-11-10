import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { en } from "./en.ts";
import { ptBR } from "./pt-BR.ts";

export type Language = "pt-BR" | "en";
export const LANGUAGES: readonly Language[] = ["pt-BR", "en"];
export type MessageKey = keyof typeof ptBR;
type Vars = Record<string, string>;

const STORAGE_KEY = "refpack.language";
const dictionaries: Record<Language, Record<MessageKey, string>> = { "pt-BR": ptBR, en };

export function detectLanguage(preferred: readonly string[]): Language {
  return preferred[0]?.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
}

export function loadLanguage(
  storage: Pick<Storage, "getItem">,
  preferred: readonly string[],
): Language {
  const saved = storage.getItem(STORAGE_KEY);
  return LANGUAGES.find((language) => language === saved) ?? detectLanguage(preferred);
}

export function saveLanguage(storage: Pick<Storage, "setItem">, language: Language): void {
  storage.setItem(STORAGE_KEY, language);
}

export function translate(language: Language, key: MessageKey, vars?: Vars): string {
  const text = dictionaries[language][key];
  if (vars === undefined) {
    return text;
  }
  return text.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match);
}

type I18n = {
  language: Language;
  setLanguage(language: Language): void;
  t(key: MessageKey, vars?: Vars): string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider(props: {
  storage: Pick<Storage, "getItem" | "setItem">;
  preferred: readonly string[];
  children: ReactNode;
}) {
  const { storage, preferred, children } = props;
  const [language, setLanguageState] = useState<Language>(() => loadLanguage(storage, preferred));
  const setLanguage = useCallback(
    (next: Language) => {
      saveLanguage(storage, next);
      setLanguageState(next);
    },
    [storage],
  );
  const value = useMemo<I18n>(
    () => ({ language, setLanguage, t: (key, vars) => translate(language, key, vars) }),
    [language, setLanguage],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (value === null) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}
