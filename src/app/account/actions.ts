"use server";

import { revalidatePath } from "next/cache";
import { verifyMemberSession } from "@/lib/dal";
import { checkMemberPassword, setMemberBackupEmail, setMemberPassword } from "@/lib/members";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";

export type FormState = { ok: boolean; message: string } | null;

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
    return { ok: false, message: "Enter a valid email address." };
  }

  const error = await setMemberBackupEmail(member.id, backupEmail);
  if (error) return { ok: false, message: error };

  revalidatePath("/account");
  return { ok: true, message: backupEmail ? "Backup email saved." : "Backup email removed." };
}
