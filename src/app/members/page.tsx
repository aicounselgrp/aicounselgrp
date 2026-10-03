import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { getActiveMembers } from "@/lib/members";
import { verifyMemberSession } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Members",
};

export default async function MembersPage() {
  const viewer = await verifyMemberSession();
  const members = await getActiveMembers();

  return (
    <Container className="py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Members
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            A small group of lawyers practicing across the spectrum of AI
            law. Signed in as {viewer.email}.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/account"
            className="whitespace-nowrap text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            My account
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="whitespace-nowrap text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="rounded-lg border border-slate-200 p-6 dark:border-slate-800"
          >
            <h2 className="font-serif text-lg font-semibold text-slate-900 dark:text-slate-100">
              {member.name}
            </h2>
            {(member.title || member.firm) && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {[member.title, member.firm].filter(Boolean).join(", ")}
              </p>
            )}
            {member.location && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                {member.location}
              </p>
            )}
            <a
              href={`mailto:${member.email}`}
              className="mt-1 block text-sm text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-100"
            >
              {member.email}
            </a>
            {member.focus.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {member.focus.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}
