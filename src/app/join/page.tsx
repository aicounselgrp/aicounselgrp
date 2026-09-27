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
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Membership is open to practicing lawyers with a meaningful focus on
          artificial intelligence law. Applications are reviewed by current
          members.
        </p>

        <div className="mt-10">
          <JoinForm />
        </div>
      </div>
    </Container>
  );
}
