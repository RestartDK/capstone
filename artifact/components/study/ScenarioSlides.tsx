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

import { Button } from "@/components/ui/button"
import type { SlidesTaskState } from "@/lib/scenarios/task-state"
import { cn } from "@/lib/utils"

type SlideData = {
  id: string
  title: string
  bullets: string[]
}

export type SlidesAttemptState = {
  hasReordered: boolean
  hasEditedProblem: boolean
  readyToSubmit: boolean
}

type SlideKind = "title" | "problem" | "metrics" | "ask"

function kindForSlideId(slideId: string): SlideKind {
  if (slideId === "slide-title-card") return "title"
  if (slideId === "slide-problem-card") return "problem"
  if (slideId === "slide-metrics-card") return "metrics"
  return "ask"
}

function cloneSlidesState(
  slides: SlidesTaskState["slides"],
  order: readonly string[]
): SlideData[] {
  const defs = Object.fromEntries(slides.map((slide) => [slide.id, slide]))
  return order.map((id) => {
    const d = defs[id]
    return { id, title: d.title, bullets: [...d.bullets] }
  })
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

function SlideBulletInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  disabled?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-200 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/30 focus:outline-none disabled:cursor-not-allowed",
        className
      )}
      placeholder={placeholder}
    />
  )
}

