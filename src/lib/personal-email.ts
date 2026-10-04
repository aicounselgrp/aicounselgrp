// Consumer email providers. The member directory should only ever show a
// professional address, so these are rejected wherever a work email is
// entered (application, work-email change, CSV import). Members can still
// use one as their personal backup email.
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "comcast.net",
  "verizon.net",
  "att.net",
  "sbcglobal.net",
]);

export function isPersonalEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  // Also catch regional variants like yahoo.co.uk or hotmail.fr.
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) return true;
  const base = domain.split(".")[0];
  return ["yahoo", "hotmail", "outlook", "live", "gmx", "aol"].includes(base);
}

export const PERSONAL_EMAIL_MESSAGE =
  "Please use your work email. You can add a personal email as a backup after you join.";
