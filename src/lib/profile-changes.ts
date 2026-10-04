import "server-only";
import { sql } from "@/lib/db";

// Member-requested changes to company and/or work email, which an admin must
// approve before they take effect (membership is limited to in-house
// lawyers, so these can affect eligibility). A new work email must also be
// confirmed by the member via an emailed link before it can be approved.

export type ProfileChangeRequest = {
  id: string;
  memberId: string;
  newFirm: string | null;
  newEmail: string | null;
  emailConfirmed: boolean;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
};

// A pending request joined with the member's current details, for admins.
export type PendingProfileChange = ProfileChangeRequest & {
  memberName: string;
  currentFirm: string;
  currentEmail: string;
};

function mapRow(row: Record<string, unknown>): ProfileChangeRequest {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    newFirm: (row.new_firm as string | null) ?? null,
    newEmail: (row.new_email as string | null) ?? null,
    emailConfirmed: Boolean(row.email_confirmed),
    status: row.status as ProfileChangeRequest["status"],
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function getPendingChangeForMember(
  memberId: string,
): Promise<ProfileChangeRequest | undefined> {
  const rows = await sql`
    select * from profile_change_requests
    where member_id = ${memberId} and status = 'pending'
    limit 1
  `;
  return rows[0] ? mapRow(rows[0]) : undefined;
}

// Replaces any existing pending request, so a member has at most one.
export async function createChangeRequest(
  memberId: string,
  input: { newFirm: string | null; newEmail: string | null },
): Promise<ProfileChangeRequest> {
  return sql.begin(async (tx) => {
    await tx`
      update profile_change_requests set status = 'cancelled', decided_at = now()
      where member_id = ${memberId} and status = 'pending'
    `;
    const [row] = await tx`
      insert into profile_change_requests (member_id, new_firm, new_email, email_confirmed)
      values (${memberId}, ${input.newFirm}, ${input.newEmail}, ${input.newEmail === null})
      returning *
    `;
    return mapRow(row);
  });
}

export async function cancelChangeRequest(memberId: string) {
  await sql`
    update profile_change_requests set status = 'cancelled', decided_at = now()
    where member_id = ${memberId} and status = 'pending'
  `;
}

// Marks a pending request's new email as confirmed. Returns the request, or
// undefined if it's no longer pending.
export async function confirmChangeRequestEmail(
  requestId: string,
): Promise<ProfileChangeRequest | undefined> {
  const rows = await sql`
    update profile_change_requests set email_confirmed = true
    where id = ${requestId} and status = 'pending' and new_email is not null
    returning *
  `;
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function listPendingChangeRequests(): Promise<PendingProfileChange[]> {
  const rows = await sql`
    select r.*, m.name as member_name, m.firm as current_firm, m.email as current_email
    from profile_change_requests r
    join members m on m.id = r.member_id
    where r.status = 'pending'
    order by r.created_at asc
  `;
  return rows.map((row) => ({
    ...mapRow(row),
    memberName: row.member_name as string,
    currentFirm: row.current_firm as string,
    currentEmail: row.current_email as string,
  }));
}

export type DecideResult =
  | { ok: true; request: ProfileChangeRequest; previousEmail: string }
  | { ok: false; error: string };

// Approving applies the new company/email to the member record. An email
// change can only be approved once the member has confirmed the address, and
// only if no other member has started using it in the meantime.
export async function decideChangeRequest(
  requestId: string,
  decision: "approved" | "rejected",
): Promise<DecideResult> {
  return sql.begin(async (tx) => {
    const rows = await tx`
      select r.*, m.email as current_email
      from profile_change_requests r join members m on m.id = r.member_id
      where r.id = ${requestId} for update of r
    `;
    const row = rows[0];
    if (!row) return { ok: false, error: "That request no longer exists." };
    const request = mapRow(row);
    const previousEmail = row.current_email as string;
    if (request.status !== "pending") {
      return { ok: false, error: `That request was already ${request.status}.` };
    }

    if (decision === "approved") {
      if (request.newEmail) {
        if (!request.emailConfirmed) {
          return { ok: false, error: "The member hasn't confirmed their new email address yet." };
        }
        const clash = await tx`
          select 1 from members
          where (lower(email) = lower(${request.newEmail}) or lower(backup_email) = lower(${request.newEmail}))
            and id <> ${request.memberId}
          limit 1
        `;
        if (clash.length > 0) {
          return { ok: false, error: "Another member is already using that email address." };
        }
        await tx`update members set email = ${request.newEmail} where id = ${request.memberId}`;
      }
      if (request.newFirm) {
        await tx`update members set firm = ${request.newFirm} where id = ${request.memberId}`;
      }
    }

    const [updated] = await tx`
      update profile_change_requests set status = ${decision}, decided_at = now()
      where id = ${requestId}
      returning *
    `;
    return { ok: true, request: mapRow(updated), previousEmail };
  });
}
