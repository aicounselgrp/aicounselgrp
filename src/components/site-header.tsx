import Link from "next/link";
import Image from "next/image";
import { Container } from "./container";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "/insights", label: "Insights" },
  { href: "/members", label: "Members" },
  { href: "/join", label: "Join" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt={siteConfig.shortName}
            width={40}
            height={40}
            className="rounded-md"
            priority
          />
          <span className="font-serif text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {siteConfig.shortName}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
