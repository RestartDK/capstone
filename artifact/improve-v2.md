# Improvement Plan V2

## Purpose

This version focuses on the most important current weakness in the experiment: the slides scenario does not yet feel like an actual presentation-refinement task.

The goal is not to build a fake full PowerPoint product. The goal is to make the scenario visually and behaviorally recognisable as slide work so the refinement task is intuitive, realistic, and methodologically defensible.

## Core decision

Keep the slides scenario, but redesign it so participants are clearly working on a deck.

Do:

- make the scenario look like a simple slide editor
- preserve a bounded task with clear completion criteria
- keep the baseline and ephemeral versions structurally identical
- reduce hidden rules and confusing validation

Do not:

- replace the scenario with an abstract mini-game
- build a full-featured presentation application
- add visual complexity that creates new confounds

## Why this change matters

Right now the scenario has a framing mismatch:

- the study says this is a presentation or deck refinement task
- the interface behaves more like a text-outline editor

That mismatch weakens the experiment in three ways:

- participants may not understand the task immediately
- the refinement taxonomy role is less clearly expressed
- completion friction may reflect unclear UI rather than the ephemeral condition

Making the scenario visually slide-like improves ecological validity without requiring a large increase in scope.

## Design target

The participant should immediately understand:

- this is a deck for a stakeholder readout
- each card in the left rail is a slide
- the main panel is the current slide canvas
- the task is to improve the deck before submission

The interface should feel closer to:

- slide thumbnails on the left
- active slide canvas on the right
- light editing controls inside the selected slide

Not closer to:

- a generic sortable list
- a document outline tool
- a hidden-form validation exercise

## Recommended scenario framing

Scenario framing should stay specific and bounded.

Recommended framing:

- You are finalising a stakeholder deck for tomorrow's readout.
- The story order is weak.
- The Problem slide does not clearly communicate operational risk.
- Improve the deck before submission.

This remains a good fit for refinement support because the participant is shaping and improving content before commitment.

## Recommended task mechanics

The task should require two visible actions:

1. Reorder the slides into a stronger narrative.
2. Edit the Problem slide so it clearly states a concrete operational risk.

The task should not depend on the participant guessing a hidden keyword rule.

## Submission logic

Change submission rules from hidden correctness to visible attempt.

Recommended rule:

- allow submission after the participant has made a meaningful attempt
- evaluate correctness separately in logging or scoring

Minimum attempt definition:

- at least one slide reorder interaction has occurred, or the user has explicitly confirmed the order
- the Problem slide has been edited at least once

If the participant tries to submit too early, show explicit guidance such as:

`Please reorder the slides and update the Problem slide before submitting.`

Avoid:

- silently requiring the word `risk`
- trapping the participant until they accidentally satisfy the validator

## Progression logic

Participants should be able to continue after one of two outcomes:

- submitted attempt
- explicit skip or cannot complete

This is better than forcing perfect success, because non-completion is valid data and forced blocking adds frustration unrelated to the thesis question.

Do not auto-advance with no action after a timer.

## Visual redesign for the slides scenario

The slide task should move from an outline-style editor to a lightweight deck editor.

### Layout

- left rail: slide thumbnails in a vertical stack
- main panel: large selected slide canvas
- top context bar: deck title, readout context, and deadline cue
- bottom or top-right action area: submit state and task reminder

### Thumbnail design

Each thumbnail should look like a mini slide, not a list row.

Include:

- slide number
- small title area
- faint content blocks or miniature bullet lines
- a selected state that feels like choosing a slide, not choosing an answer

Drag handles can remain, but they should feel secondary to the idea that these are slides.

### Main slide canvas

The selected slide should render inside a clear slide frame.

Examples:

- Title slide: large heading and short subtitle block
- Problem slide: title plus editable bullet region
- Metrics slide: title plus chart or KPI placeholders
- Ask slide: title plus decision bullets or owner block

