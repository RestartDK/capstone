"use client";

import { cn } from "@/lib/utils";

export type DashboardOption = {
  id: string;
  title: string;
  subtitle: string;
  metric: string;
  trend: string;
  sparkline: number[];
  updatedAt: string;
};

const OPTIONS: DashboardOption[] = [
  {
    id: "payments-backlog-card",
    title: "Payments backlog",
    subtitle: "Queued payouts and exceptions",
    metric: "212 open",
    trend: "+18% vs last week",
    sparkline: [140, 155, 168, 175, 190, 198, 212],
    updatedAt: "Updated 12 min ago",
  },
  {
    id: "engineering-backlog-card",
    title: "Engineering backlog",
    subtitle: "Feature and bug queue",
    metric: "94 open",
    trend: "flat vs last week",
    sparkline: [91, 96, 93, 95, 92, 94, 94],
    updatedAt: "Updated 28 min ago",
  },
  {
    id: "sla-breaches-card",
    title: "SLA breaches",
    subtitle: "Tickets past target response",
    metric: "17 this week",
    trend: "+4 vs prior week",
    sparkline: [8, 9, 11, 10, 13, 15, 17],
    updatedAt: "Updated 6 min ago",
  },
  {
    id: "customer-sentiment-card",
    title: "Customer sentiment",
    subtitle: "Rolling survey signal",
    metric: "4.1 / 5",
    trend: "slight dip",
    sparkline: [44, 45, 44, 43, 42, 42, 41],
    updatedAt: "Updated 1 hr ago",
  },
];

function MiniSparkline(props: { points: number[]; rising?: boolean }) {
  const { points } = props;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const h = 24;
  const w = 56;
  const step = w / (points.length - 1);

  const d = points
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-14" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
        <span className="mr-3 inline-flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
          Payments delivery risk increased week over week
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
          Engineering stability returned to baseline
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const trendNegative = opt.trend.startsWith("+") || opt.trend.includes("dip");
          return (
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
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{opt.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{opt.subtitle}</div>
                </div>
                <div className={cn("shrink-0", trendNegative ? "text-red-500/70" : "text-green-500/70")}>
                  <MiniSparkline points={opt.sparkline} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-sm font-semibold text-foreground">{opt.metric}</span>
                <span
                  className={cn(
                    "rounded px-1 py-0.5 font-mono text-[10px]",
                    trendNegative ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-green-500/10 text-green-600 dark:text-green-400",
                  )}
                >
                  {opt.trend}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground/60">{opt.updatedAt}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { OPTIONS as DASHBOARD_OPTIONS };
