"use client";

import { cn } from "@/lib/utils";

const SLIDES: { id: string; title: string; bullets: string[] }[] = [
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
  disabled?: boolean;
}): React.ReactElement {
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
        {SLIDES.map((slide) => (
          <button
            key={slide.id}
            type="button"
            data-ephemeral-id={slide.id}
            disabled={props.disabled}
            onClick={() => props.onSelect(slide.id)}
            className={cn(
              "rounded-xl border border-border bg-card p-4 text-left text-sm shadow-sm transition-colors",
              "hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              props.selectedId === slide.id && "border-primary ring-2 ring-primary/30",
              props.disabled && "pointer-events-none opacity-60",
            )}
          >
            <div className="font-medium text-foreground">{slide.title}</div>
            <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
              {slide.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}
