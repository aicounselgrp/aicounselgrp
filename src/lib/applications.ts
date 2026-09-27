import "server-only";
import { sql } from "@/lib/db";

export type Application = {
  id: string;
  name: string;
  email: string;
  firm: string;
  jurisdiction: string;
  link: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt: string | null;
};

function mapRow(row: Record<string, unknown>): Application {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    firm: row.firm as string,
    jurisdiction: row.jurisdiction as string,
    link: row.link as string,
    message: row.message as string,
    status: row.status as Application["status"],
    createdAt: (row.created_at as Date).toISOString(),
    decidedAt: row.decided_at ? (row.decided_at as Date).toISOString() : null,
  };
}

export async function createApplication(input: {
  name: string;
  email: string;
  firm: string;
  jurisdiction: string;
  link: string;
  message: string;
}): Promise<Application> {
  const rows = await sql`
    insert into applications (name, email, firm, jurisdiction, link, message)
    values (${input.name}, ${input.email}, ${input.firm}, ${input.jurisdiction}, ${input.link}, ${input.message})
    returning *
  `;
  return mapRow(rows[0]);
}

export async function getApplication(id: string): Promise<Application | undefined> {
  const rows = await sql`select * from applications where id = ${id} limit 1`;
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function listPendingApplications(): Promise<Application[]> {
  const rows = await sql`
    select * from applications where status = 'pending' order by created_at asc
  `;
  return rows.map(mapRow);
}

export async function listDecidedApplications(): Promise<Application[]> {
  const rows = await sql`
    select * from applications where status != 'pending' order by decided_at desc limit 25
  `;
  return rows.map(mapRow);
}

type Decision = "approved" | "rejected";

// Idempotent: if the application was already decided (via the dashboard or a
// previously-clicked email link), this just returns the existing outcome
// instead of erroring or double-creating a member.
export async function decideApplication(id: string, decision: Decision): Promise<Application | undefined> {
  return sql.begin(async (tx) => {
    const rows = await tx`select * from applications where id = ${id} for update`;
    const application = rows[0] ? mapRow(rows[0]) : undefined;
    if (!application) return undefined;

    if (application.status !== "pending") {
      return application;
    }

    const [updated] = await tx`
      update applications
      set status = ${decision}, decided_at = now()
      where id = ${id}
      returning *
    `;

    if (decision === "approved") {
      await tx`
        insert into members (name, email, firm, location)
        values (${application.name}, ${application.email}, ${application.firm}, '')
        on conflict (email) do update set status = 'active'
      `;
    }

    return mapRow(updated);
  });
}
