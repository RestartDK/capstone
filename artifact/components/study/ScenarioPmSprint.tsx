"use client";

import { cn } from "@/lib/utils";

const TICKETS: { id: string; title: string; badge: string; detail: string }[] = [
  {
    id: "ticket-docs-lag",
    title: "Refresh API error codes in help center",
    badge: "P2",
    detail: "Support deflection; not blocking release.",
  },
  {
    id: "ticket-api-timeout",
    title: "Harden payout API timeout + retry policy",
    badge: "P0",
    detail: "504s on peak · blocking GA for payouts.",
  },
  {
    id: "ticket-ui-copy",
    title: "Clarify payout status labels in wallet UI",
    badge: "P1",
    detail: "UX clarity; server path unchanged.",
  },
  {
    id: "ticket-data-hygiene",
    title: "Backfill missing settlement metadata",
    badge: "P1",
    detail: "Reporting after reliability stabilizes.",
  },
];

export function ScenarioPmSprint(props: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground"
        data-ephemeral-id="sprint-goal-strip"
      >
        <span className="font-medium text-foreground">Sprint goal: </span>
        Restore reliable payouts by Friday; cut customer-visible payout errors to near zero.
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div
          className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          data-ephemeral-id="backlog-column-header"
        >
          Backlog — pick one to move to In progress first
        </div>
        <div className="space-y-2">
          {TICKETS.map((t) => (
            <button
              key={t.id}
              type="button"
              data-ephemeral-id={t.id}
              disabled={props.disabled}
              onClick={() => props.onSelect(t.id)}
              className={cn(
                "flex w-full flex-col rounded-lg border border-border bg-background p-3 text-left text-sm transition-colors",
                "hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                props.selectedId === t.id && "border-primary ring-2 ring-primary/30",
                props.disabled && "pointer-events-none opacity-60",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{t.title}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {t.badge}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.detail}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
