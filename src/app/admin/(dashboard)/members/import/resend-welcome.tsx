"use client";

import { useState } from "react";
import type { WelcomeCandidate } from "@/lib/members";

type Outcome = { sent: number; failed: string[] } | { error: string } | null;

export function ResendWelcome({ members }: { members: WelcomeCandidate[] }) {
  // Everyone starts ticked; untick anyone you know already received it.
  const [selected, setSelected] = useState<Set<string>>(() => new Set(members.map((m) => m.id)));
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  if (members.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Nobody to send to — every directly-added member has already set a password.
      </p>
    );
  }

  const allSelected = selected.size === members.length;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function send() {
    if (selected.size === 0) {
      setOutcome({ error: "Select at least one member." });
      return;
    }
    if (!window.confirm(`Send the welcome email to ${selected.size} member(s)?`)) return;

    setSending(true);
    setOutcome(null);
    try {
      const res = await fetch("/api/admin/members/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: [...selected] }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setOutcome({ sent: body.sent, failed: body.failed });
    } catch (err) {
      setOutcome({ error: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() =>
              setSelected(allSelected ? new Set() : new Set(members.map((m) => m.id)))
            }
          />
          Select all
        </label>
        <span className="text-slate-600 dark:text-slate-400">
          {selected.size} of {members.length} selected
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800">
        {members.map((m) => (
          <label
            key={m.id}
            className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 dark:border-slate-800"
          >
            <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
            <span className="text-slate-900 dark:text-slate-100">{m.name}</span>
            <span className="text-slate-500 dark:text-slate-400">{m.email}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={send}
        disabled={sending}
        className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {sending ? `Sending to ${selected.size}… (this can take a minute)` : "Send welcome email"}
      </button>

      {outcome && "error" in outcome && (
        <p className="text-sm text-red-600 dark:text-red-400">{outcome.error}</p>
      )}
      {outcome && "sent" in outcome && (
        <div className="text-sm">
          <p className="text-emerald-700 dark:text-emerald-400">Sent to {outcome.sent}.</p>
          {outcome.failed.length > 0 && (
            <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              <p>
                Couldn&apos;t send to these — check resend.com &rarr; Emails for the reason (for
                example, a daily sending limit):
              </p>
              <ul className="mt-1 list-disc pl-5">
                {outcome.failed.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
