import Papa from "papaparse";
import { getSession } from "@/lib/session";
import { bulkCreateMembers, type BulkMemberInput } from "@/lib/members";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CsvRow = Record<string, string>;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { csv?: string } | null;
  const csv = body?.csv;
  if (!csv || !csv.trim()) {
    return Response.json({ error: "No CSV content received." }, { status: 400 });
  }

  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (!parsed.meta.fields?.includes("name") || !parsed.meta.fields?.includes("email")) {
    return Response.json(
      { error: "CSV must have \"name\" and \"email\" columns." },
      { status: 400 },
    );
  }

  const rowErrors: { row: number; reason: string }[] = [];
  const inputs: BulkMemberInput[] = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const name = row.name?.trim() ?? "";
    const email = row.email?.trim() ?? "";

    if (!name || !email) {
      rowErrors.push({ row: rowNumber, reason: "Missing required name or email." });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      rowErrors.push({ row: rowNumber, reason: `Invalid email: "${email}"` });
      return;
    }

    inputs.push({
      row: rowNumber,
      name,
      email,
      title: row.title,
      firm: row.firm,
      industry: row.industry,
      location: row.location,
      link: row.link,
      bio: row.bio,
    });
  });

  const result = await bulkCreateMembers(inputs);

  return Response.json({
    ok: true,
    created: result.created,
    skipped: [
      ...result.skipped.map((s) => ({ row: s.row, reason: s.reason })),
      ...rowErrors,
    ].sort((a, b) => a.row - b.row),
  });
}
