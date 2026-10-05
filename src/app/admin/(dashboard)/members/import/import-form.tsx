"use client";

import { useRef, useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "done" | "error";
type Result = {
  created: string[];
  welcomed: number | null;
  welcomeFailed: string[];
  skipped: { row: number; reason: string }[];
};

export function ImportForm() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [sendWelcome, setSendWelcome] = useState(true);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setStatus("error");
      setError("Choose a CSV file first.");
      return;
    }

    setStatus("submitting");
    setError("");
    setResult(null);

    try {
      const csv = await file.text();
      const res = await fetch("/api/admin/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, sendWelcome }),
      });
      const body = await res.json();

      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");

      setResult({
        created: body.created,
        welcomed: body.welcomed,
        welcomeFailed: body.welcomeFailed ?? [],
        skipped: body.skipped,
      });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="csv" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            CSV file
          </label>
          <input
            ref={fileInput}
            id="csv"
            name="csv"
            type="file"
            accept=".csv,text/csv"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700 dark:text-slate-400 dark:file:bg-white dark:file:text-slate-900 dark:hover:file:bg-slate-200"
          />
          {fileName && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{fileName}</p>
          )}
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={sendWelcome}
            onChange={(e) => setSendWelcome(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            Email each new member a welcome message explaining how to sign in
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-500">
              Only people actually added get it — skipped rows and existing members don&apos;t.
            </span>
          </span>
        </label>

        {status === "error" && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {status === "submitting" ? "Importing..." : "Import"}
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Added ({result.created.length})
            </h3>
            {result.welcomed !== null && result.created.length > 0 && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Welcome email sent to {result.welcomed} of {result.created.length}.
              </p>
            )}
            {result.welcomeFailed.length > 0 && (
              <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                <p>
                  The welcome email couldn&apos;t be sent to these members (they were still
                  added). You can email them from Admin &rarr; Email &rarr; Selected members:
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {result.welcomeFailed.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.created.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">Nobody new.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {result.created.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </div>

          {result.skipped.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Skipped ({result.skipped.length})
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {result.skipped.map((s) => (
                  <li key={s.row}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
