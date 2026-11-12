import { type CSSProperties, type PointerEvent, type RefObject, useRef, useState } from "react";
import type { Area, Image } from "../../shared/api.ts";
import { useI18n } from "../i18n/index.tsx";
import { areaBetween, isBigEnough, type Point, toFraction } from "./area.ts";

// Position and size of a rectangle, as percentages of the frame: it stays on the same part of
// the image whatever size the image is shown at.
function placement(area: Area): CSSProperties {
  return {
    left: `${area.left * 100}%`,
    top: `${area.top * 100}%`,
    width: `${(area.right - area.left) * 100}%`,
    height: `${(area.bottom - area.top) * 100}%`,
  };
}

function pointer(event: PointerEvent<HTMLDivElement>): Point {
  return toFraction(
    { x: event.clientX, y: event.clientY },
    event.currentTarget.getBoundingClientRect(),
  );
}

export function ImageStage({
  image,
  imageRef,
  pending,
  onPending,
}: {
  image: Image;
  imageRef: RefObject<HTMLImageElement | null>; // the viewer crops from this element
  pending: Area | null; // the rectangle waiting for its kind
  onPending: (area: Area | null) => void;
}) {
  const { t } = useI18n();
  // naturalWidth / naturalHeight, known once the image has loaded.
  const [ratio, setRatio] = useState<number | null>(null);
  const [drawing, setDrawing] = useState<Area | null>(null);
  const start = useRef<Point | null>(null);
  const loaded = ratio !== null;
  const draft = drawing ?? pending;

  function stop(): void {
    start.current = null;
    setDrawing(null);
  }

  return (
    <div className="viewer-stage">
      <div
        className="viewer-frame"
        style={loaded ? ({ "--ratio": String(ratio) } as CSSProperties) : undefined}
        onPointerDown={(event) => {
          if (!loaded || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const point = pointer(event);
          start.current = point;
          onPending(null);
          setDrawing(areaBetween(point, point));
        }}
        onPointerMove={(event) => {
          if (start.current === null) return;
          setDrawing(areaBetween(start.current, pointer(event)));
        }}
        onPointerUp={(event) => {
          if (start.current === null) return;
          const area = areaBetween(start.current, pointer(event));
          stop();
          if (isBigEnough(area, event.currentTarget.getBoundingClientRect())) onPending(area);
        }}
        onPointerCancel={stop}
      >
        <img
          ref={imageRef}
          className="viewer-image"
          src={image.url}
          alt={image.originalName}
          draggable={false}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth > 0 && naturalHeight > 0) setRatio(naturalWidth / naturalHeight);
          }}
        />
        {loaded
          ? image.marks.map((mark, index) => {
              const number = String(index + 1);
              return (
                <div
                  key={mark.id}
                  className={`mark-box mark-${mark.kind}`}
                  title={t("mark.itemLabel", { number })}
                  style={placement(mark.area)}
                >
                  <span>
                    {t(mark.kind === "like" ? "mark.boxLike" : "mark.boxDislike", { number })}
                  </span>
                </div>
              );
            })
          : null}
        {loaded && draft !== null ? (
          <div className="mark-box mark-new" title={t("mark.newLabel")} style={placement(draft)} />
        ) : null}
      </div>
    </div>
  );
}
