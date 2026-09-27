import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/session";
import { findMemberByEmail } from "@/lib/members";

export const verifyMemberSession = cache(async () => {
  const email = await getSessionEmail();
  const member = email ? findMemberByEmail(email) : undefined;

  if (!member) {
    redirect("/login");
  }

  return member;
});
