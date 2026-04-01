# Plan: Generative ephemeral UI (json-render and beyond)

This document is a **creative, expandable** plan for evolving the research artifact’s ephemeral condition from simple arrows/highlights into **guardrailed generative UI**: structured JSON describes local assistance, and the client renders it with predictable components.

It is **not** locked to any single idea (dimming, tooltips-on-hesitation, etc.). Those are **options** in a larger menu you can mix, measure, and turn off per pilot.

---

## Principles (carry forward from the thesis)

- **Structured output only** — model returns JSON that matches a **catalog** you own; no arbitrary HTML/CSS from the model.
- **Local impact** — assistance modifies a bounded region (overlay, patches, or chrome), not whole-app navigation.
- **Dismissible and logged** — every variant must be dismissible where it matters; events capture *what* appeared and *when*.
- **Baseline stays comparable** — know what extra you’re adding vs baseline so the methodology story stays honest.

---

## Core stack direction

1. **json-render** (or a **thin homegrown tree** with the same idea): catalog of component `type`s + Zod props + React registry.
2. **Server**: generate or map model output → validated **EphemeralSpec** (root + elements, or your own shape).
3. **Client**: `Renderer` inside the existing portal (`EphemeralLayer` pattern), plus optional **context** for copy/phase without touching baseline.

### Current codebase anchor (today → tomorrow)

| Today | Role | Next step |
|-------|------|-----------|
| `SupportPayload` in `artifact/lib/support-schema.ts` | Single `targetId`, flat `effectType`, `message`, `dismissible` | Treat as **EphemeralSpec v0** or a discriminator branch inside v1 |
| `EphemeralLayer` + `ArrowCue` / `HighlightRing` / `InlineBubble` | Portal + rect from `[data-ephemeral-id="…"]` | Keep portal; replace “three effects” with **registry-driven** nodes that reuse positioning helpers |
| `POST /api/support` | One call per load; stores `output` on `support_outputs` | Optional second body field `trigger?: "initial" \| "hesitation"` + server-side cap; still one row or append child events—pick before pilot |
| `ephemeralTargets` per scenario | Allowlist for model `targetId` | Extend allowlist checks to **every** `targetId` referenced in a tree (walk spec before accept) |

**Migration options** (pick one for Phase A):

- **Envelope**: `EphemeralSpec = { version: 1, root: Node }` and a server adapter that maps validated v1 → current renderer until the tree renderer ships.
- **Dual parse**: `z.discriminatedUnion("kind", [legacySupportSchema, treeSpecSchema])` so old logs remain readable; new trials only emit `kind: "tree"` once stable.

---

### Minimal `EphemeralSpec` shape (illustrative)

Use this only as a strawman; names should match your Zod schema and registry.

```json
{
  "version": 1,
  "root": {
    "type": "Stack",
    "props": { "gap": "sm" },
    "children": [
      {
        "type": "FocusMask",
        "props": { "targetId": "alerts-strip", "strength": 0.6 }
      },
      {
        "type": "AnchoredTooltip",
        "props": {
          "targetId": "payments-backlog-card",
          "body": "Compare SLA impact before reordering.",
          "placement": "top"
        }
      }
    ]
  },
  "meta": {
    "dismissible": true,
    "autoHideMs": null
  }
}
```

Rules to mirror in validation:

- Every `targetId` ∈ scenario `ephemeralTargets` (or a documented superset per scenario file).
- **`body` / `message`**: max length, no HTML; optional markdown subset if you allow it later.
- **Depth / children count caps** so the model cannot blow up render cost.

---

### json-render vs homegrown tree

| Criterion | Prefer **json-render** (or similar) | Prefer **homegrown** |
|-----------|--------------------------------------|-------------------------|
| You want maintained streaming / docs | ✓ | |
| Bundle size and dependency policy are strict | | ✓ |
| You need thesis-tight control of every parsing error message | | ✓ |
| You may swap UI libraries later | ✓ (if abstraction fits) | |

**Recommendation for this thesis:** start **homegrown** in Phase A (Zod + small registry mirroring the menu), reassess after Phase B if duplication hurts. The *ideas* in this doc do not depend on the npm package name.

---

## Menu of creative interventions (pick and combine)

Each item is implementable as **one or more catalog components** (or as **`copyPatches` / context**). Complexity varies by scenario; prefer shipping one polished motif over many half-finished ones.

