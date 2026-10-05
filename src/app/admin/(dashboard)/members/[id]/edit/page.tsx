import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyAdminSession } from "@/lib/dal";
import { getMemberById } from "@/lib/members";
import { AdminMemberEditForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Edit Member",
};

export default async function AdminEditMemberPage(props: PageProps<"/admin/members/[id]/edit">) {
  // Reads member data, so verify here rather than relying on the layout alone.
  await verifyAdminSession();
  const { id } = await props.params;
  const member = await getMemberById(id);
  if (!member) notFound();

  return (
    <>
      <Link
        href="/admin"
        className="text-sm text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        &larr; Back to dashboard
      </Link>
      <h2 className="mt-6 font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        Edit {member.name}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Changes go live in the directory immediately — no approval step.
        {member.status !== "active" && " This member is currently deactivated."}
      </p>

      <div className="mt-8">
        <AdminMemberEditForm
          id={member.id}
          saved={{
            firstName: member.firstName,
            lastName: member.lastName,
            title: member.title,
            firm: member.firm,
            industry: member.industry,
            location: member.location,
            link: member.link,
            email: member.email,
          }}
        />
      </div>
    </>
  );
}
