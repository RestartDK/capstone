"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type {
  SlideCanvasTemplate,
  SlidesTaskState,
} from "@/lib/scenarios/task-state"
import { outlineSnapshotBullets } from "@/lib/scenarios/registry"
import { cn } from "@/lib/utils"

type SlideData = {
  id: string
  title: string
  bullets: string[]
  canvas: SlideCanvasTemplate
  stripTag: string
}

export type SlidesAttemptState = {
  hasReordered: boolean
  readyToSubmit: boolean
}

function accentForCanvas(canvas: SlideCanvasTemplate): string {
  if (canvas === "problem") return "bg-amber-100 text-amber-900"
  if (canvas === "metrics") return "bg-sky-100 text-sky-900"
  if (canvas === "ask") return "bg-violet-100 text-violet-900"
  return "bg-slate-100 text-slate-900"
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
  )
}

function MiniSlidePreview({ slide }: { slide: SlideData }) {
  const accent = accentForCanvas(slide.canvas)

  return (
    <div className="aspect-[16/9] w-full rounded-[10px] border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase",
            accent
          )}
        >
          {slide.stripTag}
        </span>
        <div className="h-1 w-6 rounded-full bg-slate-100" />
      </div>
      <div className="mt-2 truncate text-[9px] leading-tight font-semibold text-slate-900">
        {slide.title}
      </div>
      <div className="mt-2 space-y-1">
        {slide.bullets.slice(0, 3).map((_, index) => (
          <div key={`${slide.id}-${index}`} className="flex items-center gap-1">
            <span className="size-1 rounded-full bg-slate-300" />
            <div
              className="h-1 flex-1 rounded-full bg-slate-200/90"
              style={{ width: `${90 - index * 14}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideCanvas({
  slide,
  deckLabel,
  deckDeadlineLabel,
  orderIndex,
  totalSlides,
}: {
  slide: SlideData
  deckLabel: string
  deckDeadlineLabel: string
  orderIndex: number
  totalSlides: number
}) {
  if (slide.canvas === "title") {
    return (
      <div className="flex h-full flex-col justify-between gap-6 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-6 sm:p-8">
        <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.18em] text-slate-500 uppercase">
          <span>{deckLabel}</span>
          <span>
            Slide {orderIndex + 1} / {totalSlides}
          </span>
        </div>
        <div className="space-y-5">
          <div className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {slide.title}
          </div>
          <div className="grid gap-2 sm:max-w-2xl">
            {slide.bullets.map((bullet, bulletIndex) => (
              <p
                key={bulletIndex}
                className="text-base leading-relaxed text-slate-600 sm:text-lg"
              >
                {bullet}
              </p>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Daniel Kumlin</span>
          <span>{deckDeadlineLabel}</span>
        </div>
      </div>
    )
  }

  if (slide.canvas === "problem") {
    return (
      <div className="flex h-full flex-col gap-5 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-[0.18em] text-amber-700 uppercase">
              Context
            </div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {slide.title}
            </h3>
          </div>
          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
            Name the concrete risk clearly
          </div>
        </div>
        <div
          className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-900"
          data-ephemeral-id={`${slide.id}-hint`}
        >
          <svg
            className="mt-0.5 size-4 shrink-0 text-amber-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            <path d="m15 5 4 4" />
          </svg>
          <span>
            Preview only — use the strip below to put this slide in the right
            place in the story.
          </span>
        </div>
        <div className="grid gap-3" data-ephemeral-id={`${slide.id}-bullets`}>
          {slide.bullets.map((bullet, bulletIndex) => (
            <div
              key={bulletIndex}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2"
            >
              <span className="mt-2 size-2 shrink-0 rounded-full bg-amber-500" />
              <p className="min-h-[44px] flex-1 text-base leading-7 text-slate-900">
                {bullet}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (slide.canvas === "metrics") {
    return (
      <div className="flex h-full flex-col gap-6 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-[0.18em] text-sky-700 uppercase">
              Numbers
            </div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {slide.title}
            </h3>
          </div>
          <div className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-800">
            Support the story with data
          </div>
        </div>
        <div
          className="grid flex-1 gap-4 md:grid-cols-3"
          data-ephemeral-id={`${slide.id}-bullets`}
        >
          {slide.bullets.map((bullet, bulletIndex) => (
            <div
              key={bulletIndex}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                Metric {bulletIndex + 1}
              </div>
              <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
                {bullet}
              </p>
              <div className="mt-4 h-24 rounded-xl bg-slate-50 p-3">
                <div className="flex h-full items-end gap-2">
                  <div className="h-[42%] flex-1 rounded-t bg-sky-200" />
                  <div className="h-[68%] flex-1 rounded-t bg-sky-400" />
                  <div className="h-[56%] flex-1 rounded-t bg-sky-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 bg-[linear-gradient(180deg,#faf5ff_0%,#ffffff_100%)] p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium tracking-[0.18em] text-violet-700 uppercase">
            Decision
          </div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {slide.title}
          </h3>
        </div>
        <div className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-800">
          End with a clear ask
        </div>
      </div>
      <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.8fr)]">
        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <div className="mb-4 text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
            Decision request
          </div>
          <div className="grid gap-3">
            {slide.bullets.map((bullet, bulletIndex) => (
              <div
                key={bulletIndex}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2"
              >
                <span className="mt-1.5 shrink-0 text-violet-600">→</span>
                <p className="flex-1 text-base text-slate-900">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 text-sm text-violet-950">
          <div className="text-[11px] font-medium tracking-[0.18em] text-violet-700 uppercase">
            Presenter notes
          </div>
          <p className="mt-3 leading-6">
            End with a concrete request, not an open-ended summary. This slide
            should make the decision and ownership obvious.
          </p>
        </div>
      </div>
    </div>
  )
}

function SlideThumbnail({
  slide,
  index,
  isSelected,
  onClick,
  disabled,
  isOverlay,
  className,
}: {
  slide: SlideData
  index: number
  isSelected: boolean
  onClick: () => void
  disabled?: boolean
  isOverlay?: boolean
  className?: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slide.id,
    disabled,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isOverlay) {
    return (
      <div
        data-ephemeral-id={slide.id}
        className={cn(
          "w-[184px] rounded-xl border border-primary bg-card p-2 shadow-xl",
          className
        )}
      >
        <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-medium text-muted-foreground">
          <span>Slide {index + 1}</span>
          <GripIcon className="size-3.5" />
        </div>
        <div className="space-y-2">
          <MiniSlidePreview slide={slide} />
          <div className="truncate px-1 text-[11px] font-medium text-foreground">
            {slide.title}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ephemeral-id={slide.id}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group/thumb w-[192px] shrink-0 cursor-grab rounded-xl border p-2 transition-all active:cursor-grabbing",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/25"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30",
        isDragging && "z-10 opacity-40",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-medium text-muted-foreground">
        <span>Slide {index + 1}</span>
        <GripIcon className="size-3.5 text-muted-foreground/45" aria-hidden />
      </div>
      <MiniSlidePreview slide={slide} />
      <div className="mt-2 flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-foreground">
            {slide.title}
          </div>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
            {slide.bullets[0]}
          </p>
        </div>
        {isSelected ? (
          <div className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
        ) : null}
      </div>
    </div>
  )
}

export function ScenarioSlides({
  taskState,
  initialOrder,
  onAnswerPayloadChange,
  onLiveOutlineChange,
  onSlideReordered,
  onAttemptStateChange,
  disabled,
}: {
  taskState: SlidesTaskState
  initialOrder: readonly string[]
  onAnswerPayloadChange: (json: string | null) => void
  onLiveOutlineChange?: (state: {
    order: string[]
    problemBullets: string[]
    metricsBullets: string[]
  }) => void
  onSlideReordered?: (fromIndex: number, toIndex: number) => void
  onAttemptStateChange?: (state: SlidesAttemptState) => void
  disabled?: boolean
}): React.ReactElement {
  const slidesById = React.useMemo(() => {
    const map: Record<string, SlideData> = {}
    for (const s of taskState.slides) {
      map[s.id] = {
        id: s.id,
        title: s.title,
        bullets: [...s.bullets],
        canvas: s.canvas,
        stripTag: s.stripTag,
      }
    }
    return map
  }, [taskState.slides])

  const [order, setOrder] = React.useState<string[]>(() => [...initialOrder])
  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => initialOrder[0] ?? null
  )
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null)
  const [hasReordered, setHasReordered] = React.useState(false)
  const onAttemptStateChangeRef = React.useRef(onAttemptStateChange)

  React.useEffect(() => {
    onAttemptStateChangeRef.current = onAttemptStateChange
  }, [onAttemptStateChange])

  React.useEffect(() => {
    setOrder([...initialOrder])
    setSelectedId(initialOrder[0] ?? null)
    setActiveDragId(null)
    setHasReordered(false)
  }, [initialOrder])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const orderedSlides = React.useMemo(
    () => order.map((id) => slidesById[id]).filter(Boolean) as SlideData[],
    [order, slidesById]
  )

  const selectedSlide = selectedId ? slidesById[selectedId] : null

  React.useEffect(() => {
    const { problemBullets, metricsBullets } = outlineSnapshotBullets(taskState)
    const payload = JSON.stringify({
      order,
      problemBullets,
      metricsBullets,
    })
    onAnswerPayloadChange(payload)
    onLiveOutlineChange?.({
      order: [...order],
      problemBullets: [...problemBullets],
      metricsBullets: [...metricsBullets],
    })
  }, [onAnswerPayloadChange, onLiveOutlineChange, order, taskState])

  React.useEffect(() => {
    onAttemptStateChangeRef.current?.({
      hasReordered,
      readyToSubmit: hasReordered,
    })
  }, [hasReordered])

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = order.indexOf(active.id as string)
    const newIndex = order.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    setOrder((prev) => arrayMove(prev, oldIndex, newIndex))
    setHasReordered(true)
    onSlideReordered?.(oldIndex, newIndex)
  }

  function handleDragCancel() {
    setActiveDragId(null)
  }

  const activeDragSlide = activeDragId ? slidesById[activeDragId] : null
  const activeDragIndex = activeDragId ? order.indexOf(activeDragId) : -1
  const selectedSlideIndex = selectedSlide
    ? order.indexOf(selectedSlide.id)
    : -1
  const readyToSubmit = hasReordered

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-background shadow-sm",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex min-h-[min(72vh,720px)] flex-col">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
            <div className="border-b border-border/70 bg-white/70 px-4 py-3 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground/70 uppercase">
                    Slides · {taskState.deckLabel}
                  </div>
                  <p className="mt-1 text-sm text-foreground">
                    {readyToSubmit
                      ? "Order looks good — hit Submit in the bar below."
                      : "Drag the small slide cards below into a sensible order. Click a card to preview it here."}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <div className="rounded-full border border-border bg-background px-3 py-1">
                    Draft saved
                  </div>
                  <div className="rounded-full border border-border bg-background px-3 py-1">
                    {taskState.deckDeadlineLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-h-[420px] flex-1 flex-col p-4 sm:p-6 lg:p-8">
              {selectedSlide ? (
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
                  <div
                    className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-600"
                    data-ephemeral-id="slide-canvas-header"
                  >
                    <div>
                      Slide {selectedSlideIndex + 1} of {order.length}
                      <span className="ml-2 text-slate-400">
                        {selectedSlide.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px]">
                      <svg
                        className="size-3 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                        <path d="m15 5 4 4" />
                      </svg>
                      Preview
                    </div>
                  </div>
                  <div
                    className="relative min-h-0 flex-1 rounded-[28px] border border-slate-200/80 bg-white p-2 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.55)] sm:p-3"
                    data-ephemeral-id="slide-canvas-area"
                  >
                    <div className="h-full min-h-[380px] rounded-[22px] border border-slate-100 bg-white shadow-inner">
                      <SlideCanvas
                        slide={selectedSlide}
                        deckLabel={taskState.deckLabel}
                        deckDeadlineLabel={taskState.deckDeadlineLabel}
                        orderIndex={selectedSlideIndex}
                        totalSlides={order.length}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 text-sm text-muted-foreground">
                  Select a slide to preview
                </div>
              )}
            </div>
          </div>

          <div
            className="shrink-0 border-t border-border bg-slate-50/90"
            data-ephemeral-id="deck-context-bar"
          >
            <div className="px-3 pt-3 sm:px-4">
              <div className="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground/70 uppercase">
                Reorder slides
              </div>
              <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
                Drag anywhere on a small slide card to move it. Click a card to
                see a large read-only preview above.
              </p>
            </div>
            <SortableContext
              items={order}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-2.5 overflow-x-auto px-3 py-3 sm:px-4 sm:pb-4">
                {orderedSlides.map((slide, index) => (
                  <SlideThumbnail
                    key={slide.id}
                    slide={slide}
                    index={index}
                    isSelected={selectedId === slide.id}
                    onClick={() => setSelectedId(slide.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
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
    </div>
  )
}
