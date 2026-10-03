import "server-only";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { splitFullName } from "@/lib/names";

export type Member = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  firm: string;
  industry: string;
  link: string;
  bio: string;
  focus: string[];
  location: string;
  status: "active" | "deactivated";
  // Personal address the member can also log in with / receive links at.
  backupEmail: string;
  hasPassword: boolean;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    name: row.name as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    title: row.title as string,
    firm: row.firm as string,
    industry: row.industry as string,
    link: row.link as string,
    bio: row.bio as string,
    focus: row.focus as string[],
    location: row.location as string,
    status: row.status as Member["status"],
    backupEmail: (row.backup_email as string | undefined) ?? "",
    hasPassword: row.password_hash != null,
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

// Matches a member's work email or personal backup email, so either can be
// used to log in. Active members only.
export async function findActiveMemberByLoginEmail(email: string): Promise<Member | undefined> {
  const rows = await sql`
    select * from members
    where status = 'active'
      and (lower(email) = lower(${email.trim()})
        or (backup_email <> '' and lower(backup_email) = lower(${email.trim()})))
    limit 1
  `;
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function findActiveMemberById(id: string): Promise<Member | undefined> {
  const rows = await sql`select * from members where id = ${id} and status = 'active' limit 1`;
  return rows[0] ? mapRow(rows[0]) : undefined;
}

const SALT_ROUNDS = 12;

export async function setMemberPassword(id: string, password: string) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  await sql`update members set password_hash = ${hash} where id = ${id}`;
}

// Verifies a login (work or backup email + password) and returns the member.
export async function verifyMemberPassword(
  email: string,
  password: string,
): Promise<Member | undefined> {
  const rows = await sql`
    select * from members
    where status = 'active'
      and (lower(email) = lower(${email.trim()})
        or (backup_email <> '' and lower(backup_email) = lower(${email.trim()})))
    limit 1
  `;
  const row = rows[0];
  if (!row || !row.password_hash) return undefined;
  const matches = await bcrypt.compare(password, row.password_hash as string);
  return matches ? mapRow(row) : undefined;
}

export async function checkMemberPassword(id: string, password: string): Promise<boolean> {
  const rows = await sql`select password_hash from members where id = ${id} limit 1`;
  const hash = rows[0]?.password_hash as string | null | undefined;
  return hash ? bcrypt.compare(password, hash) : false;
}

// Returns an error message, or null on success. A backup email can't be the
// member's own work email or any other member's work/backup email, so every
// login address maps to exactly one member.
export async function setMemberBackupEmail(id: string, backupEmail: string): Promise<string | null> {
  const value = backupEmail.trim().toLowerCase();
  if (value) {
    const clash = await sql`
      select id from members
      where (lower(email) = ${value} or lower(backup_email) = ${value}) and id <> ${id}
      limit 1
    `;
    if (clash.length > 0) return "That email is already in use by another member.";
    const own = await sql`select 1 from members where id = ${id} and lower(email) = ${value}`;
    if (own.length > 0) return "Your backup email must be different from your work email.";
  }
  await sql`update members set backup_email = ${value} where id = ${id}`;
  return null;
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

    const { firstName, lastName } = splitFullName(input.name);
    const inserted = await sql`
      insert into members (name, first_name, last_name, email, title, firm, industry, location, link, bio)
      values (
        ${input.name.trim()}, ${firstName}, ${lastName}, ${email}, ${input.title?.trim() ?? ""}, ${input.firm?.trim() ?? ""},
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