### Attention and salience

| Idea | What it does | Catalog / notes |
|------|----------------|-----------------|
| **Focus chrome** | Dim outside a target, spotlight or strong ring | `FocusMask`, `SpotlightRect` |
| **Pulse / breathe** | Subtle animated border on target | `PulseRing` (CSS-only, duration capped) |
| **Attention path** | Numbered callouts 1→2→3 along allowed targets | `StepRail` + ordered `targetId[]` from allowlist |
| **Metric lens** | Desaturate non-critical cards; one stays full color | `SalienceLayer` with `emphasizeTargetIds[]` validated |

### Guidance and explanation

| Idea | What it does | Catalog / notes |
|------|----------------|-----------------|
| **Tooltip / popover** | Anchored explainer | `AnchoredTooltip` |
| **Inline glossary** | Short definition for a term (term from allowlist) | `GlossaryChip` linking `termId` → canned or model text |
| **Compare strip** | “If you weigh X vs Y…” two-column micro-card | `CompareHint` with `optionAId`, `optionBId` |
| **Progressive hints** | Stage 1 vague → stage 2 concrete after time or second dismiss | `HintPhase` enum in spec + client timer **or** second support request |
| **Hint stack** | 2–3 short bullets anchored near one target (ordered, non-interactive) | `HintStack`: `targetId`, `lines: string[]` (each line length-capped) |

### Timing and behaviour triggers

| Idea | What it does | Catalog / notes |
|------|----------------|-----------------|
| **Hesitation path** | Extra assistance if idle / no selection / long dwell | Client hook → `POST /api/support` with `trigger` + rate limit |
| **Ephemeral decay** | Non-critical chrome fades after N s unless pinned | props `autoHideMs`, `pinned` |
| **Interaction-aware** | Different spec snippet after first hover on backlog | second minimal request or pre-authored branch in one spec |

### Copy and personalization (bounded)

| Idea | What it does | Catalog / notes |
|------|----------------|-----------------|
| **Adaptive labels** | Alternate card/slide line without changing IDs | `copyPatches` map: `ephemeralTargetId → string` + scenario reads context |
| **Tone packs** | `toneId`: concise / pedagogical / analogy-friendly | model picks enum; templates constrain length |
| **Locale** | Preferred language from demographics | participant field + prompt rule (not inferred from age) |

### Scenario-specific “flavour” (still bounded)

| Idea | What it does | Catalog / notes |
|------|----------------|-----------------|
| **Dashboard: micro trend** | Tiny fake sparkline or delta annotation *only* in overlay | `MetricAnnotation` tied to `targetId` |
| **Slides: speaker rail** | Narrow “notes” strip with reorder / emphasis tips | `SideRail` children only `HintBody` |
| **Sprint: blast radius** | Visual link from ticket → sprint goal strip | `ConnectorLine` SVG between two resolved rects |

### Light generative chrome (optional, risky for comparability)

| Idea | What it does | Guardrail |
|------|----------------|-----------|
| **Ephemeral widget** | Small extra card (“risk summary”) not in baseline | Clearly marked as assist; same position every trial; optional |

Use sparingly: it changes *what is on screen*, not just how it is highlighted.

---

## Architecture sketch

```text
Model / fallback
    → EphemeralSpec (validated)
        → json-render Renderer (portal)
        → optional CopyPatchProvider for scenario text
    ← dismiss, timers, hesitation re-fetch (capped)
```

- **One initial spec** per trial (current pattern) plus **optional** follow-up requests (hesitation, stage-2 hint) with **hard caps** (e.g. max 2 extra per trial).
- **Logging**: `support_shown`, `support_phase`, `support_trigger`, `spec_root_type`, `component_types_used`, dismissal, optional `hint_stage_advanced`.

---

## Phased implementation (practical)

### Phase A — Foundation

- Add minimal catalog + registry; render **one** hardcoded spec in dev to validate portal + positioning.
- Define **EphemeralSpec** TypeScript type and Zod schema; store full spec in `support_outputs.output`.

### Phase B — Model path

- Extend prompts: catalog description or intermediate JSON + server mapper.
- Fallback spec when validation fails.

### Phase C — “V1 richness” (choose 2–3 from the menu)

Example bundles:

