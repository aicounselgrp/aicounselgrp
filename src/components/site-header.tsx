import Link from "next/link";
import Image from "next/image";
import { Container } from "./container";
import { siteConfig } from "@/lib/site-config";

const navLinks = [{ href: "/join", label: "Join" }];

// Matches the logo artwork's near-black background so the image blends in.
const BRAND_BG = "#00030b";

export function SiteHeader() {
  return (
    <header style={{ backgroundColor: BRAND_BG }}>
      <Container className="flex flex-col items-center gap-4 py-6">
        <Link href="/" className="transition hover:opacity-90">
          <Image
            src="/logo.png"
            alt={siteConfig.shortName}
            width={200}
            height={200}
            priority
            // Feather the square edges so the artwork fades into the banner.
            style={{
              maskImage:
                "linear-gradient(to right, transparent, #000 15%, #000 85%, transparent), linear-gradient(to bottom, transparent, #000 12%, #000 90%, transparent)",
              maskComposite: "intersect",
            }}
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