function MiniSlidePreview({ slide }: { slide: SlideData }) {
  const kind = kindForSlideId(slide.id)
  const accent =
    kind === "problem"
      ? "bg-amber-100 text-amber-900"
      : kind === "metrics"
        ? "bg-sky-100 text-sky-900"
        : kind === "ask"
          ? "bg-violet-100 text-violet-900"
          : "bg-slate-100 text-slate-900"

  return (
    <div className="aspect-[16/9] w-full rounded-[10px] border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase",
            accent
          )}
        >
          {kind}
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
  disabled,
  onUpdateBullet,
  onRemoveBullet,
  onAddBullet,
}: {
  slide: SlideData
  deckLabel: string
  deckDeadlineLabel: string
  orderIndex: number
  totalSlides: number
  disabled?: boolean
  onUpdateBullet: (bulletIndex: number, value: string) => void
  onRemoveBullet: (bulletIndex: number) => void
  onAddBullet: () => void
}) {
  const kind = kindForSlideId(slide.id)

  if (kind === "title") {
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
              <SlideBulletInput
                key={bulletIndex}
                value={bullet}
                onChange={(value) => onUpdateBullet(bulletIndex, value)}
                disabled={disabled}
                placeholder="Subtitle or context"
                className="px-0 text-base text-slate-600 hover:border-transparent focus:border-transparent focus:bg-transparent focus:ring-0 sm:text-lg"
              />
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

  if (kind === "problem") {
    return (
      <div className="flex h-full flex-col gap-5 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-[0.18em] text-amber-700 uppercase">
              Problem framing
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
          className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-900"
          data-ephemeral-id="slide-problem-hint"
        >
          Weak phrasing is okay to keep until you improve it. The important part
          is making the risk explicit, for example delays, confusion, missed
          goals, or a complaint spike.
        </div>
        <div className="grid gap-3" data-ephemeral-id="slide-problem-bullets">
          {slide.bullets.map((bullet, bulletIndex) => (
            <div
              key={bulletIndex}
              className="group/bullet flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2"
            >
              <span className="mt-2 size-2 rounded-full bg-amber-500" />
              <SlideBulletInput
                value={bullet}
                onChange={(value) => onUpdateBullet(bulletIndex, value)}
                disabled={disabled}
                placeholder="State the real problem or risk"
                className="min-h-[44px] px-0 text-base leading-7 hover:border-transparent focus:border-transparent focus:bg-transparent focus:ring-0"
              />
              {slide.bullets.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => onRemoveBullet(bulletIndex)}
                  className="mt-1 shrink-0 opacity-0 transition-opacity group-hover/bullet:opacity-100 hover:bg-destructive/10 hover:text-destructive"
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
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-auto border-t border-slate-200 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onAddBullet}
            className="text-xs font-normal text-slate-600"
          >
            + Add bullet
          </Button>
        </div>
      </div>
    )
  }

  if (kind === "metrics") {
    return (
      <div className="flex h-full flex-col gap-6 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-[0.18em] text-sky-700 uppercase">
              Evidence
            </div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {slide.title}
            </h3>
          </div>
          <div className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-800">
            Support the story with data
          </div>
        </div>
        <div className="grid flex-1 gap-4 md:grid-cols-3">
          {slide.bullets.map((bullet, bulletIndex) => (
            <div
              key={bulletIndex}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                Metric {bulletIndex + 1}
              </div>
              <SlideBulletInput
                value={bullet}
                onChange={(value) => onUpdateBullet(bulletIndex, value)}
                disabled={disabled}
                placeholder="Metric line"
                className="mt-3 px-0 text-lg font-semibold tracking-tight hover:border-transparent focus:border-transparent focus:bg-transparent focus:ring-0"
              />
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
                className="group/bullet flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2"
              >
                <span className="mt-1.5 text-violet-600">→</span>
                <SlideBulletInput
                  value={bullet}
                  onChange={(value) => onUpdateBullet(bulletIndex, value)}
                  disabled={disabled}
                  placeholder="Ask or owner line"
                  className="px-0 text-base hover:border-transparent focus:border-transparent focus:bg-transparent focus:ring-0"
                />
                {slide.bullets.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={disabled}
                    onClick={() => onRemoveBullet(bulletIndex)}
                    className="mt-1 shrink-0 opacity-0 transition-opacity group-hover/bullet:opacity-100 hover:bg-destructive/10 hover:text-destructive"
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
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={onAddBullet}
              className="text-xs font-normal text-slate-600"
            >
              + Add bullet
            </Button>
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
      onClick={onClick}
      className={cn(
        "group/thumb w-[192px] shrink-0 cursor-pointer rounded-xl border p-2 transition-all",
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
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripIcon className="size-3.5" />
        </div>
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
  onSlideEdited,
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
  }) => void
  onSlideEdited?: (slideId: string) => void
  onSlideReordered?: (fromIndex: number, toIndex: number) => void
  onAttemptStateChange?: (state: SlidesAttemptState) => void
  disabled?: boolean
}): React.ReactElement {
  const initialSlides = React.useMemo(
    () => cloneSlidesState(taskState.slides, initialOrder),
    [initialOrder, taskState.slides]
  )
  const [order, setOrder] = React.useState<string[]>(() => [...initialOrder])
  const [slidesById, setSlidesById] = React.useState<Record<string, SlideData>>(
    () => {
      const map: Record<string, SlideData> = {}
      for (const s of initialSlides) {
        map[s.id] = s
      }
      return map
    }
  )
  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => initialOrder[0] ?? null
  )
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null)
  const [hasReordered, setHasReordered] = React.useState(false)
  const [hasEditedProblem, setHasEditedProblem] = React.useState(false)
  const onAttemptStateChangeRef = React.useRef(onAttemptStateChange)

  React.useEffect(() => {
    onAttemptStateChangeRef.current = onAttemptStateChange
  }, [onAttemptStateChange])

  React.useEffect(() => {
    const map: Record<string, SlideData> = {}
    for (const slide of initialSlides) {
      map[slide.id] = slide
    }
    setSlidesById(map)
    setOrder([...initialOrder])
    setSelectedId(initialOrder[0] ?? null)
    setActiveDragId(null)
    setHasReordered(false)
    setHasEditedProblem(false)
  }, [initialOrder, initialSlides])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const orderedSlides = React.useMemo(
    () => order.map((id) => slidesById[id]).filter(Boolean) as SlideData[],
    [order, slidesById]
  )

  const selectedSlide = selectedId ? slidesById[selectedId] : null

  React.useEffect(() => {
    const problem = slidesById["slide-problem-card"]
    const bullets = problem ? problem.bullets : []
    const payload = JSON.stringify({ order, problemBullets: bullets })
    onAnswerPayloadChange(payload)
    onLiveOutlineChange?.({
      order: [...order],
      problemBullets: [...bullets],
    })
  }, [onAnswerPayloadChange, onLiveOutlineChange, order, slidesById])

  React.useEffect(() => {
    onAttemptStateChangeRef.current?.({
      hasReordered,
      hasEditedProblem,
      readyToSubmit: hasReordered && hasEditedProblem,
    })
  }, [hasEditedProblem, hasReordered])

  function fireEdit(slideId: string) {
    onSlideEdited?.(slideId)
    if (slideId === "slide-problem-card") {
      setHasEditedProblem(true)
    }
  }

  function updateBullet(slideId: string, bulletIndex: number, value: string) {
    setSlidesById((prev) => {
      const s = prev[slideId]
      if (!s) return prev
      const nextBullets = [...s.bullets]
      nextBullets[bulletIndex] = value
      return { ...prev, [slideId]: { ...s, bullets: nextBullets } }
    })
    fireEdit(slideId)
  }

  function addBullet(slideId: string) {
    setSlidesById((prev) => {
      const s = prev[slideId]
      if (!s) return prev
      return { ...prev, [slideId]: { ...s, bullets: [...s.bullets, ""] } }
    })
    fireEdit(slideId)
  }

  function removeBullet(slideId: string, bulletIndex: number) {
    setSlidesById((prev) => {
      const s = prev[slideId]
      if (!s || s.bullets.length <= 1) return prev
      return {
        ...prev,
        [slideId]: {
          ...s,
          bullets: s.bullets.filter((_, i) => i !== bulletIndex),
        },
      }
    })
    fireEdit(slideId)
  }

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
  const readyToSubmit = hasReordered && hasEditedProblem

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
                      ? "Draft is ready to submit from the bar below."
                      : "Edit the selected slide above, then reorder thumbnails underneath."}
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
                    <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px]">
                      Slide view
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
                        disabled={disabled}
                        onUpdateBullet={(bulletIndex, value) =>
                          updateBullet(selectedSlide.id, bulletIndex, value)
                        }
                        onRemoveBullet={(bulletIndex) =>
                          removeBullet(selectedSlide.id, bulletIndex)
                        }
                        onAddBullet={() => addBullet(selectedSlide.id)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 text-sm text-muted-foreground">
                  Select a slide to edit
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
                Drag left or right to change the story order. Click a thumbnail
                to select it for editing.
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
