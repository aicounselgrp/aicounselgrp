"use client";

import { useActionState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import { changePasswordAction, updateBackupEmailAction, type FormState } from "./actions";

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
          defaultValue={backupEmail}
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
