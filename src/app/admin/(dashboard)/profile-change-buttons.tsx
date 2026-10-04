"use client";

import { useActionState } from "react";
import { decideProfileChangeAction } from "./actions";

export function ProfileChangeButtons({ id, canApprove }: { id: string; canApprove: boolean }) {
  const [error, action, pending] = useActionState(decideProfileChangeAction, null);

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending || !canApprove}
          title={canApprove ? undefined : "Waiting for the member to confirm their new email"}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500"
        >
          Reject
        </button>
      </form>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
