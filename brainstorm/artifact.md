# The artifact

## Core shape

- The artifact should be a web-based research prototype, not a library as the main deliverable
- The main interface should remain stable
- GenAI should power the ephemeral support only
- The GenAI output should temporarily change a local part of the interface, not regenerate the full page
- Good examples: arrow, highlight ring, inline explanation, temporary comparison box, short action tray
- Start with one scenario first, then expand to all three scenarios later

## Timing

- The study should aim to take around 8 minutes to complete

## MVP first version

- 1 scenario only
- 2 conditions: baseline and ephemeral
- 1 GenAI-powered ephemeral intervention type
- 1 clear success criterion
- Basic event logging
- Short post-task questions

## Suggested first scenario

- Dashboard interpretation task
- Prompt: identify which issue needs the most immediate attention
- Baseline condition: normal dashboard only
- Ephemeral condition: same dashboard, but temporary GenAI support appears locally
- Example ephemeral support:
  - arrow to a relevant metric
  - temporary highlight around 1-2 cards
  - short explanation bubble with reasoning

## How GenAI should be used

- GenAI should decide what local support to show based on task context
- The frontend should control how the support is rendered
- The model should return structured data, not raw HTML/CSS/JS

Example response shape:

```json
{
  "targetId": "payments-backlog-card",
  "effectType": "arrow-highlight",
  "message": "This area likely needs attention because backlog and SLA misses are both rising.",
  "dismissible": true
}
```

Rules:

- Allowed targets should come from a fixed list
- Allowed effects should come from a fixed list
- The support must be dismissible
- The support must not perform consequential actions automatically
- The support must disappear after the task is done or when dismissed

## Study flow

### 1. Welcome / consent

- Short explanation of the study
- Consent checkbox
- Start button

### 2. Background form

Collect only what is useful for analysis:

- Participant ID (auto-generated)
- Age range
- Occupation or student / professional status
- Self-rated familiarity with web apps
- Self-rated familiarity with AI-assisted tools
- Optional: gender only if you have a clear reason to analyse it

Avoid unless genuinely needed:

- Full name
- Email

If email is needed for follow-up or incentives:

- collect it separately from the study responses
- do not store it with performance data if you can avoid it

### 3. Instruction screen

- One sentence on the task goal
- One sentence explaining that temporary assistance may appear
- Clarify that participants can ignore or dismiss it
- Do not tell participants which trials are baseline or ephemeral
- Next button

Suggested wording:

- "In this study, you will complete a series of short interface tasks."
- "During some tasks, the interface may provide additional temporary assistance."
- "Please complete each task as naturally as possible. You may ignore or dismiss any assistance if you do not find it useful."

### 4. Trial screen

- Show the task prompt
- Show the interface
- Run either baseline or ephemeral condition
- Record interactions
- Let the participant submit their answer

### 5. Post-task questions

- Ask these after every trial
- Keep them short so repetition does not become annoying
- Use a 1-7 Likert scale for all three questions

Exact questions after each trial:

- "How helpful was the interface for completing this task?"
- "How intrusive did the interface feel during this task?"
- "How much control did you feel you had while completing this task?"

Suggested scale labels:

- 1 = Not at all
- 7 = Extremely

Control question alternative scale:

- 1 = No control at all
- 7 = Complete control

### 6. Completion screen

- Thank the participant
- Ask final comparative questions after all trials are complete

Exact end-of-study questions:

- "Overall, which version of the interface did you prefer?"
- "Overall, which version of the interface felt more helpful?"
- "Overall, which version of the interface felt more intrusive?"
- "If you were using this in real life, which version would you rather use?"
- Optional free text: "Do you have any final comments about what felt useful, confusing, or disruptive?"

Suggested answer options for the first four final questions:

- Version A
- Version B
- No preference / About the same

Important:

- Do not label trials as baseline or ephemeral to participants
- If needed, randomly assign whether baseline is called Version A or Version B in the final comparison screen
- Keep the true condition labels only in the stored study data

## Data to capture

For each participant:

- participantId
- background form responses
- trial order

For each trial:

- scenarioId
- condition
- taskStartTime
- taskEndTime
- taskCompletedCorrectly
- answerSubmitted
- interactionCount

For ephemeral trials only:

- supportTriggered
- supportTargetId
- supportEffectType
- supportShownAt
- supportDismissed
- supportInteractedWith

For questionnaire responses:

- helpfulness rating
- intrusiveness rating
- perceived control rating
- final preference
- final helpfulness comparison
- final intrusiveness comparison
- final real-life preference
- optional free text

## Recommended tool stack

### Fastest MVP

- Frontend: React or Next.js
- Styling: simple component library or basic CSS
- GenAI call: one backend/API route
- Storage: Supabase or Firebase

### Simplest logging option

- Use one database for both trial data and questionnaire responses
- Avoid splitting data between too many tools at the start
- PostHog is useful for analytics, but may be unnecessary for the first version

## TONOTE

- The first build should prove the concept with one scenario before scaling
- The GenAI output must be schema-constrained and bounded
- The ephemeral UI should modify only a local region of the page
- The baseline and ephemeral versions must remain comparable
- Participants should not be told which trials are baseline or ephemeral
- The final study likely needs randomisation / counterbalancing
- Need a clean way to export all trial data to CSV for analysis
- Need to define exactly which ephemeral effects are allowed
- Need to define when support is triggered and when it disappears
- Need to decide whether the model response is live, cached, or semi-scripted for consistency
- Need to make sure any personal data collection is minimal and justified
- Need to decide whether the final screen compares Version A vs Version B or uses another neutral label system

## Ongoing questions

- Do I need a real database?
  - For MVP: not strictly
  - For the real study: probably yes, or at least a reliable backend data store

- Should I use PostHog or something simpler?
  - Simpler is probably better at first
  - Supabase or Firebase may be enough without adding analytics tooling

- Should GenAI responses be live?
  - Live is more interesting
  - Cached or tightly constrained responses may be better for consistency and evaluation validity

- How much can the interface change before it stops being "bounded"?
  - Need a fixed list of allowed ephemeral transformations

- Should I collect email?
  - Only if needed for follow-up or incentives
  - If yes, store separately from trial data

- How will I analyse the results?
  - Export from DB to CSV is probably the easiest path
  - Keep the schema simple from the beginning so analysis is easier later

- Should the questions be after every trial or only at the end?
  - Per-trial questions are better for helpfulness, intrusiveness, and control
  - End-of-study questions are better for overall comparison and preference