The goal is recognisability, not high-fidelity slide design.

### Problem slide editing

Keep editing simple.

Recommended interaction:

- editable bullet lines in the Problem slide
- optional helper label such as `State the operational risk clearly`
- at least one obvious editable field on the selected slide

This should feel like improving slide content, not filling in a generic form.

## Baseline vs ephemeral comparability

Do not change the core task between conditions.

Both versions should have:

- the same deck layout
- the same slide order problem
- the same editable Problem slide
- the same submission rule
- the same success criteria

Only the temporary support layer should differ.

## Better ephemeral behaviours for the slide task

The ephemeral condition should help with refinement, not just attention.

Good V2 behaviours:

- temporary suggested narrative order overlay
- transient comparison between current order and recommended order
- short contextual explanation of why the Problem slide is weak
- temporary suggestion chip or annotation attached to the Problem slide
- dismissible support that can be ignored, used, or closed

Avoid:

- only highlighting the correct slide
- support that effectively gives away the final answer with no interaction

## Recommended visible success criteria

The task should be understandable from the interface itself.

Show participants that they need to:

- reorder slides into a coherent story
- strengthen the Problem slide with a concrete operational risk

The UI can be slightly more explicit than it is now without harming the study.

For example:

- `Target story: Title -> Problem -> Metrics -> Ask`
- `Problem slide should name a concrete operational risk`

This is acceptable because the study is not testing whether participants can infer hidden expectations. It is testing how support affects their experience and task performance.

## Minimal implementation scope

This should remain a controlled redesign, not a new product.

Keep:

- current four-slide structure
- current reorder interaction model
- current editable bullet model
- current bounded task scope

Change:

- thumbnail visuals so they read as slides
- main editor visuals so it reads as a slide canvas
- task copy so it reads naturally
- validation/progression so it is attempt-based, not hidden-rule-based

## Implementation phases

### Phase 1: Lock task and rules

Deliverables:

- final task wording for the deck scenario
- final visible attempt requirements for submission
- final correctness logic for scoring
- final skip or cannot-complete policy

Exit criteria:

- no hidden validator dependency for participant progression
- task wording is understandable without explanation from the facilitator

### Phase 2: Redesign visuals to feel like slides

Deliverables:

- thumbnail redesign to resemble mini slides
- main selected-slide canvas redesign
- lightweight visual differentiation across the four slide types

Exit criteria:

- participants immediately identify the interface as a slide deck

### Phase 3: Update support behaviour for refinement

Deliverables:

- at least one temporary comparison or suggestion pattern
- support tied to narrative structure and Problem slide quality
- clear dismissal and ignore behaviour

Exit criteria:

- support helps the user refine, not merely notice

### Phase 4: Update instrumentation

Deliverables:

- log slide reorder attempts
- log Problem slide edits
- log support shown, used, ignored, dismissed
- log attempted submission before requirements are met

Exit criteria:

- analysis can distinguish confusion, difficulty, and support uptake

### Phase 5: Pilot and rebalance

Deliverables:

- quick pilot sessions
- notes on comprehension, friction, and timing
- final wording adjustments

Exit criteria:

- the scenario feels intuitive
- completion friction mainly reflects task difficulty, not UI confusion

## Recommended build order

1. Change the submission and progression rules first.
2. Redesign the slide visuals second.
3. Improve the ephemeral refinement support third.
4. Add or adjust logging fourth.
5. Pilot the full task and rebalance wording last.

This order reduces the risk of polishing visuals before the core study logic is fixed.

## Final target state

After this V2 change, the slide scenario should let you credibly claim:

- the participant is doing real refinement work, not just choosing from a disguised multiple-choice interface
- the scenario is recognisable as slide editing
- the support is temporary and bounded
- the baseline and ephemeral conditions remain comparable
- confusion caused by hidden validation has been reduced

If this is successful, the slides scenario becomes a much stronger representation of refinement support within the thesis.
