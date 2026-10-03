import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { verifyMemberSession } from "@/lib/dal";
import { BackupEmailForm, PasswordForm } from "./account-forms";

export const metadata: Metadata = {
  title: "My Account",
};

export default async function AccountPage() {
  const member = await verifyMemberSession();

  return (
    <Container className="py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/members"
            className="text-sm text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            &larr; Member directory
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
            My account
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Signed in as {member.name} ({member.email}).
          </p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="whitespace-nowrap text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Log out
          </button>
        </form>
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
          Password
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          {member.hasPassword
            ? "Change the password you use to sign in."
            : "You haven't set a password yet — set one to sign in without waiting for an email."}
        </p>
        <div className="mt-6">
          <PasswordForm hasPassword={member.hasPassword} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
          Backup email
        </h2>
        <div className="mt-6">
          <BackupEmailForm backupEmail={member.backupEmail} />
        </div>
      </section>
    </Container>
  );
}
