import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { formatInsightDate, getAllInsights } from "@/lib/insights";

export const metadata: Metadata = {
  title: "Insights",
};

export default function InsightsPage() {
  const insights = getAllInsights();

  return (
    <Container className="py-16">
      <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
        Insights
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
        Notes and analysis from members on the legal issues shaping AI
        practice.
      </p>

      <div className="mt-10 divide-y divide-slate-200 dark:divide-slate-800">
        {insights.map((insight) => (
          <Link
            key={insight.slug}
            href={`/insights/${insight.slug}`}
            className="group block py-8 first:pt-0"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">
              {formatInsightDate(insight.date)} &middot; {insight.author}
            </p>
            <h2 className="mt-2 font-serif text-xl font-semibold text-slate-900 group-hover:underline dark:text-slate-100">
              {insight.title}
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {insight.summary}
            </p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
