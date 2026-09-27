import Link from "next/link";
import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <section className="py-20">
      <Container>
        <h1 className="max-w-2xl font-serif text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100">
          {siteConfig.tagline}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400">
          {siteConfig.description}
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/join"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Apply to join
          </Link>
          <Link
            href="/members"
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500"
          >
            Meet the members
          </Link>
        </div>
      </Container>
    </section>
  );
}
