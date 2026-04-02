"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
    acceptanceCriteria:
      "All 4xx/5xx codes documented with examples; reviewed by support lead.",
    linkedIncident: null,
    estimate: "2 pts",
  },
  {
    id: "ticket-api-timeout",
    title: "Harden payout API timeout + retry policy",
    badge: "P0",
    detail: "504s on peak hours · blocking GA for payouts.",
    acceptanceCriteria:
      "p99 latency < 800ms under peak; zero unhandled 504s in staging load test.",
    linkedIncident: "INC-4471",
    estimate: "5 pts",
  },
  {
    id: "ticket-ui-copy",
    title: "Clarify payout status labels in wallet UI",
    badge: "P1",
    detail: "UX clarity for end users; server path unchanged.",
    acceptanceCriteria:
      "New labels pass UX review; no backend changes required.",
    linkedIncident: null,
    estimate: "1 pt",
  },
  {
    id: "ticket-data-hygiene",
    title: "Backfill missing settlement metadata",
    badge: "P1",
    detail: "Needed for reporting once reliability is stable.",
    acceptanceCriteria:
      "Migration script backfills 100% of rows since Jan 1; verified in staging.",
    linkedIncident: null,
    estimate: "3 pts",
  },
];

const BADGE_COLORS: Record<string, string> = {
  P0: "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-500/20 dark:text-red-400 dark:ring-red-500/30",
  P1: "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-500/30",
  P2: "bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400 dark:ring-gray-500/30",
};

const RISKS = [
  { id: "risk-payouts", label: "Payout path still seeing intermittent 504s on peak hours" },
  { id: "risk-scope", label: "Analytics polish requests may expand scope" },
];

type Column = "backlog" | "in_progress";

function initialColumns(): Record<string, Column> {
  return Object.fromEntries(
    TICKETS.map((t) => [t.id, "backlog" as Column]),
  ) as Record<string, Column>;
}

function GripDotsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="13" r="1.5" />
      <circle cx="11" cy="13" r="1.5" />
    </svg>
  );
}

function TicketCardContent({
  ticket,
  columnId,
  isDragging,
}: {
  ticket: Ticket;
  columnId: Column;
  isDragging?: boolean;
}) {
  const t = ticket;
  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-lg border bg-white p-3 shadow-sm transition-shadow dark:bg-gray-900",
        columnId === "in_progress"
          ? "border-blue-200 border-l-[3px] border-l-blue-500 dark:border-blue-800 dark:border-l-blue-500"
          : "border-gray-200 dark:border-gray-700",
        isDragging && "rotate-[2deg] shadow-xl ring-2 ring-blue-400/40",
      )}
    >
      <div className="flex shrink-0 items-center text-gray-300 dark:text-gray-600">
        <GripDotsIcon className="h-4 w-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start gap-2">
          <span className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
            {t.title}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
              BADGE_COLORS[t.badge] ?? BADGE_COLORS.P2,
            )}
          >
            {t.badge}
          </span>
          {t.linkedIncident && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30">
              <svg className="h-2.5 w-2.5" viewBox="0 0 8 8" fill="currentColor">
                <circle cx="4" cy="4" r="4" />
              </svg>
              {t.linkedIncident}
            </span>
          )}
          <span className="ml-auto font-mono text-[11px] text-gray-400 dark:text-gray-500">
            {t.estimate}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {t.detail}
        </p>

        <div className="rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-800/60">
          <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-600 dark:text-gray-300">
              AC:
            </span>{" "}
            {t.acceptanceCriteria}
          </p>
        </div>
      </div>
    </div>
  );
}

function SortableTicketCard({
  ticket,
  columnId,
  disabled,
}: {
  ticket: Ticket;
  columnId: Column;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    cursor: disabled ? "default" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ephemeral-id={ticket.id}
      {...attributes}
      {...listeners}
    >
      <TicketCardContent ticket={ticket} columnId={columnId} />
    </div>
  );
}

function DroppableColumn({
  id,
  children,
  ticketIds,
}: {
  id: string;
  children: React.ReactNode;
  ticketIds: string[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] rounded-b-xl p-2 transition-colors",
        isOver && "bg-blue-50/60 dark:bg-blue-950/30",
      )}
    >
      <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}

