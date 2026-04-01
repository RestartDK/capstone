"use client";

export async function trackEvent(input: {
  participantId: string;
  trialId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
