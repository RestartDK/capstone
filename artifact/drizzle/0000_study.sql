DROP TABLE IF EXISTS "notes";
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consented_at" timestamp with time zone,
	"age_range" text,
	"occupation" text,
	"web_app_familiarity" smallint,
	"ai_tool_familiarity" smallint,
	"baseline_is_version_a" boolean
);
--> statement-breakpoint
CREATE TABLE "trials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scenario_id" text NOT NULL,
	"condition" text NOT NULL,
	"trial_index" integer NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"duration_ms" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"correct" boolean,
	"answer_submitted" text,
	"interaction_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "trials_condition_check" CHECK ("condition" in ('baseline', 'ephemeral'))
);
--> statement-breakpoint
CREATE TABLE "trial_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
	"trial_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
	"participant_id" uuid NOT NULL,
	"trial_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"question_key" text NOT NULL,
	"response_value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_outputs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
	"trial_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"prompt_version" text NOT NULL,
	"input_state" jsonb NOT NULL,
	"model_name" text NOT NULL,
	"output" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trials" ADD CONSTRAINT "trials_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trial_events" ADD CONSTRAINT "trial_events_trial_id_trials_id_fk" FOREIGN KEY ("trial_id") REFERENCES "public"."trials"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trial_events" ADD CONSTRAINT "trial_events_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_trial_id_trials_id_fk" FOREIGN KEY ("trial_id") REFERENCES "public"."trials"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_outputs" ADD CONSTRAINT "support_outputs_trial_id_trials_id_fk" FOREIGN KEY ("trial_id") REFERENCES "public"."trials"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "trials_participant_id_idx" ON "trials" USING btree ("participant_id");
--> statement-breakpoint
CREATE INDEX "trials_participant_trial_index_idx" ON "trials" USING btree ("participant_id","trial_index");
--> statement-breakpoint
CREATE INDEX "trial_events_trial_id_idx" ON "trial_events" USING btree ("trial_id");
--> statement-breakpoint
CREATE INDEX "trial_events_event_type_idx" ON "trial_events" USING btree ("event_type");
--> statement-breakpoint
CREATE INDEX "support_outputs_trial_id_idx" ON "support_outputs" USING btree ("trial_id");
