import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";
import { createApplication } from "@/lib/applications";
import { createDecisionToken } from "@/lib/session";

type JoinPayload = {
  name?: string;
  email?: string;
  firm?: string;
  jurisdiction?: string;
  link?: string;
  message?: string;
  company?: string; // honeypot
};

const REQUIRED_FIELDS: (keyof JoinPayload)[] = [
  "name",
  "email",
  "firm",
  "jurisdiction",
  "message",
];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as JoinPayload | null;

  if (!body) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: silently accept but do nothing.
  if (body.company) {
    return Response.json({ ok: true });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !body[field]?.trim());
  if (missing.length > 0) {
    return Response.json(
      { error: `Missing required field(s): ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const application = await createApplication({
    name: body.name!.trim(),
    email: body.email!.trim(),
    firm: body.firm!.trim(),
    jurisdiction: body.jurisdiction!.trim(),
    link: body.link?.trim() ?? "",
    message: body.message!.trim(),
  });

  const notifyEmail = process.env.JOIN_NOTIFY_EMAIL ?? siteConfig.contactEmail;
  const origin = new URL(request.url).origin;
  const approveToken = await createDecisionToken(application.id, "approved");
  const rejectToken = await createDecisionToken(application.id, "rejected");

  const result = await sendEmail({
    to: notifyEmail,
    replyTo: application.email,
    subject: `New membership application: ${application.name}`,
    text: [
      `Name: ${application.name}`,
      `Email: ${application.email}`,
      `Firm: ${application.firm}`,
      `Jurisdiction: ${application.jurisdiction}`,
      `Link: ${application.link || "—"}`,
      "",
      application.message,
      "",
      `Approve: ${origin}/api/admin/applications/decide?token=${approveToken}`,
      `Reject:  ${origin}/api/admin/applications/decide?token=${rejectToken}`,
      "",
      `Or review all pending applications: ${origin}/admin`,
    ].join("\n"),
  });

  if (!result.ok) {
    return Response.json(
      { error: "Could not send your application. Please try again shortly." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
