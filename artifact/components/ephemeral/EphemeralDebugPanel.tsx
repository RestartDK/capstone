"use client";

import * as React from "react";
import { Bug, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EphemeralDebugSettings } from "@/lib/ephemeral/debug-settings";
import {
  DEFAULT_EPHEMERAL_DEBUG_SETTINGS,
  normalizeHueDegrees,
} from "@/lib/ephemeral/debug-settings";
import {
  buildEphemeralDebugPreset,
  EPHEMERAL_DEBUG_PRESET_OPTIONS,
  type EphemeralDebugPresetId,
} from "@/lib/ephemeral/debug-presets";
import { allowlistWalk, parseEphemeralSpec } from "@/lib/ephemeral/spec";
import { getScenarioEntry } from "@/lib/scenarios/registry";
import { parseSpecForScenario } from "@/lib/support-schema";

import "./ephemeral-debug.css";

const FAB_SIZE = 44;
const VIEW_PAD = 8;
const EPHEMERAL_DEBUG_FAB_POS_KEY = "ephemeral-debug-fab-pos-v1";
const PANEL_W_CAP = 380;
const PANEL_H_CAP = 720;
const DRAG_CLICK_PX = 6;

function clampFabPosition(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const maxX = Math.max(VIEW_PAD, window.innerWidth - width - VIEW_PAD);
  const maxY = Math.max(VIEW_PAD, window.innerHeight - height - VIEW_PAD);
  return {
    x: Math.min(maxX, Math.max(VIEW_PAD, x)),
    y: Math.min(maxY, Math.max(VIEW_PAD, y)),
  };
}

function defaultFabPosition(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: VIEW_PAD, y: VIEW_PAD };
  return clampFabPosition(
    window.innerWidth - FAB_SIZE - 16,
    16,
    FAB_SIZE,
    FAB_SIZE,
  );
}

/** Same on server and client first paint; real position is applied in `useLayoutEffect`. */
const FAB_POS_INITIAL_SSR = { x: VIEW_PAD, y: VIEW_PAD } as const;

