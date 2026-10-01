// Options for the Industry dropdown on the application form. The join API
// rejects anything not in this list.
export const INDUSTRIES = [
  "Automotive",
  "Consulting",
  "Consumer Goods",
  "Financial Services",
  "Food and Beverage",
  "Infrastructure",
  "Media",
  "Retail",
  "Technology",
] as const;

export function isIndustry(value: string): boolean {
  return (INDUSTRIES as readonly string[]).includes(value);
}
