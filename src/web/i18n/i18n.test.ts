import { expect, test } from "vitest";
import { en } from "./en.ts";
import { detectLanguage, loadLanguage, saveLanguage, translate } from "./index.tsx";
import { ptBR } from "./pt-BR.ts";

test("CA-0.10 both languages have exactly the same keys and no empty text", () => {
  expect(Object.keys(en).sort()).toEqual(Object.keys(ptBR).sort());
  for (const text of [...Object.values(en), ...Object.values(ptBR)]) {
    expect(text.trim()).not.toBe("");
  }
});

test("CA-0.10 the first language follows the browser: pt* gives pt-BR, anything else en", () => {
  expect(detectLanguage(["pt-BR", "en"])).toBe("pt-BR");
  expect(detectLanguage(["pt"])).toBe("pt-BR");
  expect(detectLanguage(["en-US", "pt-BR"])).toBe("en");
  expect(detectLanguage(["fr"])).toBe("en");
  expect(detectLanguage([])).toBe("en");
});

test("CA-0.10 a saved choice wins over the browser preference", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
  expect(loadLanguage(storage, ["pt-BR"])).toBe("pt-BR");
  saveLanguage(storage, "en");
  expect(values.get("refpack.language")).toBe("en");
  expect(loadLanguage(storage, ["pt-BR"])).toBe("en");
  values.set("refpack.language", "klingon");
  expect(loadLanguage(storage, ["pt-BR"])).toBe("pt-BR");
});

test("translate replaces {name} with the given value", () => {
  expect(translate("en", "error.tooLarge", { name: "a.png" })).toBe("a.png: larger than 25 MB.");
  expect(translate("pt-BR", "error.tooLarge", { name: "a.png" })).toBe("a.png: passa de 25 MB.");
});
