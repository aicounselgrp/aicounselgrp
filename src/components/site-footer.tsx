import Link from "next/link";
import { Container } from "./container";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <Container className="flex flex-col gap-2 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-100">
            Terms of Use
          </Link>
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-100">
            Privacy Policy
          </Link>
          <Link href="/antitrust" className="hover:text-slate-900 dark:hover:text-slate-100">
            Antitrust Policy
          </Link>
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="hover:text-slate-900 dark:hover:text-slate-100"
          >
            {siteConfig.contactEmail}
          </a>
        </nav>
      </Container>
    </footer>
  );
}
