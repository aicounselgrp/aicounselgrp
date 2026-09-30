import type { Metadata } from "next";
import { ImportForm } from "./import-form";

export const metadata: Metadata = {
  title: "Bulk Add Members",
};

export default function ImportMembersPage() {
  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        Bulk add members
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        Upload a CSV to add members directly — skips the application flow.
        Only <strong>name</strong> and <strong>email</strong> are required;
        title, firm, industry, location, link, and bio are optional. An
        email that&apos;s already a member is skipped, not overwritten.
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
    </>
  );
}
