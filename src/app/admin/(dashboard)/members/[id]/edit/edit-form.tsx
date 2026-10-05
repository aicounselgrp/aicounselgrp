"use client";

import { useActionState } from "react";
import { INDUSTRIES } from "@/lib/industries";
import { adminEditMemberAction } from "./actions";

export type MemberFormValues = {
  firstName: string;
  lastName: string;
  title: string;
  firm: string;
  industry: string;
  location: string;
  link: string;
  email: string;
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "block text-sm font-medium text-slate-900 dark:text-slate-100";

export function AdminMemberEditForm({ id, saved }: { id: string; saved: MemberFormValues }) {
  const [state, action, pending] = useActionState(adminEditMemberAction, null);
  // After an error, keep what the admin typed rather than the saved values.
  const values = (state && !state.ok && (state.values as MemberFormValues | undefined)) || saved;
  const industries =
    values.industry && !(INDUSTRIES as readonly string[]).includes(values.industry)
      ? [values.industry, ...INDUSTRIES]
      : INDUSTRIES;

  const text = (name: keyof MemberFormValues, label: string, extra: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input id={name} name={name} defaultValue={values[name]} className={inputClass} {...extra} />
    </div>
  );

  return (
    // Keyed on the saved values so the fields refresh after a successful save.
    <form key={JSON.stringify(saved)} action={action} className="max-w-xl space-y-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-2">
        {text("firstName", "First name", { required: true })}
        {text("lastName", "Last name", { required: true })}
      </div>
      {text("title", "Job title")}
      {text("firm", "Company")}
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
      {text("location", "Location", { placeholder: "City, State, Country" })}
      {text("link", "LinkedIn or website", { type: "url", placeholder: "https://" })}
      {text("email", "Work email", { type: "email", required: true })}

      <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" name="notify" defaultChecked className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Email the member a note listing what changed
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-500">
            If you change their work email, the note goes to both the old and new address.
          </span>
        </span>
      </label>

      {state && (
        <p
          className={
            state.ok
              ? "text-sm text-emerald-700 dark:text-emerald-400"
              : "text-sm text-red-600 dark:text-red-400"
          }
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
