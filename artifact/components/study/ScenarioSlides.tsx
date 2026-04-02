"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import {
  SLIDES_CANONICAL_ORDER,
  isSlidesRefinementPayloadCorrect,
} from "@/lib/scenarios/registry";
import { cn } from "@/lib/utils";

type SlideData = {
  id: string;
  title: string;
  bullets: string[];
};

const SLIDE_DEFS: Record<string, { title: string; bullets: string[] }> = {
  "slide-title-card": {
    title: "Title — Q3 priorities",
    bullets: ["Session objective", "Owners TBD"],
  },
  "slide-problem-card": {
    title: "Problem framing",
    bullets: ["Customers want faster payouts", "Needs sharper evidence"],
  },
  "slide-metrics-card": {
    title: "Metrics snapshot",
    bullets: ["ARR +12% QoQ", "Net retention 118%", "Funnel: +3pp conversion"],
  },
  "slide-cta-card": {
    title: "Ask",
    bullets: [
      "Approve Q3 focus",
      "Option A: deepen payouts",
      "Option B: expand wallet",
    ],
  },
};

function cloneSlidesState(order: readonly string[]): SlideData[] {
  return order.map((id) => {
    const d = SLIDE_DEFS[id];
    return { id, title: d.title, bullets: [...d.bullets] };
  });
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="14"
      viewBox="0 0 10 14"
      fill="currentColor"
    >
      <circle cx="2" cy="2" r="1.5" />
      <circle cx="8" cy="2" r="1.5" />
      <circle cx="2" cy="7" r="1.5" />
      <circle cx="8" cy="7" r="1.5" />
      <circle cx="2" cy="12" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
    </svg>
  );
}