function loadStoredFabPosition(): { x: number; y: number } | null {
  try {
    const raw = sessionStorage.getItem(EPHEMERAL_DEBUG_FAB_POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { x?: unknown; y?: unknown };
    if (typeof p.x === "number" && typeof p.y === "number") {
      return { x: p.x, y: p.y };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveFabPosition(pos: { x: number; y: number }): void {
  try {
    sessionStorage.setItem(EPHEMERAL_DEBUG_FAB_POS_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

type SupportPhase = "start" | "success" | "http_error" | "network_error" | "skipped_already_loaded";

export type EphemeralDebugLog = {
  at: string;
  trialId: string;
  trigger: string;
  phase: SupportPhase;
  httpStatus?: number;
  detail?: string;
} | null;

export function EphemeralDebugPanel(props: {
  settings: EphemeralDebugSettings;
  onSettingsChange: (next: EphemeralDebugSettings) => void;
  supportLog: EphemeralDebugLog;
  scenarioId: string | null;
  condition: string;
  onApplyLocalSpec: (spec: import("@/lib/ephemeral/spec").EphemeralSpec) => void;
  onDismissSpec: () => void;
  onFireSupport: () => void;
  hasActiveSpec: boolean;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [localJson, setLocalJson] = React.useState("");
  const [localErr, setLocalErr] = React.useState<string | null>(null);
  const [showTheory, setShowTheory] = React.useState(false);
  const [presetChoice, setPresetChoice] = React.useState<"" | EphemeralDebugPresetId>("");

  const [fabPos, setFabPos] = React.useState<{ x: number; y: number }>(() => ({
    x: FAB_POS_INITIAL_SSR.x,
    y: FAB_POS_INITIAL_SSR.y,
  }));

  const [panelSize, setPanelSize] = React.useState<{ panelW: number; panelH: number }>(() => ({
    panelW: PANEL_W_CAP,
    panelH: PANEL_H_CAP,
  }));

  const { panelW, panelH } = panelSize;

  React.useLayoutEffect(() => {
    const panelW = Math.min(PANEL_W_CAP, window.innerWidth - 2 * VIEW_PAD);
    const panelH = Math.min(PANEL_H_CAP, window.innerHeight * 0.85);
    setPanelSize({ panelW, panelH });
    const stored = loadStoredFabPosition();
    const base = stored ?? defaultFabPosition();
    /* Panel is closed on first paint; avoids reading `open` in a one-time effect. */
    setFabPos(clampFabPosition(base.x, base.y, FAB_SIZE, FAB_SIZE));
  }, []);

  function refreshPanelMetrics(): { panelW: number; panelH: number; dragW: number; dragH: number } {
    const panelW = Math.min(PANEL_W_CAP, window.innerWidth - 2 * VIEW_PAD);
    const panelH = Math.min(PANEL_H_CAP, window.innerHeight * 0.85);
    const dragW = open ? panelW : FAB_SIZE;
    const dragH = open ? panelH : FAB_SIZE;
    return { panelW, panelH, dragW, dragH };
  }

  React.useEffect(() => {
    const { panelW, panelH, dragW, dragH } = refreshPanelMetrics();
    setPanelSize({ panelW, panelH });
    setFabPos((p) => clampFabPosition(p.x, p.y, dragW, dragH));
  }, [open]);

  React.useEffect(() => {
    function onResize(): void {
      const { panelW, panelH, dragW, dragH } = refreshPanelMetrics();
      setPanelSize({ panelW, panelH });
      setFabPos((p) => clampFabPosition(p.x, p.y, dragW, dragH));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  React.useEffect(() => {
    saveFabPosition(fabPos);
  }, [fabPos]);

  const dragRef = React.useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    startX: number;
    startY: number;
  } | null>(null);

  function beginDrag(e: React.PointerEvent): void {
    if (e.button !== 0) return;
    dragRef.current = {
      pointerId: e.pointerId,
      originX: fabPos.x,
      originY: fabPos.y,
      startX: e.clientX,
      startY: e.clientY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function moveDrag(e: React.PointerEvent, width: number, height: number): void {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setFabPos(clampFabPosition(d.originX + dx, d.originY + dy, width, height));
  }

  function endDrag(
    e: React.PointerEvent,
    width: number,
    height: number,
    onTap: (() => void) | null,
  ): void {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const moved = Math.hypot(dx, dy) >= DRAG_CLICK_PX;
    dragRef.current = null;
    setFabPos((p) => clampFabPosition(p.x, p.y, width, height));
    if (!moved && onTap) onTap();
  }

  function cancelDrag(e: React.PointerEvent): void {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragRef.current = null;
  }

  function patch(partial: Partial<EphemeralDebugSettings>): void {
    props.onSettingsChange({ ...props.settings, ...partial });
  }

  function tryApplyJson(): void {
    setLocalErr(null);
    if (!props.scenarioId) {
      setLocalErr("No scenario loaded.");
      return;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(localJson) as unknown;
    } catch {
      setLocalErr("Invalid JSON.");
      return;
    }
    const validated = parseSpecForScenario(props.scenarioId, raw);
    if (validated) {
      props.onApplyLocalSpec(validated.spec);
      return;
    }
    const loose = parseEphemeralSpec(raw);
    if (!loose) {
      setLocalErr("Not a valid EphemeralSpec envelope.");
      return;
    }
    const entry = getScenarioEntry(props.scenarioId);
    if (!entry) {
      setLocalErr("Unknown scenario.");
      return;
    }
    const walk = allowlistWalk(loose, entry.ephemeralTargets);
    if (!walk.valid) {
      setLocalErr(
        `Allowlist/props failed. Targets used: ${walk.targetIds.join(", ") || "(none)"}`,
      );
      return;
    }
    setLocalErr("Unknown validation failure.");
  }

  function applyPreset(preset: EphemeralDebugPresetId): void {
    setLocalErr(null);
    if (!props.scenarioId) {
      setLocalErr("No scenario loaded.");
      return;
    }
    const spec = buildEphemeralDebugPreset(props.scenarioId, preset);
    if (!spec) {
      setLocalErr("Could not build preset for this scenario.");
      return;
    }
    setLocalJson(JSON.stringify(spec, null, 2));
    const validated = parseSpecForScenario(props.scenarioId, spec);
    if (validated) {
      props.onApplyLocalSpec(validated.spec);
    } else {
      setLocalErr("Preset failed validation (unexpected).");
    }
  }

  const dragW = open ? panelW : FAB_SIZE;
  const dragH = open ? panelH : FAB_SIZE;

  return (
    <div
      className="fixed z-[60] flex flex-col items-stretch"
      style={{ left: fabPos.x, top: fabPos.y, width: open ? panelW : FAB_SIZE }}
    >
      {open ? (
        <div className="flex max-h-[min(85vh,calc(100vh-5rem))] w-full flex-col overflow-hidden rounded-lg border border-border bg-background/95 text-xs text-foreground shadow-md backdrop-blur">
          <div
            className="flex shrink-0 cursor-grab touch-none select-none items-center justify-between gap-2 border-b border-border px-3 py-2 active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={beginDrag}
            onPointerMove={(e) => moveDrag(e, dragW, dragH)}
            onPointerUp={(e) => endDrag(e, dragW, dragH, null)}
            onPointerCancel={cancelDrag}
          >
            <span className="pointer-events-none font-medium text-foreground">Debug</span>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label="Collapse debug panel"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
          <section className="space-y-2 rounded-md border border-border/80 bg-muted/30 p-2">
            <p className="font-medium text-foreground">Timing & API</p>
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground">Hesitation (ms, 0 = off)</span>
              <input
                type="number"
                min={0}
                max={600_000}
                step={500}
                className="rounded border border-input bg-background px-2 py-1"
                value={props.settings.hesitationMs}
                onChange={(e) => patch({ hesitationMs: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props.settings.supportOnTrialStart}
                onChange={(e) => patch({ supportOnTrialStart: e.target.checked })}
              />
              <span>Also request support on trial start (&quot;initial&quot;)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props.settings.forceApiFallback}
                onChange={(e) => patch({ forceApiFallback: e.target.checked })}
              />
              <span>Force server fallback spec (no model)</span>
            </label>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Timing changes apply to the hesitation timer on the current trial when you adjust the
              value; trial bootstrap runs once per task.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={props.condition !== "ephemeral"}
                onClick={() => props.onFireSupport()}
              >
                Fetch support now
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => props.onSettingsChange({ ...DEFAULT_EPHEMERAL_DEBUG_SETTINGS })}
              >
                Reset defaults
              </Button>
            </div>
          </section>

          <section className="space-y-2 rounded-md border border-border/80 bg-muted/30 p-2">
            <p className="font-medium text-foreground">Visual stress (geometry &amp; type)</p>
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground">
                Intensity: {Math.round(props.settings.visualStress * 100)}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(props.settings.visualStress * 100)}
                onChange={(e) =>
                  patch({ visualStress: Math.min(1, Math.max(0, Number(e.target.value) / 100)) })
                }
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props.settings.skinAllowlistedTargets}
                onChange={(e) => patch({ skinAllowlistedTargets: e.target.checked })}
              />
              <span>Restyle <code className="text-[10px]">data-ephemeral-id</code> nodes (cards, etc.)</span>
            </label>
            <button
              type="button"
              className="text-left text-[10px] font-medium text-primary underline"
              onClick={() => setShowTheory((s) => !s)}
            >
              {showTheory ? "Hide" : "Show"} stress-test limits &amp; heavy custom skins
            </button>
            {showTheory ? (
              <div className="space-y-1.5 rounded border border-border bg-muted/30 p-2 text-[10px] leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">What you have now:</strong> CSS bands on the
                  ephemeral portal (tooltips, rings, panels) plus optional chunky borders on any element
                  tagged for assistance. That is enough to stress-test salience and readability.
                </p>
                <p>
                  <strong className="text-foreground">Full custom skins</strong> (textures, 3D voxels,
                  or spec-driven <em>skin tokens</em>) would be a separate branch: more moving parts,
                  harder baseline parity, and clearer consent if participants ever see them.
                </p>
                <p>
                  A practical middle path is what this slider does: push borders, radius, shadow, and
                  monospace type on overlays (and optionally on allowlisted targets) without changing task
                  semantics or layout metrics.
                </p>
                <p>
                  The separate <strong className="text-foreground">chromatic shift</strong> control is a
                  second, independent axis: same geometry, different hue via CSS{" "}
                  <code className="text-[10px]">hue-rotate</code>—useful for accessibility or salience
                  experiments without naming specific palettes.
                </p>
              </div>
            ) : null}
          </section>

          <section className="space-y-2 rounded-md border border-border/80 bg-muted/30 p-2">
            <p className="font-medium text-foreground">Chromatic shift (second axis)</p>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Continuous 0–360° hue rotation on overlays. Independent of stress intensity—no preset
              themes, just a wheel angle.
            </p>
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground">Hue rotation: {props.settings.chromaticShiftDegrees}°</span>
              <input
                type="range"
                min={0}
                max={359}
                value={props.settings.chromaticShiftDegrees}
                onChange={(e) =>
                  patch({
                    chromaticShiftDegrees: normalizeHueDegrees(
                      Number.parseInt(e.target.value, 10) || 0,
                    ),
                  })
                }
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props.settings.chromaticOnSkinnedTargets}
                disabled={!props.settings.skinAllowlistedTargets}
                onChange={(e) => patch({ chromaticOnSkinnedTargets: e.target.checked })}
              />
              <span
                className={!props.settings.skinAllowlistedTargets ? "text-muted-foreground" : undefined}
              >
                Apply same hue to skinned <code className="text-[10px]">data-ephemeral-id</code> nodes
              </span>
            </label>
          </section>

          <section className="space-y-2 rounded-md border border-border/80 bg-muted/30 p-2">
            <p className="font-medium text-foreground">Spec pattern presets (catalog-v3)</p>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Switch between layout/HTML styles for the <strong>current scenario</strong>. Fills the
              editor and shows the overlay immediately.
            </p>
            <select
              className="w-full rounded border border-input bg-background px-2 py-1.5"
              value={presetChoice}
              disabled={!props.scenarioId}
              onChange={(e) => {
                const v = e.target.value as "" | EphemeralDebugPresetId;
                setPresetChoice(v);
                if (v) applyPreset(v);
              }}
            >
              <option value="">Choose preset…</option>
              {EPHEMERAL_DEBUG_PRESET_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-2 rounded-md border border-border/80 bg-muted/30 p-2">
            <p className="font-medium text-foreground">Local EphemeralSpec JSON</p>
            <textarea
              className="min-h-[100px] w-full resize-y rounded border border-input bg-background p-2 font-mono text-[10px] leading-snug"
              placeholder='{"version":1,"root":{...},"meta":{...}}'
              value={localJson}
              onChange={(e) => setLocalJson(e.target.value)}
            />
            {localErr ? <p className="text-destructive">{localErr}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="xs" variant="secondary" onClick={tryApplyJson}>
                Validate &amp; show overlay
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={!props.hasActiveSpec}
                onClick={() => props.onDismissSpec()}
              >
                Clear overlay
              </Button>
            </div>
          </section>

          {props.supportLog ? (
            <section className="rounded-md border border-border bg-muted/20 p-2 font-mono text-[10px] leading-snug">
              <p className="mb-1 font-medium text-foreground">Last fetch</p>
              <p className="text-muted-foreground">phase: {props.supportLog.phase}</p>
              <p className="text-muted-foreground">trigger: {props.supportLog.trigger}</p>
              {props.supportLog.httpStatus != null ? (
                <p className="text-muted-foreground">HTTP: {props.supportLog.httpStatus}</p>
              ) : null}
              {props.supportLog.detail ? (
                <p className="mt-1 break-words text-foreground/90">{props.supportLog.detail}</p>
              ) : null}
            </section>
          ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-full border border-border bg-background/95 text-muted-foreground shadow-md backdrop-blur transition hover:border-border hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
          style={{ touchAction: "none" }}
          aria-label="Open debug panel (drag to move)"
          onPointerDown={beginDrag}
          onPointerMove={(e) => moveDrag(e, dragW, dragH)}
          onPointerUp={(e) => endDrag(e, dragW, dragH, () => setOpen(true))}
          onPointerCancel={cancelDrag}
        >
          <Bug className="h-5 w-5" aria-hidden />
        </button>
      )}
    </div>
  );
}
