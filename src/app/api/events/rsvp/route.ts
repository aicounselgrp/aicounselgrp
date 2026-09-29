import { verifyRsvpToken } from "@/lib/session";
import { getEvent, setRsvpResponse } from "@/lib/events";
import { htmlPage } from "@/lib/html-response";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const response = url.searchParams.get("response");
  const decoded = token ? await verifyRsvpToken(token) : null;

  if (!decoded || (response !== "yes" && response !== "no")) {
    return htmlPage("Invalid link", "This RSVP link is invalid.");
  }

  const event = await getEvent(decoded.eventId);
  if (!event) {
    return htmlPage("Not found", "This event no longer exists.");
  }

  const rsvp = await setRsvpResponse(decoded.eventId, decoded.memberId, response);
  if (!rsvp) {
    return htmlPage("Not found", "We couldn't find your invitation to this event.");
  }

  return htmlPage(
    "RSVP received",
    response === "yes"
      ? `Thanks, ${rsvp.memberName} — you're down as attending "${event.title}". See you there!`
      : `Thanks, ${rsvp.memberName} — we've marked you as not attending "${event.title}".`,
  );
}