function SlideThumbnail({
  slide,
  index,
  isSelected,
  onClick,
  disabled,
  isOverlay,
}: {
  slide: SlideData;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const firstBullet = slide.bullets[0] || "";

  if (isOverlay) {
    return (
      <div
        data-ephemeral-id={slide.id}
        className="flex items-start gap-2 rounded-md border border-primary bg-card p-2 shadow-xl"
      >
        <div className="flex h-full shrink-0 cursor-grabbing items-center text-muted-foreground">
          <GripIcon className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <span className="truncate text-xs font-medium text-foreground">
              {slide.title}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
            {firstBullet}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ephemeral-id={slide.id}
      onClick={onClick}
      className={cn(
        "group/thumb flex cursor-pointer items-start gap-2 rounded-md border p-2 transition-all",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/40",
        isDragging && "z-10 opacity-40",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex h-full shrink-0 cursor-grab items-center text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripIcon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
            {index + 1}
          </span>
          <span className="truncate text-xs font-medium text-foreground">
            {slide.title}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
          {firstBullet}
        </p>
      </div>
      {isSelected && (
        <div className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );
}

export function ScenarioSlides(props: {
  initialOrder: readonly string[];
  onAnswerPayloadChange: (json: string | null) => void;
  onSlideEdited?: (slideId: string) => void;
  onSlideReordered?: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}): React.ReactElement {
  const [order, setOrder] = React.useState<string[]>(() => [
    ...props.initialOrder,
  ]);
  const [slidesById, setSlidesById] = React.useState<
    Record<string, SlideData>
  >(() => {
    const map: Record<string, SlideData> = {};
    for (const s of cloneSlidesState(props.initialOrder)) {
      map[s.id] = s;
    }
    return map;
  });
  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => props.initialOrder[0] ?? null,
  );
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const orderedSlides = React.useMemo(
    () =>
      order.map((id) => slidesById[id]).filter(Boolean) as SlideData[],
    [order, slidesById],
  );

  const selectedSlide = selectedId ? slidesById[selectedId] : null;

  React.useEffect(() => {
    const problem = slidesById["slide-problem-card"];
    const payload = JSON.stringify({
      order,
      problemBullets: problem ? problem.bullets : [],
    });
    props.onAnswerPayloadChange(
      isSlidesRefinementPayloadCorrect(payload) ? payload : null,
    );
  }, [order, slidesById, props.onAnswerPayloadChange]);

  function fireEdit(slideId: string) {
    props.onSlideEdited?.(slideId);
  }

  function updateBullet(slideId: string, bulletIndex: number, value: string) {
    setSlidesById((prev) => {
      const s = prev[slideId];
      if (!s) return prev;
      const nextBullets = [...s.bullets];
      nextBullets[bulletIndex] = value;
      return { ...prev, [slideId]: { ...s, bullets: nextBullets } };
    });
    fireEdit(slideId);
  }

  function addBullet(slideId: string) {
    setSlidesById((prev) => {
      const s = prev[slideId];
      if (!s) return prev;
      return { ...prev, [slideId]: { ...s, bullets: [...s.bullets, ""] } };
    });
    fireEdit(slideId);
  }

  function removeBullet(slideId: string, bulletIndex: number) {
    setSlidesById((prev) => {
      const s = prev[slideId];
      if (!s || s.bullets.length <= 1) return prev;
      return {
        ...prev,
        [slideId]: {
          ...s,
          bullets: s.bullets.filter((_, i) => i !== bulletIndex),
        },
      };
    });
    fireEdit(slideId);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(active.id as string);
    const newIndex = order.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    setOrder((prev) => arrayMove(prev, oldIndex, newIndex));
    props.onSlideReordered?.(oldIndex, newIndex);
  }

  function handleDragCancel() {
    setActiveDragId(null);
  }

  const activeDragSlide = activeDragId ? slidesById[activeDragId] : null;
  const activeDragIndex = activeDragId ? order.indexOf(activeDragId) : -1;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        data-ephemeral-id="deck-context-bar"
      >
        <span className="font-medium text-foreground">Deck context: </span>
        Stakeholder readout tomorrow · Reorder to: title → problem → metrics →
        ask. Problem slide must state a concrete risk (see task).
      </div>

      <p className="text-[11px] text-muted-foreground">
        Target order:{" "}
        {SLIDES_CANONICAL_ORDER.map(
          (id) => SLIDE_DEFS[id]?.title ?? id,
        ).join(" → ")}
      </p>

      <div
        className={cn(
          "flex min-h-[340px] gap-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm",
          props.disabled && "pointer-events-none opacity-60",
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex w-[200px] shrink-0 flex-col gap-1.5 border-r border-border bg-muted/30 p-2">
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Slides
            </div>
            <SortableContext
              items={order}
              strategy={verticalListSortingStrategy}
            >
              {orderedSlides.map((slide, index) => (
                <SlideThumbnail
                  key={slide.id}
                  slide={slide}
                  index={index}
                  isSelected={selectedId === slide.id}
                  onClick={() => setSelectedId(slide.id)}
                  disabled={props.disabled}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeDragSlide && activeDragIndex !== -1 ? (
              <SlideThumbnail
                slide={activeDragSlide}
                index={activeDragIndex}
                isSelected={false}
                onClick={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="flex flex-1 flex-col">
          {selectedSlide ? (
            <div className="flex flex-1 flex-col">
              <div className="border-b border-border bg-muted/20 px-5 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Slide{" "}
                  {order.indexOf(selectedSlide.id) + 1} of {order.length}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  {selectedSlide.title}
                </h2>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-1 flex-col rounded-lg border border-border/60 bg-card p-5 shadow-inner">
                  <h3 className="mb-4 text-base font-semibold text-foreground">
                    {selectedSlide.title}
                  </h3>

                  <div className="flex flex-1 flex-col gap-2">
                    {selectedSlide.bullets.map((bullet, bi) => (
                      <div key={bi} className="group/bullet flex items-center gap-2">
                        <span className="mt-0.5 text-sm text-primary/60">
                          •
                        </span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) =>
                            updateBullet(selectedSlide.id, bi, e.target.value)
                          }
                          className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-foreground transition-colors placeholder:text-muted-foreground/40 hover:border-border focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                          placeholder="Bullet point…"
                        />
                        {selectedSlide.bullets.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              removeBullet(selectedSlide.id, bi)
                            }
                            className="shrink-0 opacity-0 transition-opacity group-hover/bullet:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            >
                              <path d="M3 3l6 6M9 3l-6 6" />
                            </svg>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 border-t border-border/40 pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addBullet(selectedSlide.id)}
                      className="text-xs font-normal text-muted-foreground"
                    >
                      + Add bullet
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a slide to edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
