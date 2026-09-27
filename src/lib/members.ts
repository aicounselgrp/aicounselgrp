import "server-only";
import { sql } from "@/lib/db";

export type Member = {
  id: string;
  name: string;
  email: string;
  title: string;
  firm: string;
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
