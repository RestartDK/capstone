"use client";

import { useEffect, useState } from "react";

function queryTarget(targetId: string): Element | null {
  return document.querySelector(`[data-ephemeral-id="${targetId}"]`);
}

export function useTargetRect(targetId: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetId) {
      return () => setRect(null);
    }
    const update = () => {
      const el = queryTarget(targetId);
      setRect(el?.getBoundingClientRect() ?? null);
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const id = window.setInterval(update, 400);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.clearInterval(id);
      setRect(null);
    };
  }, [targetId]);

  return rect;
}
