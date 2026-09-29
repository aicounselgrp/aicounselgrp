import type { Metadata } from "next";
import { EmailForm } from "./email-form";

export const metadata: Metadata = {
  title: "Send Email",
};

export default async function EmailPage(props: PageProps<"/admin/email">) {
  const searchParams = await props.searchParams;
  const defaultTo = typeof searchParams.to === "string" ? searchParams.to : "";

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
        Send email
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        Sends one email per recipient — nobody sees the other addresses on
        the send.
      </p>

      <div className="mt-8">
        <EmailForm defaultTo={defaultTo} />
      </div>
    </>
  );
}