export function ScenarioPmSprint(props: {
  onWorkflowAnswerChange: (json: string | null) => void;
  onTicketMoved?: (ticketId: string, column: Column) => void;
  disabled?: boolean;
}): React.ReactElement {
  const [columns, setColumns] = React.useState<Record<string, Column>>(initialColumns);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setColumns(initialColumns());
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function moveToColumn(ticketId: string, targetColumn: Column) {
    setColumns((prev) => {
      const next = { ...prev };
      if (targetColumn === "in_progress") {
        for (const k of Object.keys(next)) {
          if (next[k] === "in_progress") next[k] = "backlog";
        }
      }
      next[ticketId] = targetColumn;
      return next;
    });
    if (targetColumn === "in_progress") {
      props.onTicketMoved?.(ticketId, "in_progress");
    }
  }

  React.useEffect(() => {
    const inProg = TICKETS.find((t) => columns[t.id] === "in_progress");
    props.onWorkflowAnswerChange(
      inProg ? JSON.stringify({ inProgressTicketId: inProg.id }) : null,
    );
  }, [columns, props.onWorkflowAnswerChange]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const overId = over.id as string;

    let targetColumn: Column | null = null;

    if (overId === "backlog" || overId === "in_progress") {
      targetColumn = overId;
    } else {
      targetColumn = columns[overId] ?? null;
    }

    if (!targetColumn) return;

    if (columns[ticketId] !== targetColumn) {
      moveToColumn(ticketId, targetColumn);
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const backlogTickets = TICKETS.filter((t) => columns[t.id] === "backlog");
  const inProgressTickets = TICKETS.filter((t) => columns[t.id] === "in_progress");
  const activeTicket = activeId ? TICKETS.find((t) => t.id === activeId) : null;

  return (
    <div className="space-y-3">
      <div
        className="rounded-lg border border-amber-300/50 bg-gradient-to-r from-amber-50 to-amber-50/30 px-4 py-2.5 dark:border-amber-500/30 dark:from-amber-950/30 dark:to-amber-950/10"
        data-ephemeral-id="sprint-goal-strip"
      >
        <div className="flex items-center gap-2 text-sm">
          <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05 3.689 3.689 0 01-1.218.75 4.49 4.49 0 01-3.3 0 3.689 3.689 0 01-1.218-.75 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.639 7.582l1.715 5.349a1 1 0 01-.285 1.05 3.689 3.689 0 01-1.218.75 4.49 4.49 0 01-3.3 0 3.689 3.689 0 01-1.218-.75 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.789l1.599.799L9 4.323V3a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <span className="font-semibold text-amber-800 dark:text-amber-300">Sprint goal: </span>
            <span className="text-amber-700 dark:text-amber-400/80">
              Restore reliable payouts by Friday; cut customer-visible payout errors to near zero.
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800/50">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Risks
        </span>
        {RISKS.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/60 px-2.5 py-1 text-xs text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {r.label}
          </span>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm dark:border-gray-700 dark:bg-gray-900/50">
            <div className="border-b-2 border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2"
                  data-ephemeral-id="backlog-column-header"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Backlog
                  </span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {backlogTickets.length}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  {backlogTickets.reduce((sum, t) => {
                    const n = parseInt(TICKETS.find((x) => x.id === t.id)?.estimate ?? "0");
                    return sum + (isNaN(n) ? 0 : n);
                  }, 0)}{" "}
                  pts
                </span>
              </div>
            </div>

            <DroppableColumn id="backlog" ticketIds={backlogTickets.map((t) => t.id)}>
              {backlogTickets.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-xs text-gray-400 dark:text-gray-500">
                  No items in backlog
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {backlogTickets.map((t) => (
                    <SortableTicketCard
                      key={t.id}
                      ticket={t}
                      columnId="backlog"
                      disabled={props.disabled}
                    />
                  ))}
                </div>
              )}
            </DroppableColumn>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm dark:border-blue-800/50 dark:bg-blue-950/20">
            <div className="border-b-2 border-blue-400 bg-white px-4 py-3 dark:border-blue-600 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2"
                  data-ephemeral-id="in-progress-column-header"
                >
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    In Progress
                  </span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                    {inProgressTickets.length}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-blue-400 dark:text-blue-500">
                  Limit: 1
                </span>
              </div>
            </div>

            <DroppableColumn id="in_progress" ticketIds={inProgressTickets.map((t) => t.id)}>
              {inProgressTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/40 py-12 dark:border-blue-800/50 dark:bg-blue-950/10">
                  <svg
                    className="h-8 w-8 text-blue-300 dark:text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span className="text-xs font-medium text-blue-400 dark:text-blue-600">
                    Drop a ticket here
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {inProgressTickets.map((t) => (
                    <SortableTicketCard
                      key={t.id}
                      ticket={t}
                      columnId="in_progress"
                      disabled={props.disabled}
                    />
                  ))}
                </div>
              )}
            </DroppableColumn>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTicket ? (
            <div className="w-[400px] max-w-[90vw]" data-ephemeral-id={activeTicket.id}>
              <TicketCardContent
                ticket={activeTicket}
                columnId={columns[activeTicket.id]}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
