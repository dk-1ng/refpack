import { useCallback, useEffect, useMemo, useState } from "react";
import type { Image, Mark, Tag } from "../shared/api.ts";
import { fetchImages, setAllSelected, setImageSelected } from "./api.ts";
import { LANGUAGES, type Language, type Notice, useI18n } from "./i18n/index.tsx";
import { AddImages } from "./library/AddImages.tsx";
import { ImageGrid } from "./library/ImageGrid.tsx";
import { IncomingFiles } from "./library/IncomingFiles.tsx";
import { SelectionBar } from "./library/SelectionBar.tsx";
import { ImageViewer } from "./note/ImageViewer.tsx";
import { IntentBox } from "./pack/IntentBox.tsx";
import { PackPanel } from "./pack/PackPanel.tsx";
import { useIntent } from "./pack/use-intent.ts";
import { TagFilter } from "./tags/TagFilter.tsx";
import { libraryTags } from "./tags/tags.ts";

export function App() {
  const { language, setLanguage, t } = useI18n();
  const [images, setImages] = useState<Image[] | null>(null);
  const [refusals, setRefusals] = useState<Notice[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const intent = useIntent();
  const openIndex = images?.findIndex((image) => image.id === openId) ?? -1;
  const openImage = images?.[openIndex] ?? null;

  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const allTags = useMemo(() => libraryTags(images ?? []), [images]);
  // CA-5.6: a tag that is gone turns the filter off.
  const activeFilter = allTags.some((tag) => tag.id === filterTagId) ? filterTagId : null;

  const addImage = useCallback((image: Image) => {
    setImages((current) => [image, ...(current ?? [])]);
    setFilterTagId(null); // CA-5.9
  }, []);
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
      const saved = await setAllSelected(selected, activeFilter);
      if (!saved) {
        refuse({ key: "error.notSaved" });
        return;
      }
      setImages((current) =>
        current === null
          ? current
          : current.map((item) =>
              activeFilter === null || item.tags.some((tag) => tag.id === activeFilter)
                ? { ...item, selected }
                : item,
            ),
      );
    },
    [refuse, activeFilter],
  );

  const noteSaved = useCallback(
    (id: string, note: string) =>
      setImages((current) =>
        current === null
          ? current
          : current.map((item) => (item.id === id ? { ...item, note } : item)),
      ),
    [],
  );

  const marksChanged = useCallback(
    (id: string, change: (marks: Mark[]) => Mark[]) =>
      setImages((current) =>
        current === null
          ? current
          : current.map((item) => (item.id === id ? { ...item, marks: change(item.marks) } : item)),
      ),
    [],
  );

  const tagsChanged = useCallback(
    (id: string, change: (tags: Tag[]) => Tag[]) =>
      setImages((current) =>
        current === null
          ? current
          : current.map((item) => (item.id === id ? { ...item, tags: change(item.tags) } : item)),
      ),
    [],
  );

  const startOver = useCallback(async () => {
    if (!window.confirm(t("pack.confirmStartOver"))) return;
    const cleared = await setAllSelected(false);
    if (!cleared) {
      refuse({ key: "error.notSaved" });
      return;
    }
    setImages((current) =>
      current === null ? current : current.map((item) => ({ ...item, selected: false })),
    );
    intent.change("");
    if (!(await intent.flush())) {
      refuse({ key: "error.notSaved" });
    }
  }, [t, refuse, intent.change, intent.flush]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    fetchImages().then(
      (loaded) => {
        if (cancelled) return;
        if (loaded === null) {
          refuse({ key: "error.versionMismatch" });
          return;
        }
        setImages((current) => {
          if (current === null) return loaded;
          const known = new Set(current.map((image) => image.id));
          return [...current, ...loaded.filter((image) => !known.has(image.id))];
        });
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
  }, [refuse]);

  const allImages = images ?? [];
  const hasFilterTag = (image: Image) => image.tags.some((tag) => tag.id === activeFilter);
  const shown = activeFilter === null ? allImages : allImages.filter(hasFilterTag);
  // The images Previous and Next walk: the shown ones, plus the open image when it lost the tag (CA-5.8).
  const navigable =
    activeFilter === null ? allImages : allImages.filter((i) => i.id === openId || hasFilterTag(i));
  const navIndex = navigable.findIndex((image) => image.id === openId);

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
      <IncomingFiles onAdded={addImage} onRefused={refuse} paused={openImage !== null} />
      <IntentBox text={intent.text} saveState={intent.saveState} onChange={intent.change} />
      <PackPanel
        imageCount={images?.length ?? 0}
        selectedCount={images?.filter((image) => image.selected).length ?? 0}
        canStartOver={
          (images?.some((image) => image.selected) ?? false) || (intent.text ?? "") !== ""
        }
        onStartOver={() => void startOver()}
        beforeGenerate={intent.flush}
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
          {allTags.length > 0 ? (
            <TagFilter
              tags={allTags}
              value={activeFilter}
              shown={shown.length}
              total={images.length}
              onChange={setFilterTagId}
            />
          ) : null}
          <SelectionBar
            selected={images.filter((image) => image.selected).length}
            total={images.length}
            onSelectAll={() => selectAll(true)}
            onClear={() => selectAll(false)}
          />
          <ImageGrid images={shown} onToggle={toggle} onOpenNote={(image) => setOpenId(image.id)} />
        </>
      ) : null}
      {openImage !== null ? (
        <ImageViewer
          key={openImage.id}
          image={openImage}
          previousId={navigable[navIndex - 1]?.id ?? null}
          nextId={navigable[navIndex + 1]?.id ?? null}
          onOpen={setOpenId}
          onClose={() => setOpenId(null)}
          onSaved={noteSaved}
          onMarks={marksChanged}
          allTags={allTags}
          onTags={tagsChanged}
        />
      ) : null}
    </main>
  );
}
