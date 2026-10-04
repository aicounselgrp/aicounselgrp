import "server-only";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";
import { createEmailChangeToken } from "@/lib/session";
import type { Member } from "@/lib/members";
import type { ProfileChangeRequest } from "@/lib/profile-changes";

function adminInbox() {
  return process.env.JOIN_NOTIFY_EMAIL ?? siteConfig.contactEmail;
}

function describeChange(member: Pick<Member, "firm" | "email">, request: ProfileChangeRequest) {
  return [
    request.newFirm ? `Company: ${member.firm || "—"} → ${request.newFirm}` : null,
    request.newEmail ? `Work email: ${member.email} → ${request.newEmail}` : null,
  ].filter(Boolean) as string[];
}

// Sent to the proposed new work email so the member can prove they own it.
export async function sendEmailChangeConfirmation(
  member: Member,
  request: ProfileChangeRequest,
  origin: string,
) {
  if (!request.newEmail) return;
  const token = await createEmailChangeToken(request.id);
  await sendEmail({
    to: request.newEmail,
    subject: `Confirm your new ${siteConfig.shortName} email address`,
    text: [
      `Hi ${member.firstName || member.name},`,
      "",
      `You asked to change your ${siteConfig.shortName} work email to this address. Click to confirm it's yours (expires in 7 days):`,
      "",
      `${origin}/api/account/confirm-email?token=${token}`,
      "",
      "After you confirm, an admin will review the change. If you didn't ask for this, you can ignore this email.",
    ].join("\n"),
  });
}

export async function notifyAdminsOfChangeRequest(
  member: Member,
  request: ProfileChangeRequest,
  origin: string,
) {
  await sendEmail({
    to: adminInbox(),
    replyTo: member.email,
    subject: `Profile change to review: ${member.name}`,
    text: [
      `${member.name} has asked to update their profile:`,
      "",
      ...describeChange(member, request),
      "",
      request.newEmail
        ? "The new email must be confirmed by the member before it can be approved."
        : "",
      `Review it on the admin dashboard: ${origin}/admin`,
    ].join("\n"),
  });
}

export async function notifyMemberOfDecision(
  member: Pick<Member, "name" | "firstName" | "firm">,
  request: ProfileChangeRequest,
  previousEmail: string,
  decision: "approved" | "rejected",
) {
  // After an approved email change, write to the new address (and the old
  // one, so the member notices if it wasn't them).
  const recipients =
    decision === "approved" && request.newEmail
      ? [request.newEmail, previousEmail]
      : [previousEmail];
  const changes = describeChange({ firm: member.firm, email: previousEmail }, request);
  const text = [
    `Hi ${member.firstName || member.name},`,
    "",
    decision === "approved"
      ? "Your profile change has been approved and is now live:"
      : "Your requested profile change wasn't approved:",
    "",
    ...changes,
    "",
    decision === "approved" && request.newEmail
      ? "Use your new email address to sign in from now on."
      : "If you have questions, just reply to this email.",
    "",
    `— The ${siteConfig.shortName} team`,
  ].join("\n");

  for (const to of recipients) {
    await sendEmail({
      to,
      subject: `Your ${siteConfig.shortName} profile change was ${decision}`,
      text,
    });
  }
}
