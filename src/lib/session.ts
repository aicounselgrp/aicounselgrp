import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "member" | "admin";

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAGIC_LINK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DECISION_LINK_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const SET_PASSWORD_DURATION_MS = 60 * 60 * 1000; // 1 hour

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

// --- Magic-link tokens: short-lived, emailed to prove the user owns the address. ---

export async function createMagicLinkToken(email: string) {
  return new SignJWT({ email, purpose: "magic-link" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + MAGIC_LINK_DURATION_MS) / 1000))
    .sign(secretKey());
}

export async function verifyMagicLinkToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== "magic-link" || typeof payload.email !== "string") {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}

// --- Decision-link tokens: long-lived, emailed to the admin for one-click approve/reject. ---

export async function createDecisionToken(applicationId: string, decision: "approved" | "rejected") {
  return new SignJWT({ applicationId, decision, purpose: "application-decision" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + DECISION_LINK_DURATION_MS) / 1000))
    .sign(secretKey());
}

export async function verifyDecisionToken(
  token: string,
): Promise<{ applicationId: string; decision: "approved" | "rejected" } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (
      payload.purpose !== "application-decision" ||
      typeof payload.applicationId !== "string" ||
      (payload.decision !== "approved" && payload.decision !== "rejected")
    ) {
      return null;
    }
    return { applicationId: payload.applicationId, decision: payload.decision };
  } catch {
    return null;
  }
}

// --- Set-password tokens: emailed to an admin to let them (re)set their password. ---

export async function createSetPasswordToken(email: string) {
  return new SignJWT({ email, purpose: "set-password" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SET_PASSWORD_DURATION_MS) / 1000))
    .sign(secretKey());
}

export async function verifySetPasswordToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== "set-password" || typeof payload.email !== "string") {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}

// --- Member set-password tokens: emailed to a member to (re)set their password. ---
// Keyed by member ID (not email) so it keeps working if they used their backup
// email, and can't be confused with the admin set-password token.

export async function createMemberSetPasswordToken(memberId: string) {
  return new SignJWT({ memberId, purpose: "member-set-password" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SET_PASSWORD_DURATION_MS) / 1000))
    .sign(secretKey());
}

export async function verifyMemberSetPasswordToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== "member-set-password" || typeof payload.memberId !== "string") {
      return null;
    }
    return payload.memberId;
  } catch {
    return null;
  }
}

// --- RSVP tokens: identify a member for one event, emailed with an invite/reminder. ---
// No expiration — RSVPing late (or changing your mind) shouldn't require a new email.

export async function createRsvpToken(eventId: string, memberId: string) {
  return new SignJWT({ eventId, memberId, purpose: "event-rsvp" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secretKey());
}

export async function verifyRsvpToken(
  token: string,
): Promise<{ eventId: string; memberId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (
      payload.purpose !== "event-rsvp" ||
      typeof payload.eventId !== "string" ||
      typeof payload.memberId !== "string"
    ) {
      return null;
    }
    return { eventId: payload.eventId, memberId: payload.memberId };
  } catch {
    return null;
  }
}

// --- Session cookie: long-lived, set after a magic link is verified. ---

export async function createSession(email: string, role: Role) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await new SignJWT({ email, role, purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<{ email: string; role: Role } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, secretKey(), { algorithms: ["HS256"] });
    if (
      payload.purpose !== "session" ||
      typeof payload.email !== "string" ||
      (payload.role !== "member" && payload.role !== "admin")
    ) {
      return null;
    }
    return { email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
