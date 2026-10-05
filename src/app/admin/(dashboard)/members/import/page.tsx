import type { Metadata } from "next";
import { verifyAdminSession } from "@/lib/dal";
import { getMembersAwaitingWelcome } from "@/lib/members";
import { ImportForm } from "./import-form";
import { ResendWelcome } from "./resend-welcome";

export const metadata: Metadata = {
  title: "Bulk Add Members",
};

export default async function ImportMembersPage() {
  // Reads member data, so verify here rather than relying on the layout alone.
  await verifyAdminSession();
  const awaitingWelcome = await getMembersAwaitingWelcome();

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        Bulk add members
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        Upload a CSV to add members directly — skips the application flow.
        Only last_name, first_name and email are required; title, firm,
        industry, location, link and bio are optional. Emails must be work
        addresses (personal ones like Gmail are skipped). For industry, use
        the same wording as the application drop-down (e.g. &ldquo;Financial
        Services&rdquo;). An email that&apos;s already a member is skipped, not
        overwritten.
      </p>
      <p className="mt-3 text-sm">
        <a
          href="/api/admin/members/import/template"
          className="text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Download a template CSV
        </a>
      </p>

      <div className="mt-8">
        <ImportForm />
      </div>

      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
          Re-send welcome email
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Members added by import (not by applying) who haven&apos;t set a password yet. Untick
          anyone you know already received it — resend.com &rarr; Emails shows who was sent what.
        </p>
        <div className="mt-6">
          <ResendWelcome members={awaitingWelcome} />
        </div>
      </section>
    </>
  );
}
