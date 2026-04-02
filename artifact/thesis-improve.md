# Thesis Improvement Plan

## Purpose

This document turns the current critique of the artifact into an actionable plan for improving both the thesis argument and the experimental website.

The main goal is to make the final study better match the methodology:

- three clearly differentiated taxonomy roles
- stronger operationalisation of the ephemeral lifecycle
- more realistic bounded tasks
- better methodological defensibility
- no unnecessary participant data collection

## Current assessment

The app is already a solid prototype for bounded ephemeral UI, but it is not yet a strong final experiment for the thesis.

Current strengths:

- stable baseline versus ephemeral comparison is implemented
- within-subject study flow is implemented
- event logging and questionnaire structure are in place
- the ephemeral layer is bounded and does not replace the whole interface

Current weaknesses:

- the three scenarios are too similar in underlying interaction structure
- refinement and task-execution are not yet represented by real refinement or execution tasks
- ephemeral support is too often reduced to attention guidance
- trigger, interaction, and dismissal are not equally strong across scenarios
- the instruction step is likely redundant

## Core principle for revision

Do not expand the project by adding more surface area than needed.

The right direction is not to collect more personal data or make the UI more visually complex for its own sake. The right direction is to make the experiment better express the thesis framework.

That means improving:

- task realism
- support interactivity
- taxonomy-role distinction
- lifecycle implementation

Not prioritising:

- nationality
- hobbies
- broad personality profiling
- unnecessary onboarding steps

## High-level revision goals

### 1. Strengthen methodological alignment

The artifact should more clearly reflect the methodology section:

- interpretive support should help participants understand and prioritise information
- refinement support should help participants adjust or improve something before commitment
- task-execution support should help participants complete a bounded workflow step inside the interface

### 2. Make scenarios meaningfully different

Each scenario should involve a different participant action, not just a different visual theme.

### 3. Make ephemeral support truly interactive

The ephemeral condition should sometimes do more than point at something. It should allow users to inspect, compare, steer, confirm, or dismiss temporary support.

### 4. Preserve comparability

Even after making tasks richer, the baseline and ephemeral versions must still be comparable:

- same scenario goal
- same success criterion
- same persistent interface foundation
- only the temporary support layer changes

## Participant data plan

### Keep

- age range
- occupation / role
- familiarity with web apps
- familiarity with AI-assisted tools

### Add only if justified

- familiarity with dashboards
- familiarity with presentation editing tools
- familiarity with project/task management tools

## Scenario redesign plan

## Scenario 1: Interpretive support

### Keep the dashboard scenario

This scenario already fits the interpretive role well.

### Improve it by:

- making metric relationships clearer but not trivial
- adding one or two competing signals so interpretation requires judgment
- ensuring the correct answer depends on combining multiple signals, not reading one obvious label

### Good ephemeral behaviours

- temporary cross-metric comparison
- transient explanation of why two signals matter together
- connector between alert and metric card
- temporary consequence preview

### Avoid

- only adding a ring around the correct card with no reasoning value

## Scenario 2: Refinement support

### Redesign the slides scenario into a real refinement task

The participant should actually improve the draft before submission.

### Change the task from:

- "which slide should you strengthen first?"

### To something like:

- reorder slides into a stronger narrative
- choose between temporary alternative groupings
- edit slide content with a clearer stakeholder narrative goal
- promote one risk and remove one weak bullet before finalising

### Success criterion options

- revised order matches a predefined acceptable structure
- revised outline includes required content elements
- participant completes the required refinement goal correctly

### Good ephemeral behaviours

- temporary comparison view between current and suggested structure
- transient grouping tray showing alternative narrative flows
- temporary controls for moving or merging sections
- dismissible explanation of why a proposed structure better fits the stated goal

### Avoid

- a slide-themed multiple-choice task disguised as refinement

## Scenario 3: Task-execution support

### Redesign the PM scenario into a real bounded workflow task

The participant should actually perform a task-board action.

### Change the task from:

- "which ticket should move to in progress first?"

### To something like:

- move the correct ticket to `In progress`
- resolve a blocked item based on dependency/context information
- complete a bounded sprint-planning step using the board itself

### Success criterion options

- correct item moved to correct state
- correct dependency resolved
- correct bounded workflow action completed without invalid moves

### Good ephemeral behaviours

