import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { MemberSetPasswordForm } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set Your Password",
};

export default async function MemberSetPasswordPage(props: PageProps<"/set-password">) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : null;

  return (
    <Container className="py-16">
      <div className="max-w-md">
        <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Set your password
        </h1>

        {token ? (
          <>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Choose a password for your member account. This link expires in 1 hour.
            </p>
            <div className="mt-8">
              <MemberSetPasswordForm token={token} />
            </div>
          </>
        ) : (
          <p className="mt-3 text-red-600 dark:text-red-400">
            This link is missing its token. Request a new one from the{" "}
            <Link href="/login" className="underline">
              login page
            </Link>
            .
          </p>
        )}
      </div>
    </Container>
  );
}
