"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function JoinForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-slate-200 p-6 dark:border-slate-800">
        <p className="font-medium text-slate-900 dark:text-slate-100">
          Thanks for applying.
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          We&apos;ll review your application and follow up by email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot field, hidden from real users, to deter simple bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
      />

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Fields marked <RequiredMark /> are required.
      </p>

      <Field label="Full name" name="name" required />
      <Field label="Professional email" name="email" type="email" required />
      <Field label="Firm or organization" name="firm" required />
      <Field label="Job title" name="jobTitle" required />
      <Field label="Industry" name="industry" required />

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="City" name="city" required />
        <Field label="State" name="state" />
        <Field label="Country" name="country" required />
      </div>

      <Field label="LinkedIn or website" name="link" type="url" />

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-slate-900 dark:text-slate-100"
        >
          Tell us about your AI law practice <RequiredMark />
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          name="acceptPolicies"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-700"
        />
        <span>
          I have read and accepted the <PolicyLink href="/terms">Terms of Use</PolicyLink>,{" "}
          <PolicyLink href="/privacy">Privacy Policy</PolicyLink> and{" "}
          <PolicyLink href="/antitrust">Antitrust Policy</PolicyLink>. <RequiredMark />
        </span>
      </label>

      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {status === "submitting" ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-900 dark:text-slate-100"
      >
        {label} {required && <RequiredMark />}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-red-600 dark:text-red-400">
      *
    </span>
  );
}

// Opens in a new tab so applicants don't lose what they've typed.
function PolicyLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="font-medium text-slate-900 underline hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-300"
    >
      {children}
    </Link>
  );
}
