import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Antitrust Policy",
};

export default function Page() {
  return <LegalPage slug="antitrust" />;
}
