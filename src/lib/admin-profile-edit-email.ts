import "server-only";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

// Optional note to a member after an admin updates their profile, listing
// what changed. For a work-email change it goes to both addresses so the
// member notices even if they no longer read the old inbox.
export async function sendAdminProfileEditEmail(input: {
  firstName: string;
  name: string;
  changes: string[];
  previousEmail: string;
  newEmail: string;
  origin: string;
}) {
  const emailChanged = input.previousEmail.toLowerCase() !== input.newEmail.toLowerCase();
  const text = [
    `Hi ${input.firstName || input.name},`,
    "",
    `We've updated your ${siteConfig.shortName} member profile:`,
    "",
    ...input.changes.map((change) => `- ${change}`),
    "",
    emailChanged
      ? `Please use ${input.newEmail} to sign in from now on: ${input.origin}/login`
      : `You can review your profile any time under My account: ${input.origin}/account`,
    "",
    "If anything looks wrong, just reply to this email.",
    "",
    `— The ${siteConfig.shortName} team`,
  ].join("\n");

  const recipients = emailChanged ? [input.newEmail, input.previousEmail] : [input.newEmail];
  for (const to of recipients) {
    await sendEmail({ to, subject: `Your ${siteConfig.shortName} profile was updated`, text });
  }
}
