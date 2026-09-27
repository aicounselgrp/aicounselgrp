import "server-only";
import { sql } from "@/lib/db";

export type Application = {
  id: string;
  name: string;
  email: string;
  firm: string;
  jobTitle: string;
  industry: string;
  city: string;
  state: string;
  country: string;
  link: string;
  message: string;
  policiesAcceptedAt: string | null;
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
    jobTitle: row.job_title as string,
    industry: row.industry as string,
    city: row.city as string,
    state: row.state as string,
    country: row.country as string,
    link: row.link as string,
    message: row.message as string,
    policiesAcceptedAt: row.policies_accepted_at
      ? (row.policies_accepted_at as Date).toISOString()
      : null,
    status: row.status as Application["status"],
    createdAt: (row.created_at as Date).toISOString(),
    decidedAt: row.decided_at ? (row.decided_at as Date).toISOString() : null,
  };
}

export async function createApplication(input: {
  name: string;
  email: string;
  firm: string;
  jobTitle: string;
  industry: string;
  city: string;
  state: string;
  country: string;
  link: string;
  message: string;
}): Promise<Application> {
  const rows = await sql`
    insert into applications (
      name, email, firm, job_title, industry, city, state, country, link, message,
      policies_accepted_at
    )
    values (
      ${input.name}, ${input.email}, ${input.firm}, ${input.jobTitle}, ${input.industry},
      ${input.city}, ${input.state}, ${input.country}, ${input.link}, ${input.message},
      now()
    )
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

export function formatLocation(application: Pick<Application, "city" | "state" | "country">): string {
  return [application.city, application.state, application.country].filter(Boolean).join(", ");
}

type Decision = "approved" | "rejected";

// Idempotent: if the application was already decided (via the dashboard or a
// previously-clicked email link), this just returns the existing outcome
// instead of erroring or double-creating a member. `decidedNow` is true only
// for the call that actually made the decision, so callers can send one-time
// notifications (like the welcome email) exactly once.
export async function decideApplication(
  id: string,
  decision: Decision,
): Promise<{ application: Application; decidedNow: boolean } | undefined> {
  return sql.begin(async (tx) => {
    const rows = await tx`select * from applications where id = ${id} for update`;
    const application = rows[0] ? mapRow(rows[0]) : undefined;
    if (!application) return undefined;

    if (application.status !== "pending") {
      return { application, decidedNow: false };
    }

    const [updated] = await tx`
      update applications
      set status = ${decision}, decided_at = now()
      where id = ${id}
      returning *
    `;

    if (decision === "approved") {
      await tx`
        insert into members (name, email, title, firm, location)
        values (
          ${application.name}, ${application.email}, ${application.jobTitle},
          ${application.firm}, ${formatLocation(application)}
        )
        on conflict (email) do update set status = 'active'
      `;
    }

    return { application: mapRow(updated), decidedNow: true };
  });
}
