"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";

export function CompleteView(props: { completed: boolean }): React.ReactElement {
  useEffect(() => {
    if (!props.completed || typeof window === "undefined") return;

    const defaults = {
      spread: 90,
      ticks: 200,
      gravity: 1,
      decay: 0.94,
      startVelocity: 35,
      colors: ["#fbbf24", "#f59e0b", "#a78bfa", "#818cf8", "#34d399", "#22d3ee", "#fb7185"],
    };

    const end = Date.now() + 2500;

    const burst = () => {
      void confetti({ ...defaults, particleCount: 45, scalar: 1, origin: { x: 0.15, y: 0.65 } });
      void confetti({ ...defaults, particleCount: 45, scalar: 1, origin: { x: 0.85, y: 0.65 } });
    };

    burst();
    void confetti({ ...defaults, particleCount: 120, spread: 120, origin: { x: 0.5, y: 0.55 } });

    const id = window.setInterval(() => {
      if (Date.now() > end) {
        window.clearInterval(id);
        return;
      }
      burst();
    }, 400);

    return () => window.clearInterval(id);
  }, [props.completed]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-medium">
          {props.completed ? (
            <>thank you for completing my capstone :)</>
          ) : (
            <>Almost there</>
          )}
        </h1>
        {props.completed ? (
          <p className="mt-2 text-sm text-muted-foreground">
            you have my thanks and next time we meet I owe u one.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            If you are participating in the study, finish the remaining steps first. Otherwise you can
            close this window.
          </p>
        )}
      </div>
    </div>
  );
}
