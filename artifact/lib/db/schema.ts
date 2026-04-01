import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  consentedAt: timestamp("consented_at", { withTimezone: true }),
  ageRange: text("age_range"),
  occupation: text("occupation"),
  webAppFamiliarity: smallint("web_app_familiarity"),
  aiToolFamiliarity: smallint("ai_tool_familiarity"),
  /** If true, baseline condition is labeled "Version A" in final questions; ephemeral is "B". */
  baselineIsVersionA: boolean("baseline_is_version_a"),
});

export const trials = pgTable(
  "trials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    scenarioId: text("scenario_id").notNull(),
    condition: text("condition").notNull().$type<"baseline" | "ephemeral">(),
    trialIndex: integer("trial_index").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    completed: boolean("completed").notNull().default(false),
    correct: boolean("correct"),
    answerSubmitted: text("answer_submitted"),
    interactionCount: integer("interaction_count").notNull().default(0),
  },
  (t) => [
    index("trials_participant_id_idx").on(t.participantId),
    index("trials_participant_trial_index_idx").on(t.participantId, t.trialIndex),
  ],
);

export const trialEvents = pgTable(
  "trial_events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    trialId: uuid("trial_id")
      .notNull()
      .references(() => trials.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull().default({}),
  },
  (t) => [
    index("trial_events_trial_id_idx").on(t.trialId),
    index("trial_events_event_type_idx").on(t.eventType),
  ],
);

export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  participantId: uuid("participant_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  trialId: uuid("trial_id").references(() => trials.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  questionKey: text("question_key").notNull(),
  responseValue: text("response_value").notNull(),
});

export const supportOutputs = pgTable(
  "support_outputs",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    trialId: uuid("trial_id")
      .notNull()
      .references(() => trials.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    promptVersion: text("prompt_version").notNull(),
    inputState: jsonb("input_state").notNull(),
    modelName: text("model_name").notNull(),
    output: jsonb("output").notNull(),
  },
  (t) => [index("support_outputs_trial_id_idx").on(t.trialId)],
);

export type Participant = typeof participants.$inferSelect;
export type Trial = typeof trials.$inferSelect;
export type NewTrial = typeof trials.$inferInsert;
