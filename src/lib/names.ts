// Splits a single full name at the first space: "Maria Garcia López" ->
// { firstName: "Maria", lastName: "Garcia López" }. Used where only a full
// name is available (e.g. CSV imports, older records).
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1).trim() };
}

// The value for {{first_name}} in emails: the stored first name, falling
// back to the first word of the full name.
export function firstNameOf(person: { firstName?: string; name: string }): string {
  return person.firstName || splitFullName(person.name).firstName;
}
