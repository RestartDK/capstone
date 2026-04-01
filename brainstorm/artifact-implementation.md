# Artifact implementation

## Goal

This document turns the artifact plan into a concrete technical implementation using:

- Next.js
- PostgreSQL
- a small server-side GenAI integration
- first-party event logging for study analytics

The artifact is a web-based research prototype in which:

- the main interface stays stable
- GenAI only powers bounded ephemeral support
- the study records task performance and questionnaire responses

## High-level architecture

### Frontend

Responsible for:

- consent and participant flow
- task rendering
- ephemeral UI rendering
- questionnaires
- client-side event capture

### Next.js server

Responsible for:

- participant creation
- trial creation and progression
- event ingestion
- questionnaire submission
- GenAI calls
- database writes
- CSV export for analysis

### PostgreSQL

Responsible for storing:

- participants
- trials
- trial events
- questionnaire responses
- optional cached GenAI outputs

## Core principle for GenAI

The model should not generate arbitrary UI code.

The model should return a constrained payload such as:

```json
{
  "targetId": "payments-backlog-card",
  "effectType": "arrow-highlight",
  "message": "This area likely needs attention because backlog and SLA misses are both rising.",
  "dismissible": true
}
```

The frontend then maps that payload to a fixed set of renderable ephemeral behaviors.

## Recommended project structure

```text
app/
  page.tsx
  consent/page.tsx
  participant/page.tsx
  study/page.tsx
  questionnaire/page.tsx
  complete/page.tsx
  api/
    participants/route.ts
    trials/route.ts
    events/route.ts
    questionnaire/route.ts
    support/route.ts
    export/route.ts
components/
  study/
    TrialRunner.tsx
    ScenarioDashboard.tsx
    PostTrialQuestions.tsx
    FinalQuestions.tsx
  ephemeral/
    EphemeralLayer.tsx
    ArrowCue.tsx
    HighlightRing.tsx
    InlineBubble.tsx
lib/
  db.ts
  analytics.ts
  study.ts
  support-schema.ts
  prompts.ts
  export.ts
```

## First version scope

Build only one scenario first:

- dashboard interpretation task

Build only two conditions:

- baseline
- ephemeral

Build only a small set of ephemeral effects:

- `arrow`
- `highlight`
- `inline_bubble`
- `arrow-highlight`

This keeps the implementation controlled and testable.

## Suggested user flow

### 1. Consent page

Purpose:

- explain the study briefly
- collect consent
- move the user into the study

Frontend actions:

- show consent text
- checkbox for consent
- start button

On submit:

- create participant record
- store returned `participantId` in a secure cookie or session

### 2. Background form page

Fields:

- age range
- occupation or role
- familiarity with web apps
- familiarity with AI-assisted tools

On submit:

- update participant record
- create the first trial

### 3. Study page

Purpose:

- render the current task
- render baseline or ephemeral condition
- capture task answer
- log events

The participant should not see the internal condition label.

### 4. Post-trial question page

Questions after each trial:

- helpfulness
- intrusiveness
- perceived control

### 5. Final question page

Questions after all trials:

- overall preference
- overall helpfulness comparison
- overall intrusiveness comparison
- real-life preference
- optional final comment

### 6. Completion page

Purpose:

- thank participant
- optionally show completion code

## Database schema

Use simple relational tables. Do not overdesign.

### `participants`

```sql
create table participants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  consented_at timestamptz,
  age_range text,
  occupation text,
  web_app_familiarity smallint,
  ai_tool_familiarity smallint
);
```

### `trials`

One row per task attempt.

```sql
create table trials (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  scenario_id text not null,
  condition text not null check (condition in ('baseline', 'ephemeral')),
  trial_index integer not null,
  started_at timestamptz,
  ended_at timestamptz,
  duration_ms integer,
  completed boolean not null default false,
  correct boolean,
  answer_submitted text,
  interaction_count integer not null default 0
);
```

### `trial_events`

One row per meaningful event.

