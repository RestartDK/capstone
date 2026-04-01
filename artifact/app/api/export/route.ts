import { NextResponse } from "next/server";

import { exportStudyCsvs } from "@/lib/export";

function isAuthorized(req: Request): boolean {
  const secret = process.env.EXPORT_SECRET;
  if (!secret || secret.length === 0) {
    return false;
  }
  const header = req.headers.get("x-export-secret") ?? req.headers.get("authorization");
  if (!header) {
    return false;
  }
  if (header === secret) {
    return true;
  }
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  return bearer?.[1] === secret;
}

export async function GET(req: Request): Promise<Response> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bundle = await exportStudyCsvs();
  const body = [
    "===== participants.csv =====\n",
    bundle.participants,
    "\n===== trials.csv =====\n",
    bundle.trials,
    "\n===== trial_events.csv =====\n",
    bundle.trialEvents,
    "\n===== questionnaire_responses.csv =====\n",
    bundle.questionnaire,
    "\n===== support_outputs.csv =====\n",
    bundle.supportOutputs,
  ].join("");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="study-export.txt"`,
    },
  });
}
