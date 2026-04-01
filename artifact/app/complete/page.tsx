import type React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getParticipantIdFromCookies } from "@/lib/session";
import { hasCompletedFinal } from "@/lib/study";

export default async function CompletePage(): Promise<React.ReactElement> {
  const pid = await getParticipantIdFromCookies();
  let ok = false;
  if (pid) {
    ok = await hasCompletedFinal(pid);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-lg font-medium">Thank you</h1>
      {ok ? (
        <p className="text-sm text-muted-foreground">
          Your responses were recorded. You can close this window.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          If you are participating in the study, finish the remaining steps first. Otherwise you can
          return home.
        </p>
      )}
      <Button asChild variant="outline" size="sm">
        <Link href="/">Home</Link>
      </Button>
    </div>
  );
}
