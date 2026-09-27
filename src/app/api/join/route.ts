import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

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

  const notifyEmail = process.env.JOIN_NOTIFY_EMAIL ?? siteConfig.contactEmail;

  const result = await sendEmail({
    to: notifyEmail,
    replyTo: body.email,
    subject: `New membership application: ${body.name}`,
    text: [
      `Name: ${body.name}`,
      `Email: ${body.email}`,
      `Firm: ${body.firm}`,
      `Jurisdiction: ${body.jurisdiction}`,
      `Link: ${body.link ?? "—"}`,
      "",
      body.message,
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
