import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatLocation, getApplication } from "@/lib/applications";
import { renderDecisionEmail } from "@/lib/application-emails";
import { verifyAdminSession } from "@/lib/dal";
import { requestOrigin } from "@/lib/request-origin";
import { decideWithPersonalEmailAction } from "../../../actions";

export const metadata: Metadata = {
  title: "Personalize decision",
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export default async function PersonalizeDecisionPage(
  props: PageProps<"/admin/applications/[id]/personalize">,
) {
  await verifyAdminSession();
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  // Rejection is the default — it's the one most worth personalizing.
  const decision = searchParams.decision === "approved" ? "approved" : "rejected";

  const application = await getApplication(id);
  if (!application) notFound();

  const backLink = (
    <Link
      href="/admin"
      className="text-sm text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    >
      &larr; Back to dashboard
    </Link>
  );

  if (application.status !== "pending") {
    return (
      <>
        {backLink}
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          {application.name}&apos;s application has already been {application.status}.
        </p>
      </>
    );
  }

  const draft = await renderDecisionEmail(application, decision, await requestOrigin());
  const verb = decision === "approved" ? "Approve" : "Reject";

  return (
    <>
      {backLink}

      <h2 className="mt-6 font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        {verb} {application.name} with a personal email
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {[application.jobTitle, application.firm, application.industry, formatLocation(application)]
          .filter(Boolean)
          .join(" · ")}{" "}
        &middot; {application.email}
      </p>

      <div className="mt-6 flex gap-4 text-sm">
        {(["rejected", "approved"] as const).map((option) => (
          <Link
            key={option}
            href={`/admin/applications/${application.id}/personalize?decision=${option}`}
            className={
              option === decision
                ? "font-medium text-slate-900 underline dark:text-slate-100"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }
          >
            {option === "approved" ? "Approval email" : "Rejection email"}
          </Link>
        ))}
      </div>

      {/* Keyed by decision so switching tabs reloads the draft rather than
          keeping the other email's text in the fields. */}
      <form
        key={decision}
        action={decideWithPersonalEmailAction}
        className="mt-6 max-w-2xl space-y-6"
      >
        <input type="hidden" name="id" value={application.id} />
        <input type="hidden" name="decision" value={decision} />

        <p className="text-sm text-slate-600 dark:text-slate-400">
          Starts from your {decision === "approved" ? "approval" : "rejection"} template. Edit
          anything below — this email goes only to {application.email}, and the template itself
          isn&apos;t changed.
        </p>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            defaultValue={draft?.subject ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            Message
          </label>
          <textarea
            id="body"
            name="body"
            rows={12}
            required
            defaultValue={draft?.body ?? ""}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className={
            decision === "approved"
              ? "rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              : "rounded-md bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600"
          }
        >
          {verb} and send email
        </button>
      </form>
    </>
  );
}
