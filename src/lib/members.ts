export type Member = {
  name: string;
  title: string;
  firm: string;
  focus: string[];
  location: string;
};

// Replace with the group's actual roster.
export const members: Member[] = [
  {
    name: "Jordan Ellis",
    title: "Partner",
    firm: "Ellis & Ferro LLP",
    focus: ["AI Governance", "Product Liability"],
    location: "New York, NY",
  },
  {
    name: "Priya Nair",
    title: "Counsel",
    firm: "Nair Technology Law",
    focus: ["Data Privacy", "Model Training Rights"],
    location: "San Francisco, CA",
  },
  {
    name: "Marcus Webb",
    title: "Founding Attorney",
    firm: "Webb AI Law",
    focus: ["Regulatory Compliance", "Agentic Systems"],
    location: "Austin, TX",
  },
];
