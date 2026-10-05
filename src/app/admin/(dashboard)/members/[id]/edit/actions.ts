"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/dal";
import { adminUpdateMember, emailInUseByOtherMember, getMemberById } from "@/lib/members";
import { isPersonalEmail } from "@/lib/personal-email";
import { cancelChangeRequest } from "@/lib/profile-changes";
import { sendAdminProfileEditEmail } from "@/lib/admin-profile-edit-email";
import { requestOrigin } from "@/lib/request-origin";

export type EditState = {
  ok: boolean;
  message: string;
  values?: Record<string, string>;
} | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  title: "Job title",
  firm: "Company",
  industry: "Industry",
  location: "Location",
  link: "LinkedIn or website",
  email: "Work email",
};

export async function adminEditMemberAction(_prev: EditState, formData: FormData): Promise<EditState> {
  await verifyAdminSession();
  const id = String(formData.get("id") ?? "");
  const member = await getMemberById(id);
  if (!member) return { ok: false, message: "That member no longer exists." };

  const field = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    firstName: field("firstName"),
    lastName: field("lastName"),
    title: field("title"),
    firm: field("firm"),
    industry: field("industry"),
    location: field("location"),
    link: field("link"),
    email: field("email").toLowerCase(),
  };
  const fail = (message: string): EditState => ({ ok: false, message, values });

  if (!values.firstName || !values.lastName) return fail("First and last name are required.");
  if (!EMAIL_PATTERN.test(values.email)) return fail("Enter a valid work email address.");
  if (isPersonalEmail(values.email)) {
    return fail("The work email must be a professional address, not a personal one like Gmail.");
  }
  if (await emailInUseByOtherMember(values.email, member.id)) {
    return fail("Another member already uses that email (as their work or backup email).");
  }
  if (values.link && !/^https?:\/\/\S+$/i.test(values.link)) {
    return fail("LinkedIn or website must be a full link starting with https://");
  }

  const before: Record<string, string> = {
    firstName: member.firstName,
    lastName: member.lastName,
    title: member.title,
    firm: member.firm,
    industry: member.industry,
    location: member.location,
    link: member.link,
    email: member.email.toLowerCase(),
  };
  const changes = Object.keys(LABELS)
    .filter((key) => (before[key] ?? "") !== values[key as keyof typeof values])
    .map((key) => `${LABELS[key]}: ${before[key] || "—"} → ${values[key as keyof typeof values] || "—"}`);

  if (changes.length === 0) return { ok: true, message: "No changes to save.", values };

  await adminUpdateMember(member.id, values);

  // An admin edit to company/email supersedes any request the member had pending.
  if (before.firm !== values.firm || before.email !== values.email) {
    await cancelChangeRequest(member.id);
  }

  if (formData.get("notify") === "on") {
    await sendAdminProfileEditEmail({
      firstName: values.firstName,
      name: `${values.firstName} ${values.lastName}`,
      changes,
      previousEmail: member.email,
      newEmail: values.email,
      origin: await requestOrigin(),
    });
  }

  revalidatePath("/admin");
  revalidatePath("/members");
  revalidatePath(`/admin/members/${member.id}/edit`);
  return {
    ok: true,
    message:
      `Saved ${changes.length} change${changes.length === 1 ? "" : "s"}` +
      (formData.get("notify") === "on" ? " and emailed the member." : "."),
  };
}
