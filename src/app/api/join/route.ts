import { Resend } from "resend";
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
  const fromEmail = process.env.JOIN_FROM_EMAIL ?? "applications@example.org";
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      "[join] RESEND_API_KEY is not set — logging submission instead of emailing it.",
      body,
    );
    return Response.json({ ok: true });
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: fromEmail,
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

  if (error) {
    console.error("[join] Resend error:", error);
    return Response.json(
      { error: "Could not send your application. Please try again shortly." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
