import { verifyDecisionToken } from "@/lib/session";
import { decideApplication } from "@/lib/applications";
import { siteConfig } from "@/lib/site-config";

function htmlPage(title: string, body: string) {
  return new Response(
    `<!doctype html>
<html><head><meta charset="utf-8"><title>${title} — ${siteConfig.shortName}</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1.5rem;color:#0f172a}
a{color:#0f172a}</style></head>
<body><h1>${title}</h1><p>${body}</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const decoded = token ? await verifyDecisionToken(token) : null;

  if (!decoded) {
    return htmlPage("Link expired", "This approval link is invalid or has expired.");
  }

  const application = await decideApplication(decoded.applicationId, decoded.decision);

  if (!application) {
    return htmlPage("Not found", "This application no longer exists.");
  }

  const verb = application.status === "approved" ? "approved" : "rejected";
  return htmlPage(
    `Application ${verb}`,
    `${application.name}'s application has been ${verb}.` +
      (application.status === "approved"
        ? " They've been added as a member and can now log in."
        : ""),
  );
}
