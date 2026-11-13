import { expect, test } from "vitest";
import type { Image, Tag } from "../../shared/api.ts";
import { libraryTags, sameTag, suggest } from "./tags.ts";

const tag = (id: string, name: string): Tag => ({ id, name });
const img = (tags: Tag[]): Image => ({
  id: "00000000-0000-4000-8000-000000000000",
  originalName: "a.png",
  url: "/x",
  selected: false,
  note: "",
  marks: [],
  tags,
});
const names = (tags: Tag[]) => tags.map((item) => item.name);

test("CA-5.3 libraryTags lists each tag once, in alphabetical order", () => {
  const zebra = tag("1", "zebra");
  const dashboard = tag("2", "dashboard");
  const icone = tag("3", "Ícone");
  const abacaxi = tag("4", "abacaxi");
  const result = libraryTags([
    img([zebra, dashboard]),
    img([dashboard, icone]),
    img([]),
    img([abacaxi]),
  ]);
  expect(names(result)).toEqual(["abacaxi", "dashboard", "Ícone", "zebra"]);
});

test("CA-5.2 sameTag ignores case only", () => {
  expect(sameTag("Dashboard", "dashboard")).toBe(true);
  expect(sameTag("DASHBOARD", "dashboard")).toBe(true);
  expect(sameTag("ícone", "Ícone")).toBe(true);
  expect(sameTag("icone", "ícone")).toBe(false);
  expect(sameTag("dash board", "dashboard")).toBe(false);
});

test("CA-5.3 suggest leaves out the image's own tags and narrows by the typed text, keeping the order", () => {
  const all = [tag("4", "abacaxi"), tag("2", "dashboard"), tag("3", "Ícone"), tag("5", "tabela")];
  const own = [tag("2", "dashboard")];
  expect(names(suggest(all, own, ""))).toEqual(["abacaxi", "Ícone", "tabela"]);
  expect(names(suggest(all, own, " TAB "))).toEqual(["tabela"]);
  expect(names(suggest(all, own, "a"))).toEqual(["abacaxi", "tabela"]);
  expect(names(suggest(all, own, "dash"))).toEqual([]);
  expect(names(suggest(all, own, "ícone"))).toEqual(["Ícone"]);
});
