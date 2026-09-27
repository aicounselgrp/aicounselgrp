import "server-only";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

// Sent once, when an application is approved. The login link points at the
// login page rather than embedding a magic link, since those expire in 15
// minutes and the new member may not read this right away.
export async function sendWelcomeEmail(member: { name: string; email: string }, origin: string) {
  const result = await sendEmail({
    to: member.email,
    subject: `Welcome to ${siteConfig.shortName}`,
    text: [
      `Hi ${member.name},`,
      "",
      `Your application to join ${siteConfig.shortName} has been approved — welcome!`,
      "",
      "You can now log in to the member directory. Enter this email address on the",
      "login page and we'll send you a secure login link:",
      "",
      `${origin}/login`,
      "",
      `— The ${siteConfig.shortName} team`,
    ].join("\n"),
  });

  // Approval has already happened; a failed email shouldn't undo it or show
  // the admin an error, but it should be visible in the logs.
  if (!result.ok) {
    console.error(`[welcome-email] Could not send welcome email to ${member.email}`);
  }
}
