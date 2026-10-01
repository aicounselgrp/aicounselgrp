"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "sent" | "error";

export function EventComposeForm({
  sendUrl,
  defaultSubject,
  defaultBody,
  submitLabel,
}: {
  sendUrl: string;
  defaultSubject: string;
  defaultBody: string;
  submitLabel: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const res = await fetch(sendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
        <label htmlFor="subject" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          defaultValue={defaultSubject}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Message
        </label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          {"{{first_name}}"}, {"{{name}}"}, {"{{rsvp_yes_url}}"}, {"{{rsvp_no_url}}"}, {"{{gcal_url}}"} and{" "}
          {"{{outlook_url}}"} are filled in per send — leave these in so people can actually
          respond and add the event to their calendar.
        </p>
        <textarea
          id="body"
          name="body"
          rows={10}
          required
          defaultValue={defaultBody}
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
        {status === "submitting" ? "Sending..." : submitLabel}
      </button>
    </form>
  );
}
