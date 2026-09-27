import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/container";
import { formatInsightDate, getAllInsights, getInsightBySlug } from "@/lib/insights";

export function generateStaticParams() {
  return getAllInsights().map((insight) => ({ slug: insight.slug }));
}

export async function generateMetadata(props: PageProps<"/insights/[slug]">) {
  const { slug } = await props.params;
  const insight = getInsightBySlug(slug);
  return { title: insight?.title ?? "Insight" };
}

export default async function InsightPage(props: PageProps<"/insights/[slug]">) {
  const { slug } = await props.params;
  const insight = getInsightBySlug(slug);

  if (!insight) {
    notFound();
  }

  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">
          {formatInsightDate(insight.date)} &middot; {insight.author}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {insight.title}
        </h1>
        <div className="prose prose-slate mt-8 dark:prose-invert">
          <MDXRemote source={insight.content} />
        </div>
      </article>
    </Container>
  );
}