```sql
create table trial_events (
  id bigserial primary key,
  trial_id uuid not null references trials(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb
);

create index trial_events_trial_id_idx on trial_events(trial_id);
create index trial_events_event_type_idx on trial_events(event_type);
create index trial_events_payload_gin_idx on trial_events using gin(payload);
```

### `questionnaire_responses`

```sql
create table questionnaire_responses (
  id bigserial primary key,
  participant_id uuid not null references participants(id) on delete cascade,
  trial_id uuid references trials(id) on delete cascade,
  created_at timestamptz not null default now(),
  question_key text not null,
  response_value text not null
);
```

### Optional `support_outputs`

Use this if you want to cache or inspect GenAI outputs.

```sql
create table support_outputs (
  id bigserial primary key,
  trial_id uuid not null references trials(id) on delete cascade,
  created_at timestamptz not null default now(),
  prompt_version text not null,
  input_state jsonb not null,
  model_name text not null,
  output jsonb not null
);
```

## Event model

Do not log every mouse move or every raw DOM event.
Only log meaningful study events.

Recommended event types:

- `trial_started`
- `trial_viewed`
- `answer_selected`
- `answer_changed`
- `trial_submitted`
- `support_requested`
- `support_triggered`
- `support_shown`
- `support_dismissed`
- `support_used`
- `post_trial_questions_submitted`
- `final_questions_submitted`

Example event payloads:

```json
{
  "eventType": "support_shown",
  "payload": {
    "targetId": "payments-backlog-card",
    "effectType": "arrow-highlight"
  }
}
```

```json
{
  "eventType": "answer_selected",
  "payload": {
    "selectedAnswer": "payments-team"
  }
}
```

## API routes

### `POST /api/participants`

Purpose:

- create the participant
- record consent time

Request:

```json
{
  "consented": true
}
```

Response:

```json
{
  "participantId": "uuid"
}
```

### `POST /api/trials`

Purpose:

- create the next trial
- assign scenario and condition

Request:

```json
{
  "participantId": "uuid",
  "scenarioId": "dashboard-priority",
  "condition": "ephemeral",
  "trialIndex": 1
}
```

### `POST /api/events`

Purpose:

- append a study event
- increment interaction count when appropriate

Request:

```json
{
  "participantId": "uuid",
  "trialId": "uuid",
  "eventType": "support_dismissed",
  "payload": {
    "targetId": "payments-backlog-card"
  }
}
```

### `POST /api/questionnaire`

Purpose:

- write post-trial and final questionnaire responses

Request:

```json
{
  "participantId": "uuid",
  "trialId": "uuid",
  "responses": [
    { "questionKey": "helpfulness", "responseValue": "6" },
    { "questionKey": "intrusiveness", "responseValue": "2" },
    { "questionKey": "control", "responseValue": "6" }
  ]
}
```

### `POST /api/support`

Purpose:

- call the GenAI system
- validate returned support payload
- return safe structured support

Request:

```json
{
  "participantId": "uuid",
  "trialId": "uuid",
  "scenarioId": "dashboard-priority",
  "taskState": {
    "metrics": [
      { "id": "ticket-backlog", "label": "Ticket backlog", "value": 48 },
      { "id": "missed-sla", "label": "Missed SLA", "value": 17 }
    ],
    "alerts": [
      { "id": "payments-risk", "label": "Payments delivery risk increased" }
    ]
  }
}
```

### `GET /api/export`

Purpose:

- export joined study data to CSV for analysis

Keep this route protected if the app is public.

## GenAI integration

### Server-only

The model call should happen on the server, not in the browser.

Reasons:

- protects API keys
- allows schema validation
- allows logging and caching
- allows prompt versioning

### Prompt strategy

Keep prompts constrained and task-specific.

Good prompt ingredients:

- scenario description
- current interface state
- allowed target IDs
- allowed effect types
- requirement that support must be local, temporary, and dismissible
- requirement that the model must not suggest actions outside the scenario

Example system prompt:

```text
You are generating bounded ephemeral interface support for a research prototype.
Choose one local target and one allowed effect type.
Do not redesign the page.
Do not output HTML.
Do not output code.
Return only JSON matching the provided schema.
```

