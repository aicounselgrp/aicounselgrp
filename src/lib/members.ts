import "server-only";
import { sql } from "@/lib/db";

export type Member = {
  id: string;
  name: string;
  email: string;
  title: string;
  firm: string;
  industry: string;
  link: string;
  bio: string;
  focus: string[];
  location: string;
  status: "active" | "deactivated";
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    title: row.title as string,
    firm: row.firm as string,
    industry: row.industry as string,
    link: row.link as string,
    bio: row.bio as string,
    focus: row.focus as string[],
    location: row.location as string,
    status: row.status as Member["status"],
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function getActiveMembers(): Promise<Member[]> {
  const rows = await sql`
    select * from members where status = 'active' order by name asc
  `;
  return rows.map(mapRow);
}

export async function getAllMembers(): Promise<Member[]> {
  const rows = await sql`select * from members order by name asc`;
  return rows.map(mapRow);
}

// Only returns active members — used for login/session checks, so a
// deactivated member is immediately locked out.
export async function findActiveMemberByEmail(email: string): Promise<Member | undefined> {
  const rows = await sql`
    select * from members
    where lower(email) = lower(${email.trim()}) and status = 'active'
    limit 1
  `;
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function setMemberStatus(id: string, status: Member["status"]) {
  await sql`update members set status = ${status} where id = ${id}`;
}

export type BulkMemberInput = {
  name: string;
  email: string;
  title?: string;
  firm?: string;
  industry?: string;
  location?: string;
  link?: string;
  bio?: string;
  // The source row this came from (e.g. CSV line number), for accurate
  // skip-reporting even when earlier rows were filtered out before this
  // is called — an index into `inputs` alone can't reflect that.
  row: number;
};

export type BulkImportResult = {
  created: string[]; // "Name <email>"
  skipped: { row: number; email: string; reason: string }[];
};

// Inserts new members from a bulk (e.g. CSV) source. Never overwrites an
// existing member — an email that already exists is reported as skipped
// rather than silently changing someone's on-file details.
export async function bulkCreateMembers(inputs: BulkMemberInput[]): Promise<BulkImportResult> {
  const result: BulkImportResult = { created: [], skipped: [] };
  const seenEmails = new Set<string>();

  for (const input of inputs) {
    const row = input.row;
    const email = input.email.trim().toLowerCase();

    if (seenEmails.has(email)) {
      result.skipped.push({ row, email, reason: "Duplicate email earlier in this file" });
      continue;
    }
    seenEmails.add(email);

    const inserted = await sql`
      insert into members (name, email, title, firm, industry, location, link, bio)
      values (
        ${input.name.trim()}, ${email}, ${input.title?.trim() ?? ""}, ${input.firm?.trim() ?? ""},
        ${input.industry?.trim() ?? ""}, ${input.location?.trim() ?? ""}, ${input.link?.trim() ?? ""},
        ${input.bio?.trim() ?? ""}
      )
      on conflict (email) do nothing
      returning name, email
    `;

    if (inserted[0]) {
      result.created.push(`${inserted[0].name} <${inserted[0].email}>`);
    } else {
      result.skipped.push({ row, email, reason: "A member with this email already exists" });
    }
  }

  return result;
}
