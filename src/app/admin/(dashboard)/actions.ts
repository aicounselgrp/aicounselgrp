"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/dal";
import { decideApplication } from "@/lib/applications";
import { setMemberStatus } from "@/lib/members";
import {
  sendApprovalEmail,
  sendDecisionEmail,
  sendRejectionEmail,
} from "@/lib/application-emails";
import { requestOrigin } from "@/lib/request-origin";

export async function approveApplicationAction(formData: FormData) {
  await verifyAdminSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const result = await decideApplication(id, "approved");
  if (result?.decidedNow) {
    await sendApprovalEmail(result.application, await requestOrigin());
  }
  revalidatePath("/admin");
}

export async function rejectApplicationAction(formData: FormData) {
  await verifyAdminSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const result = await decideApplication(id, "rejected");
  if (result?.decidedNow) {
    await sendRejectionEmail(result.application);
  }
  revalidatePath("/admin");
}

// Approve or reject with an email the admin wrote/edited on the
// personalize page, instead of the standard template.
export async function decideWithPersonalEmailAction(formData: FormData) {
  await verifyAdminSession();
  const id = formData.get("id");
  const decision = formData.get("decision");
  const subject = String(formData.get("subject") ?? "").trim();
  // Browsers submit textarea line breaks as \r\n; normalize for the email.
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (typeof id !== "string" || (decision !== "approved" && decision !== "rejected")) return;
  if (!subject || !body) return;

  const result = await decideApplication(id, decision);
  if (result?.decidedNow) {
    await sendDecisionEmail(result.application, decision, await requestOrigin(), { subject, body });
  }
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deactivateMemberAction(formData: FormData) {
  await verifyAdminSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await setMemberStatus(id, "deactivated");
  revalidatePath("/admin");
}

export async function reactivateMemberAction(formData: FormData) {
  await verifyAdminSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await setMemberStatus(id, "active");
  revalidatePath("/admin");
}
