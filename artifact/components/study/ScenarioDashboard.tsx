"use client"

import * as React from "react"

import type { DashboardTaskState } from "@/lib/scenarios/task-state"
import { cn } from "@/lib/utils"

function MiniSparkline(props: { points: number[] }): React.ReactElement {
  const { points } = props
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const h = 24
  const w = 56
  const step = w / (points.length - 1)

  const d = points
    .map((v, i) => {
      const x = i * step
      const y = h - ((v - min) / range) * h
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-14" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const SIDEBAR_ICONS = [
  {
    label: "Home",
    active: true,
    path: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z",
  },
  {
    label: "Charts",
    active: false,
    path: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    label: "Alerts",
    active: false,
    path: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  },
  {
    label: "Logs",
    active: false,
    path: "M4 6h16M4 10h16M4 14h10M4 18h6",
  },
  {
    label: "Settings",
    active: false,
    path: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
  },
]

const NAV_TABS = ["Overview", "Messages", "Tasks", "Notes"]

export function ScenarioDashboard(props: {
  taskState: DashboardTaskState
  selectedId: string | null
  onSelect: (id: string) => void
  disabled?: boolean
}): React.ReactElement {
  const { taskState } = props
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-lg">
      {/* Top navigation bar */}
      <div className="flex h-11 items-center justify-between border-b border-border bg-card px-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-indigo-500" />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {taskState.workspaceTitle}
            </span>
          </div>
          <nav className="hidden items-center gap-0.5 sm:flex">
            {NAV_TABS.map((tab) => (
              <span
                key={tab}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium",
                  tab === "Overview"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {tab}
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Updated 2 min ago</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
            JD
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left icon sidebar */}
        <div className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-muted/50 py-3 sm:flex">
          {SIDEBAR_ICONS.map((icon) => (
            <span
              key={icon.label}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                icon.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/60"
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <path d={icon.path} />
              </svg>
            </span>
          ))}
        </div>

        {/* Main content area */}
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-4">
            <h1 className="text-sm font-semibold text-foreground">
              {taskState.title}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {taskState.timestampLabel}
            </p>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
              data-ephemeral-id="alerts-strip"
            >
              <span className="font-medium text-foreground">Updates: </span>
              {taskState.alerts.map((alert, index) => (
                <span
                  key={alert.id}
                  className="mr-2 inline-flex items-center gap-1"
                >
                  <span
                    className={cn(
                      "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                      index === 0
                        ? "bg-red-500"
                        : index === 1
                          ? "bg-amber-500"
                          : "bg-green-500"
                    )}
                  />
                  {alert.label}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {taskState.cards.map((opt) => {
                const trendNegative =
                  opt.trend.startsWith("+") || opt.trend.includes("dip")
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
                      props.selectedId === opt.id &&
                        "border-primary ring-2 ring-primary/30",
                      props.disabled && "pointer-events-none opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">
                          {opt.title}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {opt.subtitle}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "shrink-0",
                          trendNegative
                            ? "text-red-500/70"
                            : "text-green-500/70"
                        )}
                      >
                        <MiniSparkline points={opt.sparkline} />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {opt.metric}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1 py-0.5 font-mono text-xs",
                          trendNegative
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-green-500/10 text-green-600 dark:text-green-400"
                        )}
                      >
                        {opt.trend}
                      </span>
                    </div>
                    {opt.footnote ? (
                      <p className="mt-2 text-xs leading-snug text-muted-foreground/90">
                        {opt.footnote}
                      </p>
                    ) : null}
                    <div className="mt-2 text-xs text-muted-foreground/60">
                      {opt.updatedAt}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
