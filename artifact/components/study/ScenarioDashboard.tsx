"use client";

import { cn } from "@/lib/utils";

export type DashboardOption = { id: string; title: string; subtitle: string; metric: string };

const OPTIONS: DashboardOption[] = [
  {
    id: "payments-backlog-card",
    title: "Payments backlog",
    subtitle: "Queued payouts and exceptions",
    metric: "212 open · +18% vs last week",
  },
  {
    id: "engineering-backlog-card",
    title: "Engineering backlog",
    subtitle: "Feature and bug queue",
    metric: "94 open · flat vs last week",
  },
  {
    id: "sla-breaches-card",
    title: "SLA breaches",
    subtitle: "Tickets past target response",
    metric: "17 this week · +4 vs prior week",
  },
  {
    id: "customer-sentiment-card",
    title: "Customer sentiment",
    subtitle: "Rolling survey signal",
    metric: "4.1 / 5 · slight dip",
  },
];

export function ScenarioDashboard(props: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        data-ephemeral-id="alerts-strip"
      >
        <span className="font-medium text-foreground">Alerts: </span>
        Payments delivery risk increased week over week · Engineering stability returned to baseline
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            data-ephemeral-id={opt.id}
            disabled={props.disabled}
            onClick={() => props.onSelect(opt.id)}
            className={cn(
              "rounded-xl border border-border bg-card p-4 text-left text-sm shadow-sm transition-colors",
              "hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              props.selectedId === opt.id && "border-primary ring-2 ring-primary/30",
              props.disabled && "pointer-events-none opacity-60",
            )}
          >
            <div className="font-medium text-foreground">{opt.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{opt.subtitle}</div>
            <div className="mt-2 font-mono text-xs text-muted-foreground">{opt.metric}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { OPTIONS as DASHBOARD_OPTIONS };
