export const SCENARIO_ID = "dashboard-priority" as const;

/** Ground truth: participant should identify this card as needing most immediate attention. */
export const DASHBOARD_CORRECT_ANSWER = "payments-backlog-card" as const;

export const TRIALS_PER_PARTICIPANT = 2;

export const COOKIE_PARTICIPANT = "artifact_participant_id" as const;

export const POST_TRIAL_KEYS = ["helpfulness", "intrusiveness", "control"] as const;

export const FINAL_QUESTION_KEYS = [
  "final_preference",
  "final_helpfulness",
  "final_intrusiveness",
  "final_real_life",
] as const;
