import "server-only";
import { sql } from "@/lib/db";

// Database changes new features depend on. Admins can apply any that are
// missing from the dashboard, so a deploy doesn't need someone to run SQL
// against the database by hand. Each statement is idempotent and mirrors
// db/schema.sql.
const UPDATES = [
  {
    label: "Event end times",
    table: "events",
    column: "ends_at",
    statement: "alter table events add column if not exists ends_at timestamptz",
  },
];

export async function getPendingDatabaseUpdates(): Promise<string[]> {
  const rows = await sql`
    select table_name, column_name from information_schema.columns
    where table_schema = current_schema()
  `;
  const existing = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
  return UPDATES.filter((u) => !existing.has(`${u.table}.${u.column}`)).map((u) => u.label);
}

export async function applyDatabaseUpdates() {
  for (const update of UPDATES) {
    // Fixed statements from the list above, never user input.
    await sql.unsafe(update.statement);
  }
}
