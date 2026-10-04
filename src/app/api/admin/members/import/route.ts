import Papa from "papaparse";
import { INDUSTRIES } from "@/lib/industries";
import { sendImportWelcomeEmail } from "@/lib/import-welcome-email";
import { splitFullName } from "@/lib/names";
import { isPersonalEmail } from "@/lib/personal-email";
import { getSession } from "@/lib/session";
import { bulkCreateMembers, type BulkMemberInput } from "@/lib/members";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CsvRow = Record<string, string>;

// Match an industry to the application drop-down's wording regardless of
// case, so sorting by industry groups imported members with everyone else.
function normalizeIndustry(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return INDUSTRIES.find((industry) => industry.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { csv?: string; sendWelcome?: boolean }
    | null;
  const csv = body?.csv;
  if (!csv || !csv.trim()) {
    return Response.json({ error: "No CSV content received." }, { status: 400 });
  }

  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  // first_name + last_name is preferred; a single "name" column (older
  // template) still works and is split at the first space.
  const fields = parsed.meta.fields ?? [];
  const hasSplitNames = fields.includes("first_name") && fields.includes("last_name");
  if (!fields.includes("email") || (!hasSplitNames && !fields.includes("name"))) {
    return Response.json(
      { error: 'CSV must have "first_name", "last_name" and "email" columns.' },
      { status: 400 },
    );
  }

  const rowErrors: { row: number; reason: string }[] = [];
  const inputs: BulkMemberInput[] = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const { firstName, lastName } = hasSplitNames
      ? { firstName: row.first_name?.trim() ?? "", lastName: row.last_name?.trim() ?? "" }
      : splitFullName(row.name ?? "");
    const email = row.email?.trim() ?? "";

    if (!firstName || !lastName || !email) {
      rowErrors.push({ row: rowNumber, reason: "Missing first name, last name or email." });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      rowErrors.push({ row: rowNumber, reason: `Invalid email: "${email}"` });
      return;
    }
    if (isPersonalEmail(email)) {
      rowErrors.push({
        row: rowNumber,
        reason: `Personal email not allowed — use a work email: "${email}"`,
      });
      return;
    }

    inputs.push({
      row: rowNumber,
      firstName,
      lastName,
      email,
      title: row.title,
      firm: row.firm,
      industry: normalizeIndustry(row.industry),
      location: row.location,
      link: row.link,
      bio: row.bio,
    });
  });

  const result = await bulkCreateMembers(inputs);

  let welcomed = 0;
  if (body?.sendWelcome) {
    const origin = new URL(request.url).origin;
    for (const member of result.created) {
      if (await sendImportWelcomeEmail(member, origin)) welcomed += 1;
    }
  }

  return Response.json({
    ok: true,
    created: result.created.map((m) => `${m.name} <${m.email}>`),
    welcomed: body?.sendWelcome ? welcomed : null,
    skipped: [
      ...result.skipped.map((s) => ({ row: s.row, reason: s.reason })),
      ...rowErrors,
    ].sort((a, b) => a.row - b.row),
  });
}
