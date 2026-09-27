import Link from "next/link";
import Image from "next/image";
import { Container } from "./container";
import { siteConfig } from "@/lib/site-config";

const navLinks = [{ href: "/join", label: "Join" }];

const BRAND_NAVY = "#1c2b42";

export function SiteHeader() {
  return (
    <header style={{ backgroundColor: BRAND_NAVY }}>
      <Container className="flex flex-col items-center gap-4 py-10">
        <Link href="/" className="transition hover:opacity-90">
          <Image
            src="/logo.png"
            alt={siteConfig.shortName}
            width={88}
            height={88}
            priority
          />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-300 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
