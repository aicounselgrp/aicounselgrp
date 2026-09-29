"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "sent" | "error";
type Audience = "all" | "specific";

export function EmailForm({ defaultTo }: { defaultTo: string }) {
  const [audience, setAudience] = useState<Audience>(defaultTo ? "specific" : "all");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, audience }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error ?? "Something went wrong.");

      setStatus("sent");
      setMessage(
        result.failed > 0
          ? `Sent to ${result.sent} recipient(s), ${result.failed} failed — check server logs.`
          : `Sent to ${result.sent} recipient(s).`,
      );
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Send to
        </span>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="audience-select"
              checked={audience === "all"}
              onChange={() => setAudience("all")}
            />
            All active members
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="audience-select"
              checked={audience === "specific"}
              onChange={() => setAudience("specific")}
            />
            A specific email address
          </label>
        </div>
      </div>

      {audience === "specific" && (
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            Recipient email
          </label>
          <input
            id="to"
            name="to"
            type="email"
            required={audience === "specific"}
            defaultValue={defaultTo}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      )}

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Message
        </label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          {"{{name}}"} is replaced with each recipient&apos;s name.
        </p>
        <textarea
          id="body"
          name="body"
          rows={10}
          required
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {message && (
        <p
          className={
            status === "error"
              ? "text-sm text-red-600 dark:text-red-400"
              : "text-sm text-emerald-700 dark:text-emerald-400"
          }
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {status === "submitting" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
