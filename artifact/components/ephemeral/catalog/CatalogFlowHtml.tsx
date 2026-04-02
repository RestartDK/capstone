"use client";

import * as React from "react";

import { sanitizeEphemeralHtml } from "@/lib/ephemeral/sanitize-html";

export function CatalogFlowHtml(props: { html: string }): React.JSX.Element {
  const clean = React.useMemo(() => sanitizeEphemeralHtml(props.html), [props.html]);

  return (
    <div
      className="ephemeral-flow-html text-sm leading-snug [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h4]:mb-1 [&_h4]:text-xs [&_h4]:font-semibold [&_li]:mt-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_pre]:my-2 [&_pre]:max-h-40 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
