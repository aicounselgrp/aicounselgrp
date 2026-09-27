import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "./container";
import { getLegalDocument, type LegalSlug } from "@/lib/legal";

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const { title, content } = getLegalDocument(slug);

  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <div className="prose prose-slate mt-8 dark:prose-invert">
          {/* Plain Markdown (not MDX) so pasted policy text never breaks the build. */}
          <MDXRemote source={content} options={{ mdxOptions: { format: "md" } }} />
        </div>
      </article>
    </Container>
  );
}
