"use client";

import { useMemo, useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "sent" | "error";
type StatusFilter = "active" | "deactivated" | "all";

export type InviteCandidate = {
  id: string;
  name: string;
  email: string;
  firm: string;
  industry: string;
  status: "active" | "deactivated";
  state: string;
  country: string;
  alreadyInvited: boolean;
};

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function distinct(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function InviteForm({
  sendUrl,
  defaultSubject,
  defaultBody,
  members,
}: {
  sendUrl: string;
  defaultSubject: string;
  defaultBody: string;
  members: InviteCandidate[];
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [industry, setIndustry] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const countries = useMemo(() => distinct(members.map((m) => m.country)), [members]);
  const states = useMemo(() => distinct(members.map((m) => m.state)), [members]);
  const industries = useMemo(() => distinct(members.map((m) => m.industry)), [members]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (statusFilter === "all" || m.status === statusFilter) &&
        (!country || m.country === country) &&
        (!state || m.state === state) &&
        (!industry || m.industry === industry) &&
        (!q || [m.name, m.email, m.firm].some((field) => field.toLowerCase().includes(q))),
    );
  }, [members, statusFilter, country, state, industry, query]);

  const allVisibleSelected = visible.length > 0 && visible.every((m) => selectedIds.has(m.id));

  function updateSelection(next: Set<string>) {
    setSelectedIds(next);
    // Clear a stale "select at least one member" error.
    if (status === "error") {
      setStatus("idle");
      setMessage("");
    }
  }

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateSelection(next);
  }

  // Acts on the members currently shown, so the filters + "select all" can
  // pick a whole group, e.g. every active member in New York.
  function toggleAllVisible() {
    const next = new Set(selectedIds);
    for (const m of visible) {
      if (allVisibleSelected) next.delete(m.id);
      else next.add(m.id);
    }
    updateSelection(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedIds.size === 0) {
      setStatus("error");
      setMessage("Select at least one member to invite.");
      return;
    }
    setStatus("submitting");
    setMessage("");

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const res = await fetch(sendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: data.subject, body: data.body, memberIds: [...selectedIds] }),
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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div>
        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Who to invite
        </span>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          Narrow the list with the filters, then tick people individually or use &ldquo;Select
          all shown&rdquo;. Ticked members stay ticked when you change filters, so you can build
          up a list from several groups.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-600 dark:text-slate-400">
            Status
            <select
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={`mt-1 block w-full ${inputClass}`}
            >
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
              <option value="all">All</option>
            </select>
          </label>
          <label className="text-xs text-slate-600 dark:text-slate-400">
            Country
            <select
              aria-label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={`mt-1 block w-full ${inputClass}`}
            >
              <option value="">Any country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600 dark:text-slate-400">
            State
            <select
              aria-label="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={`mt-1 block w-full ${inputClass}`}
            >
              <option value="">Any state</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600 dark:text-slate-400">
            Industry
            <select
              aria-label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={`mt-1 block w-full ${inputClass}`}
            >
              <option value="">Any industry</option>
              {industries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email or company"
            aria-label="Search members"
            className={`w-full max-w-xs ${inputClass}`}
          />
          <span className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span data-testid="selected-count">{selectedIds.size} selected</span>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => updateSelection(new Set())}
                className="text-slate-900 underline dark:text-slate-100"
              >
                Clear
              </button>
            )}
          </span>
        </div>

        <div className="mt-3 max-h-96 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800">
          <label className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              disabled={visible.length === 0}
            />
            Select all {visible.length} shown
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
                  {m.status === "deactivated" && (
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Deactivated
                    </span>
                  )}
                  {m.alreadyInvited && (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Already invited
                    </span>
                  )}
                  <span className="block text-slate-500 dark:text-slate-400">
                    {[m.email, m.firm, m.industry, [m.state, m.country].filter(Boolean).join(", ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
      </div>

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
          className={`mt-2 w-full ${inputClass}`}
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
          className={`mt-2 w-full ${inputClass}`}
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
        {status === "submitting"
          ? "Sending..."
          : `Send invite to ${selectedIds.size} member${selectedIds.size === 1 ? "" : "s"}`}
      </button>
    </form>
  );
}
