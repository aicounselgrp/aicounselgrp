import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { getDirectoryMembers, parseDirectorySort, type DirectorySort } from "@/lib/members";
import { verifyAdminSession, verifyMemberSession } from "@/lib/dal";
import { getSession } from "@/lib/session";
import { locationWithoutCountry } from "@/lib/locations";

export const metadata: Metadata = {
  title: "Members",
};

const SORT_OPTIONS: { value: DirectorySort; label: string }[] = [
  { value: "last", label: "Last name" },
  { value: "company", label: "Company" },
  { value: "industry", label: "Industry" },
  { value: "first", label: "First name" },
];

type DirectoryView = "cards" | "list";

// Builds a directory URL, omitting defaults so links stay clean.
function directoryHref(sort: DirectorySort, view: DirectoryView) {
  const params = new URLSearchParams();
  if (sort !== "last") params.set("sort", sort);
  if (view !== "cards") params.set("view", view);
  const query = params.toString();
  return query ? `/members?${query}` : "/members";
}

const linkClass = (active: boolean) =>
  active
    ? "font-medium text-slate-900 underline dark:text-slate-100"
    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100";

export default async function MembersPage(props: PageProps<"/members">) {
  // Admins see the directory too (they aren't members): everyone active,
  // including members who've hidden themselves, flagged as such.
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const viewer = isAdmin
    ? { id: null, email: (await verifyAdminSession()).email }
    : await verifyMemberSession();
  const hiddenLabel = isAdmin ? "Hidden from directory" : "Only visible to you";
  const searchParams = await props.searchParams;
  const sort = parseDirectorySort(searchParams.sort);
  const view: DirectoryView = searchParams.view === "list" ? "list" : "cards";
  const members = await getDirectoryMembers(viewer.id, sort);

  return (
    <Container className="py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Members
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            A small group of in-house lawyers practicing across the spectrum of AI
            law. Signed in as {viewer.email}.
          </p>
          {isAdmin && (
            <p className="mt-2 max-w-2xl rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Admin view: this is the directory as members see it, plus anyone who has hidden
              themselves (marked). {members.length} active members.
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={isAdmin ? "/admin" : "/account"}
            className="whitespace-nowrap text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {isAdmin ? "Admin" : "My account"}
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

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Sort members">
          <span className="text-slate-500 dark:text-slate-400">Sort by:</span>
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={directoryHref(option.value, view)}
              aria-current={option.value === sort ? "page" : undefined}
              className={linkClass(option.value === sort)}
            >
              {option.label}
            </Link>
          ))}
        </nav>
        <nav className="flex items-center gap-x-4" aria-label="Directory layout">
          <span className="text-slate-500 dark:text-slate-400">View:</span>
          <Link
            href={directoryHref(sort, "cards")}
            aria-current={view === "cards" ? "page" : undefined}
            className={linkClass(view === "cards")}
          >
            Cards
          </Link>
          <Link
            href={directoryHref(sort, "list")}
            aria-current={view === "list" ? "page" : undefined}
            className={linkClass(view === "list")}
          >
            List
          </Link>
        </nav>
      </div>

      {view === "list" ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-500">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Company</th>
                <th className="py-2 pr-4 font-medium">Industry</th>
                <th className="py-2 pr-4 font-medium">Location</th>
                <th className="py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 align-top dark:border-slate-900">
                  <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">
                    {member.name}
                    {member.hideFromDirectory && (
                      <span className="block text-xs font-normal text-amber-700 dark:text-amber-400">
                        {hiddenLabel}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{member.title}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{member.firm}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{member.industry}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                    {locationWithoutCountry(member.location)}
                  </td>
                  <td className="py-3">
                    <a
                      href={`mailto:${member.email}`}
                      className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      {member.email}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-slate-200 p-6 dark:border-slate-800"
            >
              <h2 className="font-serif text-lg font-semibold text-slate-900 dark:text-slate-100">
                {member.name}
              </h2>
              {member.hideFromDirectory && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  {isAdmin ? (
                    hiddenLabel
                  ) : (
                    <>
                      Only visible to you —{" "}
                      <Link href="/account" className="underline">
                        change in My account
                      </Link>
                    </>
                  )}
                </p>
              )}
              {member.title && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{member.title}</p>
              )}
              {member.firm && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{member.firm}</p>
              )}
              {member.industry && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{member.industry}</p>
              )}
              {member.location && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                  {locationWithoutCountry(member.location)}
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
      )}
    </Container>
  );
}
