import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";
import { createApplication, formatLocation } from "@/lib/applications";
import { createDecisionToken } from "@/lib/session";
import { isIndustry } from "@/lib/industries";
import { UNITED_STATES, isCountry, isUsState } from "@/lib/locations";

type JoinPayload = {
  name?: string;
  email?: string;
  firm?: string;
  jobTitle?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  link?: string;
  message?: string;
  acceptPolicies?: string;
  company?: string; // honeypot
};

const REQUIRED_FIELDS = [
  "name",
  "email",
  "firm",
  "jobTitle",
  "industry",
  "city",
  "country",
] satisfies (keyof JoinPayload)[];

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

  if (!isIndustry(body.industry!.trim())) {
    return Response.json({ error: "Please select an industry from the list." }, { status: 400 });
  }

  if (!isCountry(body.country!.trim())) {
    return Response.json({ error: "Please select a country from the list." }, { status: 400 });
  }

  if (body.country!.trim() === UNITED_STATES && !isUsState(body.state?.trim() ?? "")) {
    return Response.json({ error: "Please select a state." }, { status: 400 });
  }

  if (body.acceptPolicies !== "on") {
    return Response.json(
      {
        error:
          "Please confirm you have read and accepted the Terms of Use, Privacy Policy and Antitrust Policy.",
      },
      { status: 400 },
    );
  }

  const application = await createApplication({
    name: body.name!.trim(),
    email: body.email!.trim(),
    firm: body.firm!.trim(),
    jobTitle: body.jobTitle!.trim(),
    industry: body.industry!.trim(),
    city: body.city!.trim(),
    state: body.state?.trim() ?? "",
    country: body.country!.trim(),
    link: body.link?.trim() ?? "",
    message: body.message?.trim() ?? "",
  });

  const notifyEmail = process.env.JOIN_NOTIFY_EMAIL ?? siteConfig.contactEmail;
  const origin = new URL(request.url).origin;
  const approveToken = await createDecisionToken(application.id, "approved");
  const rejectToken = await createDecisionToken(application.id, "rejected");

  // The application is already saved at this point — that's the outcome that
  // matters to the applicant. Don't fail their request over a notification
  // email hiccup (e.g. the sending domain not yet verified); just log it.
  // The application still shows up in /admin either way.
  await sendEmail({
    to: notifyEmail,
    replyTo: application.email,
    subject: `New membership application: ${application.name}`,
    text: [
      `Name: ${application.name}`,
      `Email: ${application.email}`,
      `Firm: ${application.firm}`,
      `Job title: ${application.jobTitle}`,
      `Industry: ${application.industry}`,
      `Location: ${formatLocation(application)}`,
      `Link: ${application.link || "—"}`,
      "",
      application.message || "(No description provided.)",
      "",
      "Accepted the Terms of Use, Privacy Policy and Antitrust Policy.",
      "",
      `Approve: ${origin}/api/admin/applications/decide?token=${approveToken}`,
      `Reject:  ${origin}/api/admin/applications/decide?token=${rejectToken}`,
      "",
      `Or review all pending applications: ${origin}/admin`,
    ].join("\n"),
  });

  return Response.json({ ok: true });
}