- temporary action tray attached to the relevant card
- transient dependency panel
- step rail showing the minimum workflow sequence
- temporary local restructuring of the relevant board region

### Avoid

- reducing task-execution to choosing the right card without performing the workflow step

## Ephemeral interaction plan

The current system should evolve from mostly passive highlighting toward temporary interactive support.

### Minimum interaction upgrades

- support can be ignored
- support can be dismissed
- support can be used
- support can be refined or explored in at least some scenarios

### Stronger lifecycle implementation

For each scenario, explicitly implement:

1. Trigger
2. Instantiation
3. Interaction
4. Dismissal

### Trigger improvements

Do not always show support instantly on page load.

Use one of these trigger styles:

- explicit request for help
- hesitation-based trigger after inactivity
- trigger after opening a detail region
- trigger after an initial unsuccessful action

### Interaction improvements

Support should sometimes let the participant:

- inspect reasoning
- compare alternatives
- adjust a local option
- use a temporary micro-workflow

### Dismissal improvements

Support should disappear:

- on explicit dismissal
- on task completion
- when no longer contextually relevant

## Study flow plan

### Remove the separate instruction page

- merge the generic temporary-assistance explanation into the consent flow or first trial intro
- keep scenario-specific preambles inside each task

## Logging and measures plan

The logging foundation is good, but richer tasks require richer events.

### Add scenario-relevant events

Examples:

- `support_ignored`
- `support_refined`
- `support_confirmed`
- `slide_reordered`
- `slide_grouping_applied`
- `ticket_moved`
- `workflow_step_completed`

### Preserve core measures

- completion rate
- completion time
- interaction count
- helpfulness
- intrusiveness
- perceived control
- final preference

### Important analytical aim

The data should help distinguish:

- bad support quality
- low support uptake
- task difficulty imbalance


## Implementation phases

## Phase 1: Lock the experimental design

Deliverables:

- final definition of the three scenario goals
- final success criteria for each scenario
- final decision on which participant background variables to keep/add/remove
- final decision on whether the instruction page is removed or merged

Exit criteria:

- each scenario has a distinct participant action
- each scenario maps clearly to one taxonomy role

## Phase 2: Redesign scenario mechanics

Deliverables:

- updated dashboard task content
- new slides refinement interaction model
- new PM workflow interaction model

Exit criteria:

- scenarios no longer feel like the same task with different skins

## Phase 3: Upgrade ephemeral support behaviours

Deliverables:

- at least one interactive ephemeral support pattern in refinement
- at least one interactive ephemeral support pattern in task-execution
- stronger interpretive support in dashboard beyond simple highlight

Exit criteria:

- ephemeral support demonstrates interaction, not only attention direction

## Phase 4: Update logging and questionnaires if needed

Deliverables:

- new event types for richer interactions
- any wording adjustments needed for the richer tasks

Exit criteria:

- logs can explain not just outcomes, but how support was used or ignored

## Phase 5: Remove unnecessary flow friction

Deliverables:

- simplified onboarding flow
- instruction content relocated if necessary

Exit criteria:

- participants receive the needed information once, without redundant steps

## Phase 6: Pilot and refine

Deliverables:

- informal pilot sessions
- notes on confusion, difficulty, support uptake, and timing
- final task balancing adjustments

Exit criteria:

- total study time remains reasonable
- tasks are understandable
- ephemeral interactions are noticeable but not overwhelming

## Practical build order

Recommended implementation order:

1. Redesign the slides scenario first.
2. Redesign the PM scenario second.
3. Improve the dashboard support third.
4. Simplify the onboarding flow.
5. Add richer event logging.
6. Pilot the study and rebalance task difficulty.
7. Update thesis methodology text to reflect the final implementation.

Why this order:

- the dashboard already has the best fit with the thesis
- the biggest methodological gap is in refinement and task-execution
- changing the scenarios first will clarify what logging and wording updates are actually needed

## Final target state

The finished experiment should let you credibly argue that:

- the artifact instantiates the conceptual framework
- the three taxonomy roles are represented by genuinely different task types
- the ephemeral condition is meaningfully more than decorative highlighting
- bounded adaptive support can be evaluated without sacrificing comparability or user control

If this plan is followed, the thesis becomes stronger both as a design artifact and as an empirical evaluation.
