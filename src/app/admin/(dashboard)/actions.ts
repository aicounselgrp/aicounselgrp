"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { verifyAdminSession } from "@/lib/dal";
import { decideApplication } from "@/lib/applications";
import { setMemberStatus } from "@/lib/members";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/application-emails";

async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

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
