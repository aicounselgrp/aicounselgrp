import type { Metadata } from "next";
import { Container } from "@/components/container";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set Admin Password",
};

export default async function SetPasswordPage(props: PageProps<"/admin/set-password">) {
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
              Choose a password for your admin account. This link expires in 1 hour.
            </p>
            <div className="mt-8">
              <SetPasswordForm token={token} />
            </div>
          </>
        ) : (
          <p className="mt-3 text-red-600 dark:text-red-400">
            This link is missing its token. Request a new one from the{" "}
            <a href="/admin/login" className="underline">
              admin login page
            </a>
            .
          </p>
        )}
      </div>
    </Container>
  );
}
