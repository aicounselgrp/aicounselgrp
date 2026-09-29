import { verifyDecisionToken } from "@/lib/session";
import { decideApplication } from "@/lib/applications";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/application-emails";
import { htmlPage } from "@/lib/html-response";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const decoded = token ? await verifyDecisionToken(token) : null;

  if (!decoded) {
    return htmlPage("Link expired", "This approval link is invalid or has expired.");
  }

  const result = await decideApplication(decoded.applicationId, decoded.decision);

  if (!result) {
    return htmlPage("Not found", "This application no longer exists.");
  }

  const { application, decidedNow } = result;
  if (decidedNow) {
    if (application.status === "approved") {
      await sendApprovalEmail(application, new URL(request.url).origin);
    } else if (application.status === "rejected") {
      await sendRejectionEmail(application);
    }
  }

  const verb = application.status === "approved" ? "approved" : "rejected";
  return htmlPage(
    `Application ${verb}`,
    `${application.name}'s application has been ${verb}.` +
      (application.status === "approved"
        ? " They've been added as a member and can now log in." +
          (decidedNow ? " A welcome email with login instructions has been sent to them." : "")
        : decidedNow
          ? " They've been notified by email."
          : ""),
  );
}
