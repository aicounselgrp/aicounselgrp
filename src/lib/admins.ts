import "server-only";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

const SALT_ROUNDS = 12;

export async function adminExists(email: string): Promise<boolean> {
  const rows = await sql`
    select 1 from admins where lower(email) = lower(${email.trim()}) limit 1
  `;
  return rows.length > 0;
}

export async function setAdminPassword(email: string, password: string) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  await sql`
    update admins set password_hash = ${hash} where lower(email) = lower(${email.trim()})
  `;
}

// Verifies email + password and returns the normalized email on success.
export async function verifyAdminPassword(email: string, password: string): Promise<string | null> {
  const rows = await sql`
    select email, password_hash from admins where lower(email) = lower(${email.trim()}) limit 1
  `;
  const admin = rows[0];
  if (!admin || !admin.password_hash) return null;

  const matches = await bcrypt.compare(password, admin.password_hash as string);
  return matches ? (admin.email as string) : null;
}
