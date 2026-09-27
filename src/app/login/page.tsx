import type { Metadata } from "next";
import { Container } from "@/components/container";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Member Login",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const hasError = searchParams.error === "invalid-or-expired-link";

  return (
    <Container className="py-16">
      <div className="max-w-md">
        <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Member login
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          The member directory is restricted to current members. Enter your
          member email and we&apos;ll send you a login link.
        </p>

        {hasError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            That login link is invalid or has expired. Please request a new
            one.
          </p>
        )}

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </Container>
  );
}
