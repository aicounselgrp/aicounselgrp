import "server-only";
import { sql } from "@/lib/db";

export type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  eventAt: string | null;
  createdAt: string;
};

export type RsvpResponse = "pending" | "yes" | "no";

export type Rsvp = {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  response: RsvpResponse;
  respondedAt: string | null;
};

function mapEventRow(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    location: row.location as string,
    eventAt: row.event_at ? (row.event_at as Date).toISOString() : null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function mapRsvpRow(row: Record<string, unknown>): Rsvp {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    memberId: row.member_id as string,
    memberName: row.member_name as string,
    memberEmail: row.member_email as string,
    response: row.response as RsvpResponse,
    respondedAt: row.responded_at ? (row.responded_at as Date).toISOString() : null,
  };
}

export async function createEvent(input: {
  title: string;
  description: string;
  location: string;
  eventAt: string | null;
}): Promise<Event> {
  const rows = await sql`
    insert into events (title, description, location, event_at)
    values (${input.title}, ${input.description}, ${input.location}, ${input.eventAt})
    returning *
  `;
  return mapEventRow(rows[0]);
}

export async function listEvents(): Promise<Event[]> {
  const rows = await sql`select * from events order by event_at desc nulls last, created_at desc`;
  return rows.map(mapEventRow);
}

export async function getEvent(id: string): Promise<Event | undefined> {
  const rows = await sql`select * from events where id = ${id} limit 1`;
  return rows[0] ? mapEventRow(rows[0]) : undefined;
}

export async function getRsvpsForEvent(eventId: string): Promise<Rsvp[]> {
  const rows = await sql`
    select r.*, m.name as member_name, m.email as member_email
    from event_rsvps r
    join members m on m.id = r.member_id
    where r.event_id = ${eventId}
    order by m.name asc
  `;
  return rows.map(mapRsvpRow);
}

// Creates a pending RSVP row for every active member who doesn't already
// have one for this event (safe to call again for a later reminder without
// resetting anyone's existing response).
export async function ensureRsvpsForActiveMembers(eventId: string): Promise<void> {
  await sql`
    insert into event_rsvps (event_id, member_id)
    select ${eventId}, m.id from members m where m.status = 'active'
    on conflict (event_id, member_id) do nothing
  `;
}

// Active members who haven't declined — the sensible default reminder
// audience (no point reminding someone who already said no).
export async function getReminderRecipients(
  eventId: string,
): Promise<{ id: string; name: string; firstName: string; email: string }[]> {
  const rows = await sql`
    select m.id, m.name, m.first_name, m.email
    from members m
    join event_rsvps r on r.member_id = m.id and r.event_id = ${eventId}
    where m.status = 'active' and r.response != 'no'
    order by m.name asc
  `;
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    firstName: r.first_name as string,
    email: r.email as string,
  }));
}

export async function setRsvpResponse(
  eventId: string,
  memberId: string,
  response: "yes" | "no",
): Promise<Rsvp | undefined> {
  const rows = await sql`
    update event_rsvps
    set response = ${response}, responded_at = now()
    where event_id = ${eventId} and member_id = ${memberId}
    returning *
  `;
  if (!rows[0]) return undefined;
  const [withMember] = await sql`
    select r.*, m.name as member_name, m.email as member_email
    from event_rsvps r join members m on m.id = r.member_id
    where r.id = ${rows[0].id}
  `;
  return mapRsvpRow(withMember);
}
