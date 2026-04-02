## Recommended metrics for ephemeral vs. normal

| Metric                         | What it measures                                 | Why it matters                                          |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------------------- |
| **Task completion rate**       | % of participants who correctly finish each task | Shows whether ephemeral UIs help or hinder task success |
| **Task completion time**       | Seconds from task start to task end              | Shows whether ephemeral UIs improve efficiency          |
| **Interaction count**          | Clicks, keystrokes, or steps per task            | Shows whether ephemeral UIs reduce effort               |
| **Intrusiveness (subjective)** | Rating on 1–7 or 1–5 scale                       | Captures “disrupt UX” in users’ own words               |
| **Preference**                 | Forced choice: ephemeral vs. normal              | Direct answer to “which version do users prefer?”       |
| **SUS score** (optional)       | Usability score 0–100 per condition              | Standard benchmark for usability                        |

---

## How to gather each metric

### 1. Task completion rate

**Definition:** Each task has a clear success criterion (e.g. “reached X page”, “submitted form correctly”).

**Collection:**

- Add **event tracking** in your React app: fire events on goal actions (e.g. form submit, reaching a specific URL).
- Store: `{ userId, taskId, condition, completed: true/false, timestamp }`.
- For more complex tasks (e.g. “find the right product”), you can log the final state (e.g. selected item ID) and infer correctness.

**Example:**

```javascript
// When user completes a task
logEvent({
  type: "task_complete",
  taskId: 2,
  condition: "ephemeral",
  success: true,
});
```

---

### 2. Task completion time

**Definition:** Time from task start to task completion (or abandonment).

**Collection:**

- On task start: `logEvent({ type: 'task_start', taskId, condition, timestamp })`
- On task end: `logEvent({ type: 'task_end', taskId, condition, timestamp })`
- Compute duration server-side or in your analysis script.

**Example:**

```javascript
// At task start (when you show the task instructions)
logEvent({
  type: "task_start",
  taskId: 2,
  condition: "ephemeral",
  startTime: Date.now(),
});
// At task end
logEvent({
  type: "task_end",
  taskId: 2,
  condition: "ephemeral",
  endTime: Date.now(),
});
```

---

### 3. Interaction count

**Definition:** Number of relevant actions per task (clicks, key presses, form inputs).

**Collection:**

- Wrap main actions in a logging function, or use a global click/input listener scoped to task-related elements.
- Store: `{ userId, taskId, condition, interactionCount }`.
- Increment a counter per task and send it when the task ends.

---

### 4. Intrusiveness (subjective)

**Definition:** User rating of how disruptive or intrusive the interface felt.

**Collection:**

- Short **post-task** or **post-condition** questionnaire.
- 1–3 items on a 5- or 7-point Likert scale, e.g.:
  - “The assistance felt intrusive” (1 = strongly disagree, 7 = strongly agree).
  - “The interface interrupted my flow” (1 = strongly disagree, 7 = strongly agree).
- Use **Google Forms** or **Qualtrics** (or similar) with links after each condition or at the end of the study.
- Include a field for `participantId` so you can match responses to your event logs.

---

### 5. Preference

**Definition:** Which version participants would use in real life.

**Collection:**

- Single **post-study** question in the same survey, e.g.:
  - “Which version would you prefer for everyday use?” [Ephemeral / Normal]
- Optional: short free-text “Why?”

---

### 6. SUS (optional)

**Definition:** Standard 10-item usability scale, one per condition.

**Collection:**

- Add the SUS items to your survey, run once after each condition (or once at the end, if you ask them to compare). Compute the SUS score using the standard formula.

---

## Recommended data pipeline

### Option A: Minimal (good for a capstone)

1. **Event logging in React** → JSON logs or a simple backend endpoint.
2. **Google Forms survey** → demographics, intrusiveness items, preference.
3. **Manual linking** → participant ID in the URL or a code they enter in the form.

### Option B: More automated

1. **Backend** (e.g. Supabase, Firebase, or a small Node/Express server) that receives events.
2. **Database table** for events: `user_id`, `session_id`, `condition`, `task_id`, `event_type`, `payload`, `timestamp`.
3. **Survey** still via Forms/Qualtrics, with a shared `participantId` you give them at the start.

### Option C: Analytics service

1. Use **Mixpanel**, **Amplitude**, or **PostHog** for events.
2. Export events + timestamps for analysis.
3. Survey separately, linked by participant ID.

---

## Suggested study flow

1. **Consent** → Brief intro, participant ID.
2. **Condition A** (e.g. ephemeral) → 3–5 tasks with clear success criteria.
3. **Short questionnaire** → Intrusiveness items for Condition A.
4. **Condition B** (normal) → Same tasks in different order or different task set.
5. **Short questionnaire** → Intrusiveness items for Condition B.
6. **Final survey** → Preference, SUS if used, optional demographics.
7. **Debrief** → Thank them and explain the study.

Use **counterbalancing**: half of participants get ephemeral first, half get normal first, and balance task order if you have multiple tasks.

### Lifecycle todo

- [ ] Document ephemeral dismissal as more than a close button: support may end through explicit dismissal, successful use of the supported micro-action, task completion, or replacement by a newer/contextually relevant support instance. Log the dismissal reason separately so manual rejection is not conflated with successful use.

---

## Minimal instrumentation checklist

- [ ] Task start/end events with timestamps
- [ ] Task completion (success) events
- [ ] Interaction counter per task
- [ ] Participant/session ID for linking
- [ ] Condition (ephemeral vs. normal) stored with each event
- [ ] Support dismissal reason stored with each dismissal event (`explicit`, `used`, `task_complete`, `superseded`)
- [ ] Survey with intrusiveness + preference (+ SUS if desired)
- [ ] Export path from events → CSV/Excel for analysis

If you describe your tech stack (React only, or React + backend), I can outline concrete code for the logging and minimal schema you need.
