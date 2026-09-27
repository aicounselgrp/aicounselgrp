import type { Metadata } from "next";
import { Container } from "@/components/container";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "Join",
};

export default function JoinPage() {
  return (
    <Container className="py-16">
      <div className="max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Apply to join
        </h1>
        <p className="mt-4 rounded-md border-l-4 border-slate-900 bg-slate-50 px-4 py-3 text-slate-700 dark:border-slate-300 dark:bg-slate-900 dark:text-slate-300">
          Please note membership is limited to in-house lawyers who cover
          artificial intelligence. Your application will be reviewed by our
          team and you will be contacted if your membership is approved.
        </p>

        <div className="mt-10">
          <JoinForm />
        </div>
      </div>
    </Container>
  );
}
