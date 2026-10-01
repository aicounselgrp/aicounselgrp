import type { Metadata } from "next";
import { getAllTemplates, type TemplateKey } from "@/lib/email-templates";
import { updateTemplateAction } from "./actions";

export const metadata: Metadata = {
  title: "Email Templates",
};

const LABELS: Record<TemplateKey, { title: string; hint: string }> = {
  approval: {
    title: "Approval email",
    hint: "Sent automatically when an application is approved.",
  },
  rejection: {
    title: "Rejection email",
    hint: "Sent automatically when an application is rejected.",
  },
};

export default async function TemplatesPage() {
  const templates = await getAllTemplates();

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        Email templates
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        Use <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{"{{first_name}}"}</code>,{" "}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{"{{name}}"}</code> (full name),{" "}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{"{{firm}}"}</code>, and (in
        the approval email only){" "}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{"{{login_url}}"}</code> —
        they&apos;re replaced with the applicant&apos;s details when the email sends.
      </p>

      <div className="mt-8 space-y-10">
        {templates.map((template) => {
          const label = LABELS[template.key];
          return (
            <form
              key={template.key}
              action={updateTemplateAction}
              className="rounded-lg border border-slate-200 p-6 dark:border-slate-800"
            >
              <input type="hidden" name="key" value={template.key} />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{label.title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{label.hint}</p>

              <div className="mt-4">
                <label
                  htmlFor={`${template.key}-subject`}
                  className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Subject
                </label>
                <input
                  id={`${template.key}-subject`}
                  name="subject"
                  type="text"
                  defaultValue={template.subject}
                  required
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor={`${template.key}-body`}
                  className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Body
                </label>
                <textarea
                  id={`${template.key}-body`}
                  name="body"
                  rows={8}
                  defaultValue={template.body}
                  required
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="mt-4 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Save
              </button>
            </form>
          );
        })}
      </div>
    </>
  );
}
