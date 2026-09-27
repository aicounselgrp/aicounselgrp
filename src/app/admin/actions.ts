"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/dal";
import { decideApplication } from "@/lib/applications";
import { setMemberStatus } from "@/lib/members";

export async function approveApplicationAction(formData: FormData) {
  await verifyAdminSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await decideApplication(id, "approved");
  revalidatePath("/admin");
}

export async function rejectApplicationAction(formData: FormData) {
  await verifyAdminSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await decideApplication(id, "rejected");
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
