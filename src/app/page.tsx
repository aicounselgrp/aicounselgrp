import Link from "next/link";
import { Container } from "@/components/container";
import { formatInsightDate, getAllInsights } from "@/lib/insights";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  const latestInsights = getAllInsights().slice(0, 2);

  return (
    <>
      <section className="border-b border-slate-200 py-20 dark:border-slate-800">
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

      <section className="py-16">
        <Container>
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Latest insights
            </h2>
            <Link
              href="/insights"
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              View all
            </Link>
          </div>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {latestInsights.map((insight) => (
              <Link
                key={insight.slug}
                href={`/insights/${insight.slug}`}
                className="group block rounded-lg border border-slate-200 p-6 transition hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  {formatInsightDate(insight.date)}
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900 group-hover:underline dark:text-slate-100">
                  {insight.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {insight.summary}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