- **Bundle 1**: `FocusMask` + `AnchoredTooltip` + `HintStack`.
- **Bundle 2**: `PulseRing` + `copyPatches` for one scenario.
- **Bundle 3**: `StepRail` + progressive stage-2 via hesitation trigger.

### Phase D — Triggers and polish

- Hesitation / dwell hook; rate-limited second `POST /api/support`.
- Optional auto-hide / decay props.
- Export + event schema updates for analysis.

### Phase E — Pilot and prune

- Remove or flag components that confuse participants or hurt completion.
- Lock **prompt + catalog version** for the “real” run.

---

## Open decisions (lock before main data collection)

1. **Spec versioning**: Store `version` + full tree in `support_outputs.output`, or normalize to a canonical JSON column—either way, analysis scripts must read `version`.
2. **Second support request**: Allowed triggers (`hesitation` only? manual “more help”?) and **hard ceiling** (e.g. max 1 follow-up per trial).
3. **Fallback policy**: When validation fails—always `buildFallbackSupport`-style single bubble, or scenario-specific canned trees?
4. **Compare to baseline**: Freeze which **non-ephemeral** pixels must match (no extra cards in baseline; if `Ephemeral widget` is on, document it as a measured deviation).
5. **Prompt exposure**: Whether the model sees full `taskState` or a redacted summary (privacy + token cost).

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Model emits plausible but wrong `targetId` | Allowlist + reject + fallback; never trust without Zod + `ephemeralTargets` walk |
| Rich overlays increase cognitive load vs baseline | Pre-pilot think-aloud; telemetry on time-to-dismiss and task completion |
| Tree specs inflate log size | Cap children/depth; store only accepted spec, not raw model output unless needed for debugging |
| Follow-up support confounds “one intervention” story | Pre-register that ephemeral condition may include ≤N assists; report N in methodology |
| Motion (pulse, path) distracts or harms vestibular issues | Respect `prefers-reduced-motion`; downgrade to static ring + tooltip |

---

## Evaluation hooks (for the thesis write-up)

Correlate **task outcomes** and **subjective burden** with:

- **`component_types_used`** (from flattened tree) — which motifs appeared, not only one-hot “condition”.
- **`support_trigger`** — initial vs hesitation (if implemented).
- **Time to first dismiss** and **whether** participants dismissed before submitting (if ethically logged).
- **Catalog version** — tie results to a frozen prompt + schema Git SHA or semver.

---

## Testing notes (lightweight)

- **Golden specs**: 2–3 JSON fixtures per scenario; renderer snapshot or smoke test that every allowed `type` mounts without throw.
- **Resize/scroll**: Reuse existing interval + listeners pattern; any new anchored node must subscribe or share a `useTargetRect(targetId)` hook.
- **Accessibility**: Keep `aria-live` policy coherent when multiple nodes emit text; avoid duplicate polite announcements on the same tick.

---

## What to avoid (unless scope explicitly widens)

- Raw model HTML/CSS or un-sanitized strings driving layout.
- Unbounded actions (navigation, form submit, fake clicks on task options).
- Unlimited support calls per trial.
- Personalization from dubious proxies (e.g. age → language).

---

## Creativity knobs you can turn later

- **A/B at catalog level**: same task, different allowed component sets (measure which help more).
- **Streamed spec**: assemble overlay progressively as JSON streams (fits json-render streaming story).
- **Participant preference**: “More subtle / more explicit” from a one-tap control stored for the session (still bounded).

---

## Deliverables checklist (when you implement)

- [ ] `lib/ephemeral/catalog.ts` + component registry
- [ ] `EphemeralSpec` validation + fallback (+ **version** field persisted in `support_outputs`)
- [ ] `allowlistWalk(spec)` — reject specs that reference unknown `targetId`s
- [ ] `POST /api/support` returns spec (+ optional legacy compat / discriminated union)
- [ ] Study page + `EphemeralLayer` host `Renderer`
- [ ] Event types + export fields for spec/triggers (`component_types_used`, `support_trigger`, catalog version)
- [ ] Short methodology note: what ephemeral *was* for this study (which menu items were on; max assists per trial)

---

## Summary

Treat ephemeral UI as a **small programming language for assistance**: rich enough for focus, motion, time, copy, and scenario-local chrome—**always** compiled through your catalog. The dim overlay and hesitation tooltip are **two** motifs in a wider palette; this plan leaves room to add, test, and **remove** motifs without rewriting the whole study.
