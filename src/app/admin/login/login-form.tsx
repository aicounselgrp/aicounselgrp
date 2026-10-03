"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "submitting" | "error";
type RequestStatus = "idle" | "sending" | "sent" | "failed";

export function AdminLoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [requestError, setRequestError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleRequestSetupLink() {
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value.trim();
    if (!email) {
      setRequestStatus("failed");
      setRequestError("Enter your email above first, then click this link.");
      return;
    }

    setRequestStatus("sending");
    setRequestError("");
    try {
      const res = await fetch("/api/admin/set-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      setRequestStatus("sent");
    } catch (err) {
      setRequestStatus("failed");
      setRequestError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
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
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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

      <div className="pt-2 text-sm">
        {requestStatus === "sent" ? (
          <p className="text-slate-600 dark:text-slate-400">
            If that email is an admin account, we&apos;ve sent a link to set your password. It
            expires in 1 hour — check your spam folder if it doesn&apos;t arrive in a few minutes.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRequestSetupLink}
              disabled={requestStatus === "sending"}
              className="text-slate-500 underline hover:text-slate-900 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {requestStatus === "sending"
                ? "Sending..."
                : "Forgot your password, or first time here? Email me a link"}
            </button>
            {requestStatus === "failed" && (
              <p className="mt-2 text-red-600 dark:text-red-400">{requestError}</p>
            )}
          </>
        )}
      </div>
    </form>
  );
}
