import Link from "next/link";
import { Container } from "@/components/container";
import { verifyAdminSession } from "@/lib/dal";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/email", label: "Email" },
  { href: "/admin/events", label: "Events" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await verifyAdminSession();

  return (
    <Container className="py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Admin
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            Signed in as {viewer.email}
          </p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="whitespace-nowrap text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Log out
          </button>
        </form>
      </div>

      <nav className="mt-8 flex gap-6 border-b border-slate-200 text-sm dark:border-slate-800">
        {adminNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="pb-3 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-10">{children}</div>
    </Container>
  );
}
