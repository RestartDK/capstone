import { Suspense, type ReactElement } from "react";

import { QuestionnaireClient } from "./questionnaire-client";

export default function QuestionnairePage(): ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <QuestionnaireClient />
    </Suspense>
  );
}
