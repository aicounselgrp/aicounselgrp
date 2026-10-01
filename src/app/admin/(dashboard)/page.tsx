import type { Metadata } from "next";
import Link from "next/link";
import {
  formatLocation,
  listPendingApplications,
  listDecidedApplications,
} from "@/lib/applications";
import { getAllMembers } from "@/lib/members";
import {
  approveApplicationAction,
  rejectApplicationAction,
  deactivateMemberAction,
  reactivateMemberAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const [pending, decided, members] = await Promise.all([
    listPendingApplications(),
    listDecidedApplications(),
    getAllMembers(),
  ]);

  return (
    <>
      <section>
        <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
          Pending applications ({pending.length})
        </h2>

        {pending.length === 0 && (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-500">
            Nothing waiting on review.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {pending.map((application) => (
            <div
              key={application.id}
              className="rounded-lg border border-slate-200 p-6 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {application.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {[application.jobTitle, application.firm, application.industry]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formatLocation(application)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    {application.email}
                    {application.link && (
                      <>
                        {" "}
                        &middot;{" "}
                        <a
                          href={application.link}
                          className="underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          link
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <form action={approveApplicationAction}>
                      <input type="hidden" name="id" value={application.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectApplicationAction}>
                      <input type="hidden" name="id" value={application.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Personalize email:{" "}
                    <Link
                      href={`/admin/applications/${application.id}/personalize?decision=approved`}
                      className="underline hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      approve
                    </Link>{" "}
                    &middot;{" "}
                    <Link
                      href={`/admin/applications/${application.id}/personalize?decision=rejected`}
                      className="underline hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      reject
                    </Link>
                  </p>
                </div>
              </div>
              {application.message && (
                <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
                  {application.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
            Members ({members.length})
          </h2>
          <Link
            href="/admin/members/import"
            className="text-sm text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Bulk add via CSV
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-500">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-slate-100 dark:border-slate-900"
                >
                  <td className="py-3 pr-4 text-slate-900 dark:text-slate-100">
                    {member.name}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                    {member.email}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        member.status === "active"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-500"
                      }
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/email?to=${encodeURIComponent(member.email)}`}
                        className="text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        Email
                      </Link>
                      <form
                        action={
                          member.status === "active"
                            ? deactivateMemberAction
                            : reactivateMemberAction
                        }
                      >
                        <input type="hidden" name="id" value={member.id} />
                        <button
                          type="submit"
                          className="text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                          {member.status === "active" ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {decided.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
            Recent decisions
          </h2>
          <ul className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {decided.map((application) => (
              <li key={application.id}>
                {application.name} &mdash; {application.status}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