Example allowed effect types:

- `arrow`
- `highlight`
- `inline_bubble`
- `arrow-highlight`

### Validation

Validate the support payload before returning it to the frontend.

Required checks:

- `targetId` must be one of the allowed target IDs
- `effectType` must be allowed
- `message` must be short
- `dismissible` must be boolean

If validation fails:

- return `null`
- or fall back to a canned safe response

## Frontend rendering model

The UI should have a dedicated ephemeral layer.

### `EphemeralLayer`

Responsibilities:

- receive validated support payload
- locate the target element
- render the correct visual cue
- cleanly remove the support when dismissed or expired

### DOM targeting

Use stable IDs or data attributes on important UI elements.

Example:

```tsx
<MetricCard data-ephemeral-id="payments-backlog-card" />
```

The support payload should target these IDs.

### Suggested lifecycle

1. User opens task
2. Task starts
3. Support trigger condition is met
4. Frontend requests support from `/api/support`
5. Validated support payload returns
6. `EphemeralLayer` renders the cue
7. User dismisses it or submits the task
8. Support disappears
9. Event is logged

## Minimal TypeScript shapes

```ts
export type Condition = "baseline" | "ephemeral";

export type ScenarioId = "dashboard-priority";

export type SupportEffectType =
  | "arrow"
  | "highlight"
  | "inline_bubble"
  | "arrow-highlight";

export type SupportPayload = {
  targetId: string;
  effectType: SupportEffectType;
  message: string;
  dismissible: boolean;
};
```

## Tracking implementation

Create a small client helper:

```ts
export async function trackEvent(input: {
  participantId: string;
  trialId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
```

Call it for meaningful actions only.

Examples:

- trial starts
- answer is selected
- support appears
- support is dismissed
- task is submitted

## Trial progression logic

For the first version, keep progression simple.

Suggested order:

1. create participant
2. create trial
3. render task
4. submit answer
5. show post-trial questions
6. store responses
7. show thank-you page

For the full study later:

- randomize order server-side
- store trial order in the database
- never rely purely on client state for sequencing

## Analytics without PostHog

You do not need PostHog if the goal is a controlled thesis study.

Your database is the analytics layer.

Key derived metrics:

- completion rate
- completion time
- interaction count
- support shown rate
- support dismissal rate
- support usage rate
- helpfulness scores
- intrusiveness scores
- perceived control scores
- final preference

These can be computed directly from the stored rows.

## CSV export strategy

At minimum, export:

- participants
- trials
- trial_events
- questionnaire_responses

You can also create a joined export view:

```sql
create view analysis_trials as
select
  t.id as trial_id,
  t.participant_id,
  t.scenario_id,
  t.condition,
  t.started_at,
  t.ended_at,
  t.duration_ms,
  t.completed,
  t.correct,
  t.answer_submitted,
  t.interaction_count
from trials t;
```

Later you can add questionnaire joins or export them separately.

## Realistic first implementation order

### Phase 1

- create the dashboard task UI
- create baseline trial flow
- create answer submission
- create participant and trial records

### Phase 2

- create event logging
- create post-trial questionnaire
- create completion screen

### Phase 3

- create `EphemeralLayer`
- hardcode one support payload
- test local arrow/highlight rendering

### Phase 4

- add server-side GenAI route
- add support payload validation
- store support outputs

### Phase 5

- add export route
- run internal pilot tests
- refine prompts and effect timing

## Practical recommendations

- Use server actions or route handlers, whichever you are faster with
- Use stable data attributes for all targetable UI elements
- Keep the first scenario deterministic
- Keep support messages short
- Prefer one support cue at a time
- Log only events that help your analysis
- Use DB exports for analysis instead of a third-party analytics dashboard

## Final recommendation

For this thesis artifact, the cleanest implementation is:

- Next.js app
- PostgreSQL database
- first-party event logging
- one server-side GenAI endpoint returning constrained support payloads
- one bounded frontend ephemeral rendering layer

This is simpler, more defensible, and easier to analyse than adding product analytics tooling.
