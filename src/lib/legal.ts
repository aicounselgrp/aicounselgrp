import fs from "fs";
import path from "path";
import matter from "gray-matter";

const LEGAL_DIR = path.join(process.cwd(), "src/content/legal");

export type LegalSlug = "terms" | "privacy" | "antitrust";

export type LegalDocument = {
  title: string;
  content: string;
};

export function getLegalDocument(slug: LegalSlug): LegalDocument {
  const raw = fs.readFileSync(path.join(LEGAL_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  return { title: data.title as string, content };
}
