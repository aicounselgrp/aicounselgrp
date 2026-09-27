import type { Metadata } from "next";
import { Container } from "@/components/container";
import { members } from "@/lib/members";

export const metadata: Metadata = {
  title: "Members",
};

export default function MembersPage() {
  return (
    <Container className="py-16">
      <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
        Members
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
        A small group of lawyers practicing across the spectrum of AI law.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.name}
            className="rounded-lg border border-slate-200 p-6 dark:border-slate-800"
          >
            <h2 className="font-serif text-lg font-semibold text-slate-900 dark:text-slate-100">
              {member.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {member.title}, {member.firm}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
              {member.location}
            </p>
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
          </div>
        ))}
      </div>
    </Container>
  );
}
