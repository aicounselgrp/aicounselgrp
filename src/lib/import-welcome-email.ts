import "server-only";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

// Sent (optionally) to members added by CSV import. They didn't apply, so
// this introduces the site and explains how to sign in for the first time.
export async function sendImportWelcomeEmail(
  member: { name: string; firstName: string; email: string },
  origin: string,
): Promise<boolean> {
  const result = await sendEmail({
    to: member.email,
    subject: `Welcome to ${siteConfig.shortName}`,
    text: [
      `Hi ${member.firstName || member.name},`,
      "",
      `You've been added as a member of ${siteConfig.shortName}, a professional group for in-house lawyers working on artificial intelligence.`,
      "",
      "To sign in to the member directory for the first time:",
      `1. Go to ${origin}/login`,
      "2. Enter this email address",
      `3. Click "Forgot your password, or first time here? Email me a link to set one"`,
      "",
      "Once you're in, you can update your profile, add a personal backup email, or choose not to appear in the directory under My account.",
      "",
      `— The ${siteConfig.shortName} team`,
    ].join("\n"),
  });

  if (!result.ok) {
    console.error(`[import-welcome] Could not send welcome email to ${member.email}`);
  }
  return result.ok;
}
