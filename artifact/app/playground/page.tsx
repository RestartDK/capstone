import { notFound } from "next/navigation";

import { PlaygroundClient } from "./playground-client";

/**
 * Local ephemeral UI lab. Gated to `NODE_ENV === 'development'` so it never ships in production.
 */
export default function PlaygroundPage(): React.ReactElement {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <PlaygroundClient />;
}
