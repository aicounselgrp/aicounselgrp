import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findActiveMemberByEmail, type Member } from "@/lib/members";

export const verifyMemberSession = cache(async (): Promise<Member> => {
  const session = await getSession();
  const member = session ? await findActiveMemberByEmail(session.email) : undefined;

  if (!member) {
    redirect("/login");
  }

  return member;
});

export const verifyAdminSession = cache(async (): Promise<{ email: string }> => {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/admin/login");
  }

  return { email: session.email };
});
