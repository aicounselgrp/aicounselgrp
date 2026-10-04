import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { verifyMemberSession } from "@/lib/dal";
import { getPendingChangeForMember } from "@/lib/profile-changes";
import {
  BackupEmailForm,
  CompanyEmailForm,
  DirectoryVisibilityForm,
  PasswordForm,
  ProfileForm,
} from "./account-forms";

export const metadata: Metadata = {
  title: "My Account",
};

export default async function AccountPage(props: PageProps<"/account">) {
  const member = await verifyMemberSession();
  const pendingChange = await getPendingChangeForMember(member.id);
  const searchParams = await props.searchParams;
  const emailNotice =
    searchParams.email === "confirmed"
      ? { ok: true, text: "Thanks — your new email address is confirmed. An admin will review the change." }
      : searchParams.email === "invalid-link"
        ? { ok: false, text: "That confirmation link is invalid, expired, or the request was already decided." }
        : null;

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

      {emailNotice && (
        <p
          className={
            emailNotice.ok
              ? "mt-8 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "mt-8 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          }
        >
          {emailNotice.text}
        </p>
      )}

      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
          Profile
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          How you appear in the member directory. Changes here are live right away.
        </p>
        <div className="mt-6">
          <ProfileForm
            values={{
              firstName: member.firstName,
              lastName: member.lastName,
              title: member.title,
              industry: member.industry,
              location: member.location,
              link: member.link,
            }}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
          Company and work email
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Membership is limited to in-house lawyers, so changes to these are reviewed by an admin
          before they appear in the directory.
        </p>
        <div className="mt-6">
          <CompanyEmailForm
            firm={member.firm}
            email={member.email}
            pendingChange={
              pendingChange
                ? {
                    newFirm: pendingChange.newFirm,
                    newEmail: pendingChange.newEmail,
                    emailConfirmed: pendingChange.emailConfirmed,
                  }
                : null
            }
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
          Member directory
        </h2>
        <div className="mt-6">
          <DirectoryVisibilityForm hideFromDirectory={member.hideFromDirectory} />
        </div>
      </section>

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
