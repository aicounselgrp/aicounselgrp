import type { Metadata } from "next";
import { Container } from "@/components/container";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default function AdminLoginPage() {
  return (
    <Container className="py-16">
      <div className="max-w-md">
        <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Admin login
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Sign in with your admin email and password.
        </p>

        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </Container>
  );
}
