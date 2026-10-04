"use server";

import { revalidatePath } from "next/cache";
import { verifyMemberSession } from "@/lib/dal";
import {
  checkMemberPassword,
  emailInUseByOtherMember,
  setHideFromDirectory,
  setMemberBackupEmail,
  setMemberPassword,
  updateMemberProfile,
} from "@/lib/members";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import { isPersonalEmail } from "@/lib/personal-email";
import { cancelChangeRequest, createChangeRequest } from "@/lib/profile-changes";
import {
  notifyAdminsOfChangeRequest,
  sendEmailChangeConfirmation,
} from "@/lib/profile-change-emails";
import { requestOrigin } from "@/lib/request-origin";

// `values` echoes back what was submitted when there's an error, so the form
// can keep the member's edits instead of resetting to the saved values.
export type FormState = { ok: boolean; message: string; values?: Record<string, string> } | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await verifyMemberSession();
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  // Someone who has never set a password (they've only used email links)
  // has nothing to confirm; otherwise require the current one.
  if (member.hasPassword && !(await checkMemberPassword(member.id, current))) {
    return { ok: false, message: "Your current password is incorrect." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) {
    return { ok: false, message: "New passwords don't match." };
  }

  await setMemberPassword(member.id, password);
  revalidatePath("/account");
  return { ok: true, message: "Password saved." };
}

export async function updateBackupEmailAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await verifyMemberSession();
  const backupEmail = String(formData.get("backupEmail") ?? "").trim();

  if (backupEmail && !EMAIL_PATTERN.test(backupEmail)) {
    return { ok: false, message: "Enter a valid email address.", values: { backupEmail } };
  }

  const error = await setMemberBackupEmail(member.id, backupEmail);
  if (error) return { ok: false, message: error, values: { backupEmail } };

  revalidatePath("/account");
  return { ok: true, message: backupEmail ? "Backup email saved." : "Backup email removed." };
}

export async function updateDirectoryVisibilityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await verifyMemberSession();
  // Unchecked checkboxes aren't submitted, so absence means "hide".
  const show = formData.get("showInDirectory") === "on";
  await setHideFromDirectory(member.id, !show);
  revalidatePath("/account");
  revalidatePath("/members");
  return {
    ok: true,
    message: show
      ? "You're listed in the member directory."
      : "You're hidden from the member directory.",
  };
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

// Name, title, industry, location and link: live immediately.
export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await verifyMemberSession();
  const firstName = field(formData, "firstName");
  const lastName = field(formData, "lastName");
  const link = field(formData, "link");
  const values = {
    firstName,
    lastName,
    title: field(formData, "title"),
    industry: field(formData, "industry"),
    location: field(formData, "location"),
    link,
  };

  if (!firstName || !lastName) {
    return { ok: false, message: "First and last name are required.", values };
  }
  if (link && !/^https?:\/\/\S+$/i.test(link)) {
    return {
      ok: false,
      message: "LinkedIn or website must be a full link starting with https://",
      values,
    };
  }

  await updateMemberProfile(member.id, values);
  revalidatePath("/account");
  revalidatePath("/members");
  return { ok: true, message: "Profile saved." };
}

// Company and work email: submitted for admin approval.
export async function requestChangeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await verifyMemberSession();
  const firm = field(formData, "firm");
  const email = field(formData, "email").toLowerCase();

  const values = { firm, email };
  const newFirm = firm && firm !== member.firm ? firm : null;
  const newEmail = email && email !== member.email.toLowerCase() ? email : null;

  if (!newFirm && !newEmail) {
    return { ok: false, message: "Change your company or work email above, then submit.", values };
  }
  if (newEmail && !EMAIL_PATTERN.test(newEmail)) {
    return { ok: false, message: "Enter a valid work email address.", values };
  }
  if (newEmail && isPersonalEmail(newEmail)) {
    return {
      ok: false,
      message:
        "Your work email must be a professional address. Add a personal address as your backup email below instead.",
      values,
    };
  }
  if (newEmail && (await emailInUseByOtherMember(newEmail, member.id))) {
    return { ok: false, message: "That email is already in use by another member.", values };
  }

  const request = await createChangeRequest(member.id, { newFirm, newEmail });
  const origin = await requestOrigin();
  if (newEmail) await sendEmailChangeConfirmation(member, request, origin);
  await notifyAdminsOfChangeRequest(member, request, origin);

  revalidatePath("/account");
  return {
    ok: true,
    message: newEmail
      ? `Submitted for review. We've emailed ${newEmail} — click the link there to confirm it's yours.`
      : "Submitted for review. An admin will approve it shortly.",
  };
}

export async function cancelChangeRequestAction(): Promise<void> {
  const member = await verifyMemberSession();
  await cancelChangeRequest(member.id);
  revalidatePath("/account");
}
