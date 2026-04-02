"use client";

import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  title: string;
  badge: string;
  detail: string;
  acceptanceCriteria: string;
  linkedIncident: string | null;
  estimate: string;
};

const TICKETS: Ticket[] = [
  {
    id: "ticket-docs-lag",
    title: "Refresh API error codes in help center",
    badge: "P2",
    detail: "Support deflection; not blocking release.",
    acceptanceCriteria: "All 4xx/5xx codes documented with examples; reviewed by support lead.",
    linkedIncident: null,
    estimate: "2 pts",
  },
  {
    id: "ticket-api-timeout",
    title: "Harden payout API timeout + retry policy",
    badge: "P0",
    detail: "504s on peak hours · blocking GA for payouts.",
    acceptanceCriteria: "p99 latency < 800ms under peak; zero unhandled 504s in staging load test.",
    linkedIncident: "INC-4471",
    estimate: "5 pts",
  },
  {
    id: "ticket-ui-copy",
    title: "Clarify payout status labels in wallet UI",
    badge: "P1",
    detail: "UX clarity for end users; server path unchanged.",
    acceptanceCriteria: "New labels pass UX review; no backend changes required.",
    linkedIncident: null,
    estimate: "1 pt",
  },
  {
    id: "ticket-data-hygiene",
    title: "Backfill missing settlement metadata",
    badge: "P1",
    detail: "Needed for reporting once reliability is stable.",
    acceptanceCriteria: "Migration script backfills 100% of rows since Jan 1; verified in staging.",
    linkedIncident: null,
    estimate: "3 pts",
  },
];

const BADGE_COLORS: Record<string, string> = {
  P0: "bg-red-500/15 text-red-700 dark:text-red-400",
  P1: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  P2: "bg-muted text-muted-foreground",
};

const RISKS = [
  { id: "risk-payouts", label: "Payout path still seeing intermittent 504s on peak hours" },
  { id: "risk-scope", label: "Analytics polish requests may expand scope" },
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

      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Risks: </span>
        {RISKS.map((r, i) => (
          <span key={r.id}>
            {i > 0 && " · "}
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              {r.label}
            </span>
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            data-ephemeral-id="backlog-column-header"
          >
            Backlog
          </div>
          <div className="text-xs text-muted-foreground">
            {TICKETS.length} items · pick one to move to In&nbsp;progress
          </div>
        </div>
        <div className="divide-y divide-border">
          {TICKETS.map((t) => (
            <button
              key={t.id}
              type="button"
              data-ephemeral-id={t.id}
              disabled={props.disabled}
              onClick={() => props.onSelect(t.id)}
              className={cn(
                "flex w-full flex-col px-4 py-3 text-left text-sm transition-colors",
                "hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:outline-none",
                props.selectedId === t.id && "bg-primary/5 ring-2 ring-inset ring-primary/30",
                props.disabled && "pointer-events-none opacity-60",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{t.title}</span>
                <span className={cn("rounded px-1.5 py-0.5 font-mono text-xs font-semibold", BADGE_COLORS[t.badge] ?? BADGE_COLORS.P2)}>
                  {t.badge}
                </span>
                {t.linkedIncident && (
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-xs text-red-600 dark:text-red-400">
                    {t.linkedIncident}
                  </span>
                )}
                <span className="ml-auto font-mono text-xs text-muted-foreground">{t.estimate}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                <span className="font-medium">AC:</span> {t.acceptanceCriteria}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
