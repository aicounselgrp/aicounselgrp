import "server-only";
import { sendEmail } from "@/lib/email";
import { getTemplate, renderTemplate } from "@/lib/email-templates";
import type { Application } from "@/lib/applications";

// Sent once, when an application is approved or rejected. Content comes from
// the editable templates at /admin/templates rather than being hardcoded, so
// admins can change the wording without a code change.

export async function sendApprovalEmail(application: Application, origin: string) {
  const template = await getTemplate("approval");
  if (!template) {
    console.error("[application-emails] No 'approval' template found.");
    return;
  }

  const vars = { name: application.name, firm: application.firm, login_url: `${origin}/login` };
  const result = await sendEmail({
    to: application.email,
    subject: renderTemplate(template.subject, vars),
    text: renderTemplate(template.body, vars),
  });

  if (!result.ok) {
    console.error(`[application-emails] Could not send approval email to ${application.email}`);
  }
}

export async function sendRejectionEmail(application: Application) {
  const template = await getTemplate("rejection");
  if (!template) {
    console.error("[application-emails] No 'rejection' template found.");
    return;
  }

  const vars = { name: application.name, firm: application.firm, login_url: "" };
  const result = await sendEmail({
    to: application.email,
    subject: renderTemplate(template.subject, vars),
    text: renderTemplate(template.body, vars),
  });

  if (!result.ok) {
    console.error(`[application-emails] Could not send rejection email to ${application.email}`);
  }
}
