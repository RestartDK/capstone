import { EPHEMERAL_COMPONENT_TYPES } from "./ephemeral/catalog"
import type { ParticipantTaskSnapshot } from "./participant-task-snapshot"
import { getScenarioEntry } from "./scenarios/registry"

import type { TaskState } from "./task-state"

function taxonomyGuidanceLines(taxonomy: string): string[] {
  switch (taxonomy) {
    case "interpretive":
      return [
        "Scenario role: interpretive support.",
        "Prioritise combining signals: relate the alert strip to backlog, response-target, or sentiment cards using ConnectorLine or ComparisonStrip, and use InspectPanel to explain why two clues should be read together.",
        "Use ConsequenceNote sparingly for a one-line ‘if this is ignored…’ reading of a key signal.",
      ]
    case "refinement":
      return [
        "Scenario role: refinement support before commitment.",
        "Use StepRail for a coherent deck order (title → problem → metrics → ask) when multiple slides are involved; use InspectPanel near deck-context-bar to clarify narrative intent.",
        "ConnectorLine can pair slides when comparing flow, not only spotlight one card.",
      ]
    case "task_execution":
      return [
        "Scenario role: bounded task execution on the board.",
        "Use StepRail to link sprint goal strip, the backlog ticket that fits the goal, and the In progress column when teaching sequence; ConsequenceNote works well on the focal ticket.",
        "InspectPanel can gloss dependencies or why the goal narrows choice—avoid generic highlighting with no workflow meaning.",
      ]
    default:
      return []
  }
}

export function buildSupportSystemPrompt(scenarioId: string): string {
  const entry = getScenarioEntry(scenarioId)
  const targets = entry?.ephemeralTargets.join(", ") ?? ""
  const componentTypes = EPHEMERAL_COMPONENT_TYPES.join(", ")
  const roleLines = entry ? taxonomyGuidanceLines(entry.taxonomy) : []
  return [
    "You generate bounded ephemeral interface support for a research prototype.",
    "Return a JSON object matching the EphemeralSpec schema described below.",
    "",
    'EphemeralSpec = { version: "1" (string literal in JSON), root: Node, meta: { dismissible: boolean } }',
    "Node = { type: ComponentType, props: object, children?: Node[] }",
    "For model stability, always return a root Stack. Its children may be leaf components, ViewportPanel, or TargetOffsetPanel.",
    "Do not nest Stack inside ViewportPanel or TargetOffsetPanel; if a panel needs multiple items, place them directly as that panel's children.",
    "",
    `Allowed component types: ${componentTypes}.`,
    "",
    "Component prop schemas:",
    "- Stack: { gap?: 'none' | 'sm' | 'md' }  (container; children rendered in sequence)",
    "- FocusMask: { targetId: string, strength?: number (0-1) }  (dims everything except targetId)",
    "- HighlightRing: { targetId: string }  (amber ring around target)",
    "- PulseRing: { targetId: string, durationMs?: number (500-5000) }  (animated ring)",
    "- ArrowCue: { targetId: string }  (arrow pointing at target)",
    "- AnchoredTooltip: { targetId: string, body: string (max 400 chars), placement?: 'top'|'bottom'|'left'|'right' }",
    "- HintStack: { targetId: string, lines: string[] (1-4 items, each max 200 chars), placement?: 'top'|'bottom'|'left'|'right' }",
    "- StepRail: { targetIds: string[] (2-6 items) }  (numbered callouts in order)",
    "- ConnectorLine: { fromTargetId: string, toTargetId: string }  (dashed line between two targets)",
    "- ComparisonStrip: { leftTargetId: string, rightTargetId: string, headline?: string (max 100 chars), body: string (max 400) }  (short contrast between two targets; place copy under both)",
    "- InspectPanel: { targetId: string, title: string (max 120), summary: string (max 280), details?: string[] (0-4 items, each max 200), placement?: 'top'|'bottom'|'left'|'right' }  (expandable reasoning; participant may open details)",
    "- ConsequenceNote: { targetId: string, line: string (max 220), placement?: 'top'|'bottom'|'left'|'right' }  (one italic consequence line anchored near a target)",
    "- ViewportPanel: { topPct: 0-100, leftPct: 0-100, widthPct: 15-96, maxHeightVh?: 12-88, zIndex?: 1-100, pointerEvents?: 'auto'|'none' }  (absolute panel in % of overlay; children stack vertically)",
    "- TargetOffsetPanel: { targetId, widthPx: 200-520, shiftXPx: -480..480, shiftYPx: -480..480, edge: 'top'|'bottom'|'left'|'right'|'center' }  (panel placed relative to target bbox + pixel shifts)",
    "- FlowHtml: { html: string (max 3000) }  — MUST appear only inside a ViewportPanel subtree (prefer ViewportPanel -> FlowHtml directly). Sanitized tags only: p, br, strong, em, b, i, ul, ol, li, span, h3, h4, code, pre. No scripts, styles, or event handlers.",
    "- AnchoredHtml: { targetId, html: string (max 1800), placement?: 'top'|'bottom'|'left'|'right' }  (like AnchoredTooltip but HTML; same tag whitelist after sanitization)",
    "",
    `Allowed target IDs: ${targets}.`,
    "Every targetId, fromTargetId, toTargetId, leftTargetId, and rightTargetId must be one of the allowed target IDs.",
    "",
    ...roleLines,
    "",
    "Rules:",
    "- The root should be a Stack containing 2-4 children.",
    "- Unless the task state clearly implies a single focal control only, include at least one relational component: ConnectorLine, ComparisonStrip, or StepRail spanning two or more distinct targets.",
    "- Prefer relating targets when it helps interpretation; do not emit only HighlightRing+ArrowCue on one element unless justified by the task state.",
    "- Choose components that help the user reason or act on the task, not only draw attention.",
    "- Only Stack may use an empty props object. Every other component must include its required fields.",
    "- Do not include children on leaf components.",
    "- Max tree depth: 4 (deepest nodes are leaves). Max children per node: 6.",
    "- AnchoredTooltip/ComparisonStrip/Inspect text: plain language, no raw HTML in those props.",
    "- FlowHtml/AnchoredHtml: small semantic HTML only; server strips disallowed tags.",
    "- Set meta.dismissible to true.",
    "- Do not output executable code, Markdown documents, or full page HTML—only the EphemeralSpec JSON; HTML is allowed only in FlowHtml/AnchoredHtml as described.",
    "- Return only the JSON object, nothing else.",
  ].join("\n")
}

export function buildSupportUserPrompt(
  taskState: TaskState,
  participantSnapshot: ParticipantTaskSnapshot | null
): string {
  const entry = getScenarioEntry(taskState.scenarioId, taskState.variant)
  const preamble =
    entry?.supportUserPromptPreamble ?? "Help the user with the task below."
  const envelope = {
    baselineTask: taskState,
    ...(participantSnapshot
      ? {
          participantProgress: participantSnapshot,
          participantProgressNote:
            "participantProgress reflects the participant's current UI state at support request time. Tailor explanations and anchoring to what they have already selected, drafted, or moved—do not reset to a generic first-visit tour unless progress is empty or unclear.",
        }
      : {}),
  }
  return `${preamble}\n\n${JSON.stringify(envelope)}`
}
