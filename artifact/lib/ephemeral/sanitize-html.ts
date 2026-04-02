import DOMPurify from "isomorphic-dompurify";

const EPHEMERAL_HTML_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "ul",
    "ol",
    "li",
    "span",
    "h3",
    "h4",
    "code",
    "pre",
  ],
  ALLOWED_ATTR: [] as string[],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
};

/** Strip all scripting, handlers, and disallowed tags; safe for dangerouslySetInnerHTML. */
export function sanitizeEphemeralHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, EPHEMERAL_HTML_CONFIG);
}
