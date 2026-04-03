export type Placement = "top" | "bottom" | "left" | "right";

type AnchoredPosition = {
  left: number;
  top: number;
  transform?: string;
  placement: Placement;
};

const EDGE_MARGIN = 8;

/**
 * Compute anchored position relative to a target rect, then clamp fully into
 * the viewport. If the preferred placement would push the element off-screen,
 * the opposite side is tried before falling back to clamping in-place.
 */
export function anchorAndClamp(
  rect: DOMRect,
  preferredPlacement: Placement,
  elWidth: number,
  elHeight: number,
  gap = 8,
): AnchoredPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  function tryPlacement(pl: Placement): { left: number; top: number } {
    switch (pl) {
      case "top":
        return {
          left: rect.left + rect.width / 2 - elWidth / 2,
          top: rect.top - gap - elHeight,
        };
      case "bottom":
        return {
          left: rect.left + rect.width / 2 - elWidth / 2,
          top: rect.bottom + gap,
        };
      case "left":
        return {
          left: rect.left - gap - elWidth,
          top: rect.top + rect.height / 2 - elHeight / 2,
        };
      case "right":
        return {
          left: rect.right + gap,
          top: rect.top + rect.height / 2 - elHeight / 2,
        };
    }
  }

  const opposite: Record<Placement, Placement> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  };

  let placement = preferredPlacement;
  let pos = tryPlacement(placement);

  const fitsInViewport = (p: { left: number; top: number }) =>
    p.left >= EDGE_MARGIN &&
    p.left + elWidth <= vw - EDGE_MARGIN &&
    p.top >= EDGE_MARGIN &&
    p.top + elHeight <= vh - EDGE_MARGIN;

  if (!fitsInViewport(pos)) {
    const alt = opposite[placement];
    const altPos = tryPlacement(alt);
    if (fitsInViewport(altPos)) {
      placement = alt;
      pos = altPos;
    }
  }

  return {
    left: Math.min(vw - elWidth - EDGE_MARGIN, Math.max(EDGE_MARGIN, pos.left)),
    top: Math.min(vh - elHeight - EDGE_MARGIN, Math.max(EDGE_MARGIN, pos.top)),
    placement,
  };
}

/**
 * Simple clamp for components that compute their own left/top and just need
 * to stay inside the viewport (e.g. ComparisonStrip which sits below a union
 * of two targets).
 */
export function clampBox(
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    left: Math.min(vw - width - EDGE_MARGIN, Math.max(EDGE_MARGIN, left)),
    top: Math.min(vh - height - EDGE_MARGIN, Math.max(EDGE_MARGIN, top)),
  };
}
