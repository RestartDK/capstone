import { SCENARIO_ID } from "./constants";

export type TaskStateMetric = { id: string; label: string; value: string | number };
export type TaskStateAlert = { id: string; label: string };

export type DashboardTaskState = {
  scenarioId: typeof SCENARIO_ID;
  metrics: TaskStateMetric[];
  alerts: TaskStateAlert[];
};

/** Deterministic dashboard copy for prompts and /api/support. */
export function getDashboardTaskState(): DashboardTaskState {
  return {
    scenarioId: SCENARIO_ID,
    metrics: [
      { id: "ticket-backlog", label: "Ticket backlog", value: 48 },
      { id: "missed-sla", label: "Missed SLA (7d)", value: 17 },
      { id: "payments-queue", label: "Payments queue depth", value: 212 },
      { id: "csat", label: "CSAT (rolling)", value: "4.1 / 5" },
    ],
    alerts: [
      { id: "payments-risk", label: "Payments delivery risk increased week over week" },
      { id: "eng-stability", label: "Engineering stability returned to baseline" },
    ],
  };
}
