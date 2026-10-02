import "server-only";
import { sendEmail } from "@/lib/email";
import { getTemplate, renderTemplate } from "@/lib/email-templates";
import type { Application } from "@/lib/applications";
import { firstNameOf } from "@/lib/names";

// Sent once, when an application is approved or rejected. Content comes from
// the editable templates at /admin/templates rather than being hardcoded, so
// admins can change the wording without a code change. Admins can also
// personalize an individual email before sending (see renderDecisionEmail).

type Decision = "approved" | "rejected";

const TEMPLATE_KEY = { approved: "approval", rejected: "rejection" } as const;

function decisionVars(application: Application, decision: Decision, origin: string) {
  return {
    name: application.name,
    first_name: firstNameOf(application),
    firm: application.firm,
    login_url: decision === "approved" ? `${origin}/login` : "",
  };
}

// The template-based email for this applicant, with placeholders filled in.
// Used as the starting draft when an admin personalizes a decision email.
export async function renderDecisionEmail(
  application: Application,
  decision: Decision,
  origin: string,
): Promise<{ subject: string; body: string } | undefined> {
  const template = await getTemplate(TEMPLATE_KEY[decision]);
  if (!template) {
    console.error(`[application-emails] No '${TEMPLATE_KEY[decision]}' template found.`);
    return undefined;
  }
  const vars = decisionVars(application, decision, origin);
  return {
    subject: renderTemplate(template.subject, vars),
    body: renderTemplate(template.body, vars),
  };
}

// Sends a decision email. Placeholders are still rendered, so an admin who
// types {{first_name}} into a personalized email gets the applicant's name.
export async function sendDecisionEmail(
  application: Application,
  decision: Decision,
  origin: string,
  email: { subject: string; body: string },
) {
  const vars = decisionVars(application, decision, origin);
  const result = await sendEmail({
    to: application.email,
    subject: renderTemplate(email.subject, vars),
    text: renderTemplate(email.body, vars),
  });

  if (!result.ok) {
    console.error(`[application-emails] Could not send ${decision} email to ${application.email}`);
  }
}

export async function sendApprovalEmail(application: Application, origin: string) {
  const email = await renderDecisionEmail(application, "approved", origin);
  if (email) await sendDecisionEmail(application, "approved", origin, email);
}

export async function sendRejectionEmail(application: Application) {
  const email = await renderDecisionEmail(application, "rejected", "");
  if (email) await sendDecisionEmail(application, "rejected", "", email);
}
