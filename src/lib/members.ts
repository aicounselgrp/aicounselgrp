import "server-only";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

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
  // Opted out of the members-only directory (still an active member).
  hideFromDirectory: boolean;
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
    hideFromDirectory: Boolean(row.hide_from_directory),
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function getActiveMembers(): Promise<Member[]> {
  const rows = await sql`
    select * from members where status = 'active' order by name asc
  `;
  return rows.map(mapRow);
}

export type DirectorySort = "first" | "last" | "company" | "industry";

// Last name is the default directory order.
export function parseDirectorySort(value: unknown): DirectorySort {
  return value === "first" || value === "company" || value === "industry" ? value : "last";
}

// The member directory: active members who haven't opted out, plus the
// viewer themself (so they can see how their own card looks). Blank
// company/industry values sort last.
export async function getDirectoryMembers(
  viewerId: string,
  sort: DirectorySort = "last",
): Promise<Member[]> {
  const orderBy = {
    first: sql`lower(first_name), lower(last_name)`,
    // Single-name members (no last name) sort by the name they have.
    last: sql`lower(coalesce(nullif(last_name, ''), first_name)), lower(first_name)`,
    company: sql`firm = '', lower(firm), lower(last_name), lower(first_name)`,
    industry: sql`industry = '', lower(industry), lower(last_name), lower(first_name)`,
  }[sort];
  const rows = await sql`
    select * from members
    where status = 'active' and (hide_from_directory = false or id = ${viewerId})
    order by ${orderBy}
  `;
  return rows.map(mapRow);
}

export async function setHideFromDirectory(id: string, hide: boolean) {
  await sql`update members set hide_from_directory = ${hide} where id = ${id}`;
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

// Profile fields members can change themselves, live immediately. Company
// and work email are deliberately absent: those go through admin approval
// (see profile-changes.ts).
export async function updateMemberProfile(
  id: string,
  input: {
    firstName: string;
    lastName: string;
    title: string;
    industry: string;
    location: string;
    link: string;
  },
) {
  const name = `${input.firstName} ${input.lastName}`.trim();
  await sql`
    update members set
      name = ${name},
      first_name = ${input.firstName},
      last_name = ${input.lastName},
      title = ${input.title},
      industry = ${input.industry},
      location = ${input.location},
      link = ${input.link}
    where id = ${id}
  `;
}

// True if another member already uses this address as a work or backup email.
export async function emailInUseByOtherMember(email: string, memberId: string): Promise<boolean> {
  const value = email.trim().toLowerCase();
  const rows = await sql`
    select 1 from members
    where (lower(email) = ${value} or lower(backup_email) = ${value}) and id <> ${memberId}
    limit 1
  `;
  return rows.length > 0;
}

export type WelcomeCandidate = { id: string; name: string; firstName: string; email: string };

// Active members who were added directly (CSV import or by hand, so no
// application on file) and haven't set a password yet — i.e. likely never
// got started. Used to (re-)send the import welcome email.
export async function getMembersAwaitingWelcome(): Promise<WelcomeCandidate[]> {
  const rows = await sql`
    select m.id, m.name, m.first_name, m.email
    from members m
    where m.status = 'active'
      and m.password_hash is null
      and not exists (select 1 from applications a where lower(a.email) = lower(m.email))
    order by lower(m.last_name), lower(m.first_name)
  `;
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    firstName: row.first_name as string,
    email: row.email as string,
  }));
}

// Any member (active or not), for admin editing.
export async function getMemberById(id: string): Promise<Member | undefined> {
  const rows = await sql`select * from members where id = ${id} limit 1`;
  return rows[0] ? mapRow(rows[0]) : undefined;
}

// Admin edit: every directory field, including company and work email, with
// no approval step (admins are the approvers).
export async function adminUpdateMember(
  id: string,
  input: {
    firstName: string;
    lastName: string;
    title: string;
    firm: string;
    industry: string;
    location: string;
    link: string;
    email: string;
  },
) {
  const name = `${input.firstName} ${input.lastName}`.trim();
  await sql`
    update members set
      name = ${name},
      first_name = ${input.firstName},
      last_name = ${input.lastName},
      title = ${input.title},
      firm = ${input.firm},
      industry = ${input.industry},
      location = ${input.location},
      link = ${input.link},
      email = ${input.email}
    where id = ${id}
  `;
}

export async function setMemberStatus(id: string, status: Member["status"]) {
  await sql`update members set status = ${status} where id = ${id}`;
}

export type BulkMemberInput = {
  firstName: string;
  lastName: string;
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
  created: { name: string; firstName: string; email: string }[];
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

    // Someone already using this address as their backup email counts as
    // an existing member too.
    const backupClash = await sql`
      select 1 from members where backup_email <> '' and lower(backup_email) = ${email} limit 1
    `;
    if (backupClash.length > 0) {
      result.skipped.push({ row, email, reason: "A member already uses this as their backup email" });
      continue;
    }

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const name = `${firstName} ${lastName}`.trim();
    const inserted = await sql`
      insert into members (name, first_name, last_name, email, title, firm, industry, location, link, bio)
      values (
        ${name}, ${firstName}, ${lastName}, ${email}, ${input.title?.trim() ?? ""}, ${input.firm?.trim() ?? ""},
        ${input.industry?.trim() ?? ""}, ${input.location?.trim() ?? ""}, ${input.link?.trim() ?? ""},
        ${input.bio?.trim() ?? ""}
      )
      on conflict (email) do nothing
      returning name, first_name, email
    `;

    if (inserted[0]) {
      result.created.push({
        name: inserted[0].name as string,
        firstName: inserted[0].first_name as string,
        email: inserted[0].email as string,
      });
    } else {
      result.skipped.push({ row, email, reason: "A member with this email already exists" });
    }
  }

  return result;
}
