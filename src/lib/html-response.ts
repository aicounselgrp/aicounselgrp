import { siteConfig } from "@/lib/site-config";

// A minimal styled HTML page for links clicked directly from email (decision
// links, RSVP links) — no session, no app shell, just a confirmation.
export function htmlPage(title: string, body: string) {
  return new Response(
    `<!doctype html>
<html><head><meta charset="utf-8"><title>${title} — ${siteConfig.shortName}</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1.5rem;color:#0f172a}
a{color:#0f172a}</style></head>
<body><h1>${title}</h1><p>${body}</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
