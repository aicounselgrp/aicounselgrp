import { getSession } from "@/lib/session";

const TEMPLATE = [
  "name,email,title,firm,industry,location,link,bio",
  '"Jane Doe","jane@example.com","General Counsel","Example Corp","Technology","San Francisco, CA","https://linkedin.com/in/janedoe","Leads AI governance at Example Corp."',
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
