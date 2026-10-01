import "server-only";
import { headers } from "next/headers";

// The site's origin as seen by the current request (e.g. https://aicounselgrp.org),
// for building absolute links in emails.
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
