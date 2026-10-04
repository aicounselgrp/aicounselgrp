import { getSession } from "@/lib/session";

const TEMPLATE = [
  "last_name,first_name,email,title,firm,industry,location,link,bio",
  '"Doe","Jane","jane@example.com","General Counsel","Example Corp","Technology","San Francisco, California, United States","https://linkedin.com/in/janedoe","Leads AI governance at Example Corp."',
  '"de la Cruz","Mary Ann","maryann@example.org","Deputy General Counsel","Example Bank","Financial Services","New York, New York, United States","",""',
].join("\n");

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Not authorized." }, { status: 401 });
  }

  return new Response(TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="members-template.csv"',
    },
  });
}
