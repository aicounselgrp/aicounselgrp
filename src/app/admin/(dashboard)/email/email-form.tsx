"use client";

import { useMemo, useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "sent" | "error";
type Audience = "all" | "selected" | "specific";

export type PickableMember = { id: string; name: string; email: string; firm: string };

export function EmailForm({
  defaultTo,
  members,
}: {
  defaultTo: string;
  members: PickableMember[];
}) {
  const [audience, setAudience] = useState<Audience>(defaultTo ? "specific" : "all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (audience === "selected" && selectedIds.size === 0) {
      setStatus("error");
      setMessage("Select at least one member.");
      return;
    }
    setStatus("submitting");
    setMessage("");

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, audience, memberIds: [...selectedIds] }),
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
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
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
              checked={audience === "selected"}
              onChange={() => setAudience("selected")}
            />
            Selected members
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

      {audience === "selected" && (
        <MemberPicker
          members={members}
          selectedIds={selectedIds}
          onChange={(ids) => {
            setSelectedIds(ids);
            // Clear a stale "select at least one member" error.
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
        />
      )}

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

function MemberPicker({
  members,
  selectedIds,
  onChange,
}: {
  members: PickableMember[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.name, m.email, m.firm].some((field) => field.toLowerCase().includes(q)),
    );
  }, [members, query]);

  const allVisibleSelected = visible.length > 0 && visible.every((m) => selectedIds.has(m.id));

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  // Acts on the members currently shown, so search + "select all" can pick
  // e.g. everyone at one firm.
  function toggleAllVisible() {
    const next = new Set(selectedIds);
    for (const m of visible) {
      if (allVisibleSelected) next.delete(m.id);
      else next.add(m.id);
    }
    onChange(next);
  }

  if (members.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">There are no active members yet.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email or firm"
          aria-label="Search members"
          className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {selectedIds.size} of {members.length} selected
        </span>
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800">
        <label className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            disabled={visible.length === 0}
          />
          {query.trim() ? `Select all ${visible.length} shown` : "Select all"}
        </label>
        {visible.length === 0 ? (
          <p className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">No members match.</p>
        ) : (
          visible.map((m) => (
            <label
              key={m.id}
              className="flex items-start gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 dark:border-slate-800"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={selectedIds.has(m.id)}
                onChange={() => toggle(m.id)}
              />
              <span>
                <span className="text-slate-900 dark:text-slate-100">{m.name}</span>
                <span className="block text-slate-500 dark:text-slate-400">
                  {[m.email, m.firm].filter(Boolean).join(" · ")}
                </span>
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
