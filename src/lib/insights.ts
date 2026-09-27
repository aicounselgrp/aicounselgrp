import fs from "fs";
import path from "path";
import matter from "gray-matter";

const INSIGHTS_DIR = path.join(process.cwd(), "src/content/insights");

export type InsightFrontmatter = {
  title: string;
  summary: string;
  date: string;
  author: string;
};

export type Insight = InsightFrontmatter & {
  slug: string;
  content: string;
};

export function getAllInsights(): Insight[] {
  const files = fs.readdirSync(INSIGHTS_DIR).filter((file) => file.endsWith(".mdx"));

  const insights = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(INSIGHTS_DIR, file), "utf8");
    const { data, content } = matter(raw);

    return {
      slug,
      content,
      ...(data as InsightFrontmatter),
    };
  });

  return insights.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getInsightBySlug(slug: string): Insight | undefined {
  return getAllInsights().find((insight) => insight.slug === slug);
}

// "2026-08-14" parses as UTC midnight; formatting it in a negative-offset
// timezone with `new Date(...)` shows the day before. Parse as local instead.
export function formatInsightDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
