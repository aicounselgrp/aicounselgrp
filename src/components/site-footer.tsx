import { Container } from "./container";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <Container className="flex flex-col gap-2 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
        <a
          href={`mailto:${siteConfig.contactEmail}`}
          className="hover:text-slate-900 dark:hover:text-slate-100"
        >
          {siteConfig.contactEmail}
        </a>
      </Container>
    </footer>
  );
}
