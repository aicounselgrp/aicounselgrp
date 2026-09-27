export type Member = {
  name: string;
  email: string;
  title: string;
  firm: string;
  focus: string[];
  location: string;
};

// Replace with the group's actual roster. `email` is what members use to log
// in to the directory (magic link) — must be kept in sync with who's allowed in.
export const members: Member[] = [
  {
    name: "Jordan Ellis",
    email: "jordan@ellisferro.example",
    title: "Partner",
    firm: "Ellis & Ferro LLP",
    focus: ["AI Governance", "Product Liability"],
    location: "New York, NY",
  },
  {
    name: "Priya Nair",
    email: "priya@nairtechlaw.example",
    title: "Counsel",
    firm: "Nair Technology Law",
    focus: ["Data Privacy", "Model Training Rights"],
    location: "San Francisco, CA",
  },
  {
    name: "Marcus Webb",
    email: "marcus@webbailaw.example",
    title: "Founding Attorney",
    firm: "Webb AI Law",
    focus: ["Regulatory Compliance", "Agentic Systems"],
    location: "Austin, TX",
  },
];

export function findMemberByEmail(email: string): Member | undefined {
  const normalized = email.trim().toLowerCase();
  return members.find((member) => member.email.toLowerCase() === normalized);
}
