"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/dal";
import { setTemplate, type TemplateKey } from "@/lib/email-templates";

export async function updateTemplateAction(formData: FormData) {
  await verifyAdminSession();
  const key = formData.get("key");
  const subject = formData.get("subject");
  const body = formData.get("body");

  if (
    (key !== "approval" && key !== "rejection") ||
    typeof subject !== "string" ||
    typeof body !== "string"
  ) {
    return;
  }

  await setTemplate(key as TemplateKey, subject, body);
  revalidatePath("/admin/templates");
}
