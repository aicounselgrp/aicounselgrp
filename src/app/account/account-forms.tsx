"use client";

import { useActionState } from "react";
import { INDUSTRIES } from "@/lib/industries";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import {
  cancelChangeRequestAction,
  changePasswordAction,
  requestChangeAction,
  updateProfileAction,
  updateBackupEmailAction,
  updateDirectoryVisibilityAction,
  type FormState,
} from "./actions";

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "block text-sm font-medium text-slate-900 dark:text-slate-100";
const buttonClass =
  "rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200";

function Result({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <p
      className={
        state.ok
          ? "text-sm text-emerald-700 dark:text-emerald-400"
          : "text-sm text-red-600 dark:text-red-400"
      }
    >
      {state.message}
    </p>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, null);

  return (
    <form action={action} className="max-w-md space-y-4">
      {hasPassword && (
        <div>
          <label htmlFor="current" className={labelClass}>
            Current password
          </label>
          <input id="current" name="current" type="password" required autoComplete="current-password" className={inputClass} />
        </div>
      )}
      <div>
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <Result state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving..." : hasPassword ? "Change password" : "Set password"}
      </button>
    </form>
  );
}

export function BackupEmailForm({ backupEmail }: { backupEmail: string }) {
  const [state, action, pending] = useActionState(updateBackupEmailAction, null);

  return (
    <form action={action} className="max-w-md space-y-4">
      <div>
        <label htmlFor="backupEmail" className={labelClass}>
          Personal backup email
        </label>
        <input
          id="backupEmail"
          name="backupEmail"
          type="email"
          defaultValue={state && !state.ok ? (state.values?.backupEmail ?? backupEmail) : backupEmail}
          placeholder="you@gmail.com"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          Optional. You can log in with it and receive login or password links there — useful if
          you lose access to your work email. Leave blank to remove it.
        </p>
      </div>
      <Result state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving..." : "Save backup email"}
      </button>
    </form>
  );
}

export function DirectoryVisibilityForm({ hideFromDirectory }: { hideFromDirectory: boolean }) {
  const [state, action, pending] = useActionState(updateDirectoryVisibilityAction, null);

  return (
    <form action={action} className="max-w-md space-y-4">
      <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          name="showInDirectory"
          defaultChecked={!hideFromDirectory}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-700"
        />
        <span>
          Show me in the member directory
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-500">
            The directory is only visible to signed-in members. If you turn this off, other
            members won&apos;t see you there — you&apos;ll still receive member emails and event
            invitations.
          </span>
        </span>
      </label>
      <Result state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

export type ProfileValues = {
  firstName: string;
  lastName: string;
  title: string;
  industry: string;
  location: string;
  link: string;
};

export function ProfileForm({ values: saved }: { values: ProfileValues }) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  // After an error, keep what the member typed rather than the saved values.
  const values = (state && !state.ok && (state.values as ProfileValues | undefined)) || saved;
  // Keep a legacy/imported industry selectable even if it isn't in the list.
  const industries =
    values.industry && !(INDUSTRIES as readonly string[]).includes(values.industry)
      ? [values.industry, ...INDUSTRIES]
      : INDUSTRIES;

  return (
    <form action={action} className="max-w-md space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            First name
          </label>
          <input id="firstName" name="firstName" required defaultValue={values.firstName} className={inputClass} />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last name
          </label>
          <input id="lastName" name="lastName" required defaultValue={values.lastName} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="title" className={labelClass}>
          Job title
        </label>
        <input id="title" name="title" defaultValue={values.title} className={inputClass} />
      </div>
      <div>
        <label htmlFor="industry" className={labelClass}>
          Industry
        </label>
        <select id="industry" name="industry" defaultValue={values.industry} className={`${inputClass} bg-white`}>
          <option value="">—</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="location" className={labelClass}>
          Location
        </label>
        <input
          id="location"
          name="location"
          defaultValue={values.location}
          placeholder="City, State, Country"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="link" className={labelClass}>
          LinkedIn or website
        </label>
        <input id="link" name="link" type="url" defaultValue={values.link} placeholder="https://" className={inputClass} />
      </div>
      <Result state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

export type PendingChange = {
  newFirm: string | null;
  newEmail: string | null;
  emailConfirmed: boolean;
};

export function CompanyEmailForm({
  firm,
  email,
  pendingChange,
}: {
  firm: string;
  email: string;
  pendingChange: PendingChange | null;
}) {
  const [state, action, pending] = useActionState(requestChangeAction, null);
  const draft = state && !state.ok ? state.values : undefined;

  return (
    <div className="max-w-md space-y-4">
      {pendingChange && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Waiting for admin approval</p>
          <ul className="mt-1 list-disc pl-5">
            {pendingChange.newFirm && <li>Company → {pendingChange.newFirm}</li>}
            {pendingChange.newEmail && (
              <li>
                Work email → {pendingChange.newEmail}{" "}
                {pendingChange.emailConfirmed
                  ? "(confirmed)"
                  : "(check that inbox and click the confirmation link)"}
              </li>
            )}
          </ul>
          <form action={cancelChangeRequestAction} className="mt-2">
            <button type="submit" className="underline">
              Cancel this request
            </button>
          </form>
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="firm" className={labelClass}>
            Company or organization
          </label>
          <input id="firm" name="firm" required defaultValue={draft?.firm ?? firm} className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Work email
          </label>
          <input id="email" name="email" type="email" required defaultValue={draft?.email ?? email} className={inputClass} />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Shown in the directory and used to sign in. A new address must be confirmed by you,
            then approved by an admin.
          </p>
        </div>
        <Result state={state} />
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Submitting..." : pendingChange ? "Replace pending request" : "Submit for approval"}
        </button>
      </form>
    </div>
  );
}
