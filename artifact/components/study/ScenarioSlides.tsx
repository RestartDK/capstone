"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SlideData = {
  id: string;
  title: string;
  bullets: string[];
};

const INITIAL_SLIDES: SlideData[] = [
  {
    id: "slide-title-card",
    title: "Title — Q3 priorities",
    bullets: ["Session objective", "Owners TBD"],
  },
  {
    id: "slide-problem-card",
    title: "Problem framing",
    bullets: ["Customers want faster payouts", "Needs sharper evidence"],
  },
  {
    id: "slide-metrics-card",
    title: "Metrics snapshot",
    bullets: ["ARR +12% QoQ", "Net retention 118%", "Funnel: +3pp conversion"],
  },
  {
    id: "slide-cta-card",
    title: "Ask",
    bullets: ["Approve Q3 focus", "Option A: deepen payouts", "Option B: expand wallet"],
  },
];

export function ScenarioSlides(props: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit?: (slideId: string) => void;
  disabled?: boolean;
}): React.ReactElement {
  const [slides, setSlides] = React.useState<SlideData[]>(() =>
    INITIAL_SLIDES.map((s) => ({ ...s, bullets: [...s.bullets] })),
  );
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  function fireEdit(slideId: string) {
    props.onEdit?.(slideId);
  }

  function updateBullet(slideId: string, bulletIndex: number, value: string) {
    setSlides((prev) =>
      prev.map((s) => {
        if (s.id !== slideId) return s;
        const next = [...s.bullets];
        next[bulletIndex] = value;
        return { ...s, bullets: next };
      }),
    );
    fireEdit(slideId);
  }

  function addBullet(slideId: string) {
    setSlides((prev) =>
      prev.map((s) => {
        if (s.id !== slideId) return s;
        return { ...s, bullets: [...s.bullets, ""] };
      }),
    );
    fireEdit(slideId);
  }

  function removeBullet(slideId: string, bulletIndex: number) {
    setSlides((prev) =>
      prev.map((s) => {
        if (s.id !== slideId) return s;
        if (s.bullets.length <= 1) return s;
        return { ...s, bullets: s.bullets.filter((_, i) => i !== bulletIndex) };
      }),
    );
    fireEdit(slideId);
  }

  function handleCardClick(slideId: string) {
    props.onSelect(slideId);
  }

  function toggleExpand(e: React.MouseEvent, slideId: string) {
    e.stopPropagation();
    setExpandedId((prev) => (prev === slideId ? null : slideId));
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        data-ephemeral-id="deck-context-bar"
      >
        <span className="font-medium text-foreground">Deck context: </span>
        Stakeholder readout tomorrow · Goal: traction, Q3 focus, one explicit risk
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {slides.map((slide) => {
          const isExpanded = expandedId === slide.id;
          const isSelected = props.selectedId === slide.id;

          return (
            <div
              key={slide.id}
              data-ephemeral-id={slide.id}
              className={cn(
                "rounded-xl border border-border bg-card shadow-sm transition-colors",
                "hover:border-primary/40",
                isSelected && "border-primary ring-2 ring-primary/30",
                props.disabled && "pointer-events-none opacity-60",
              )}
            >
              <button
                type="button"
                className="flex w-full items-start justify-between p-4 text-left text-sm"
                disabled={props.disabled}
                onClick={() => handleCardClick(slide.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">{slide.title}</div>
                  {!isExpanded && (
                    <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                      {slide.bullets.map((b, i) => (
                        <li key={i}>{b || <span className="italic opacity-50">empty</span>}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={(e) => toggleExpand(e, slide.id)}
                  tabIndex={-1}
                >
                  {isExpanded ? "collapse" : "edit"}
                </button>
              </button>

              {isExpanded && (
                <div
                  className="space-y-2 border-t border-border px-4 pb-4 pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {slide.bullets.map((bullet, bi) => (
                    <div key={bi} className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => updateBullet(slide.id, bi, e.target.value)}
                        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        placeholder="Bullet point…"
                      />
                      {slide.bullets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBullet(slide.id, bi)}
                          className="shrink-0 rounded px-1 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addBullet(slide.id)}
                    className="rounded px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    + add bullet
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
