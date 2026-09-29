import "server-only";
import { sql } from "@/lib/db";

export type TemplateKey = "approval" | "rejection";

export type EmailTemplate = {
  key: TemplateKey;
  subject: string;
  body: string;
  updatedAt: string;
};

function mapRow(row: Record<string, unknown>): EmailTemplate {
  return {
    key: row.key as TemplateKey,
    subject: row.subject as string,
    body: row.body as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export async function getTemplate(key: TemplateKey): Promise<EmailTemplate | undefined> {
  const rows = await sql`select * from email_templates where key = ${key} limit 1`;
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function getAllTemplates(): Promise<EmailTemplate[]> {
  const rows = await sql`select * from email_templates order by key`;
  return rows.map(mapRow);
}

export async function setTemplate(key: TemplateKey, subject: string, body: string) {
  await sql`
    insert into email_templates (key, subject, body, updated_at)
    values (${key}, ${subject}, ${body}, now())
    on conflict (key) do update set subject = excluded.subject, body = excluded.body, updated_at = now()
  `;
}

// Replaces {{placeholder}} tokens. Unknown placeholders are left as-is
// rather than silently dropped, so a typo in the template is visible.
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match);
}
