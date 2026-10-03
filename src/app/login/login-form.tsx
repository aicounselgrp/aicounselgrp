"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "submitting" | "error";
type LinkPurpose = "login" | "set-password";
type LinkStatus = { purpose: LinkPurpose; state: "sending" | "sent" } | { state: "error"; message: string } | null;

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const linkButtonClass =
  "text-left text-slate-500 underline hover:text-slate-900 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-100";

export function LoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [linkStatus, setLinkStatus] = useState<LinkStatus>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong.");
      }

      router.push("/members");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  // Backup options: email a one-time login link, or a link to set/reset the
  // password. Both use whatever is in the Email field.
  async function requestLink(purpose: LinkPurpose) {
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value.trim();
    if (!email) {
      setLinkStatus({ state: "error", message: "Enter your email above first, then click the link." });
      return;
    }

    setLinkStatus({ purpose, state: "sending" });
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      if (!res.ok) throw new Error();
      setLinkStatus({ purpose, state: "sent" });
    } catch {
      setLinkStatus({ state: "error", message: "Something went wrong. Please try again." });
    }
  }

  const sending = linkStatus?.state === "sending";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className={inputClass} />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          Your work email or your personal backup email.
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      {status === "error" && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {status === "submitting" ? "Signing in..." : "Sign in"}
      </button>

      <div className="space-y-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
        {linkStatus?.state === "sent" ? (
          <p className="text-slate-600 dark:text-slate-400">
            If that address belongs to a member, we&apos;ve emailed{" "}
            {linkStatus.purpose === "login"
              ? "a login link. It expires in 15 minutes."
              : "a link to set your password. It expires in 1 hour."}{" "}
            Check your spam folder if it doesn&apos;t arrive in a few minutes.
          </p>
        ) : (
          <>
            <button type="button" onClick={() => requestLink("login")} disabled={sending} className={linkButtonClass}>
              {linkStatus?.state === "sending" && linkStatus.purpose === "login"
                ? "Sending..."
                : "Email me a login link instead"}
            </button>
            <br />
            <button
              type="button"
              onClick={() => requestLink("set-password")}
              disabled={sending}
              className={linkButtonClass}
            >
              {linkStatus?.state === "sending" && linkStatus.purpose === "set-password"
                ? "Sending..."
                : "Forgot your password, or first time here? Email me a link to set one"}
            </button>
            {linkStatus?.state === "error" && (
              <p className="text-red-600 dark:text-red-400">{linkStatus.message}</p>
            )}
          </>
        )}
      </div>
    </form>
  );
}
