import { getParticipantIdFromCookies } from "@/lib/session";
import { hasCompletedFinal } from "@/lib/study";

import { CompleteView } from "./CompleteView";

export default async function CompletePage() {
  const pid = await getParticipantIdFromCookies();
  const completed = pid ? await hasCompletedFinal(pid) : false;

  return <CompleteView completed={completed} />;
}
