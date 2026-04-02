"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
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
              <div className="flex w-full items-start">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={props.disabled}
                  onClick={() => handleCardClick(slide.id)}
                  className="h-auto min-w-0 flex-1 flex-col items-stretch justify-start gap-0 rounded-none p-4 text-left text-sm font-normal hover:bg-muted/50"
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
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={props.disabled}
                  onClick={(e) => toggleExpand(e, slide.id)}
                  className="mt-4 mr-4 shrink-0 px-1.5 py-0.5 text-xs font-normal text-muted-foreground"
                >
                  {isExpanded ? "collapse" : "edit"}
                </Button>
              </div>

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
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removeBullet(slide.id, bi)}
                          className="h-6 min-w-6 shrink-0 px-1 py-0 text-xs font-normal text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => addBullet(slide.id)}
                    className="h-6 px-2 text-xs font-normal text-muted-foreground"
                  >
                    + add bullet
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
