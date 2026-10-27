// Outlook-first sourcing enquiry relay, intentionally disabled until secure Microsoft 365 and Turnstile are configured.
// Requires Microsoft 365 Exchange Online mailbox and scoped Graph Mail.Send application permission.
// No endpoint for arbitrary email recipients or bulk messaging.
import { randomUUID } from "node:crypto";
import { normalizeRequest, validateRequest, requestSummary } from "../assets/sourcing-request.mjs";

const MAILBOX = "welcome@epic-decks.com";
const reply = (res, status, body) => res.status(status).setHeader("Cache-Control", "no-store").json(body);
const ready = () => process.env.SOURCING_EMAIL_RELAY_ENABLED === "true"
  && !!process.env.MS_TENANT_ID && !!process.env.MS_CLIENT_ID
  && !!process.env.MS_CLIENT_SECRET && !!process.env.TURNSTILE_SECRET_KEY
  && !!process.env.TURNSTILE_SITE_KEY;
function validEmail(email) {
  return typeof email === "string" && email.length < 255
    && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}
async function verifyHuman(token) {
  if (typeof token !== "string" || token.length < 1 || token.length > 3000) return false;
  const p = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: token
  });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: p,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return false;
  const result = await response.json();
  // Cloudflare must validate the challenge and issue the response for this exact site.
  if (result.success !== true) return false;
  const allowed = String(process.env.TURNSTILE_ALLOWED_HOSTNAMES || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(String(result.hostname || "").toLowerCase());
}
async function getGraphToken() {
  const tenant = process.env.MS_TENANT_ID;
  if (!/^[a-z0-9-]{6,60}$/i.test(tenant)) throw Error("Tenant ID misconfigured");
  const tokenResponse = await fetch("https://login.microsoftonline.com/" + tenant + "/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MS_CLIENT_ID,
      client_secret: process.env.MS_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "https://graph.microsoft.com/.default"
    }),
    signal: AbortSignal.timeout(12000)
  });
  if (!tokenResponse.ok) throw Error("Microsoft authentication failed");
  const data = await tokenResponse.json();
  if (!data.access_token) throw Error("Microsoft token missing");
  return data.access_token;
}
async function sendSourcingMail(accessToken, msg) {
  const response = await fetch("https://graph.microsoft.com/v1.0/users/" + encodeURIComponent(MAILBOX) + "/sendMail", {
    method: "POST",
    headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ message: {
      subject: "[Pokébro Sourcing] " + msg.card.slice(0,100),
      body: { contentType: "Text", content: msg.body },
      toRecipients: [{ emailAddress: { address: MAILBOX } }],
      replyTo: [{ emailAddress: { address: msg.email } }]
    }, saveToSentItems: true }),
    signal: AbortSignal.timeout(15000)
  });
  if (response.status !== 202) throw Error("Microsoft delivery request not accepted");
}
export default async function handler(req, res) {
  if (req.method === "GET") return reply(res, 200, {
    enabled: ready() && Boolean(process.env.TURNSTILE_ALLOWED_HOSTNAMES),
    siteKey: ready() ? process.env.TURNSTILE_SITE_KEY : ""
  });
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");return reply(res, 405, { error: "Method not supported." });
  }
  if (!ready() || !process.env.TURNSTILE_ALLOWED_HOSTNAMES) return reply(res, 503, { error: "Direct email submission is not configured. Please use the email draft option." });
  // Same-origin browser flow only. CSRF origin check complements Turnstile but is not a substitute for it.
  const origin = String(req.headers.origin || "");
  const host = String(req.headers.host || "");
  if (!origin || !host || (()=>{try{return new URL(origin).host !== host;}catch{return true}})())
    return reply(res, 403, { error: "Invalid request origin." });
  const raw = typeof req.body === "string" ? (()=>{try{return JSON.parse(req.body)}catch{return null}})() : req.body;
  if (!raw || JSON.stringify(raw).length > 8000 || typeof raw !== "object")
    return reply(res, 400, { error: "Invalid request payload." });
  if (raw.website) return reply(res, 400, { error: "Invalid request." }); // bot honeypot
  const email = String(raw.contactEmail || "").trim();
  if (!validEmail(email) || raw.privacyConsent !== true)
    return reply(res, 400, { error: "Valid email address and consent are required." });
  const brief = normalizeRequest(raw.request || {});
  const errors = validateRequest(brief);
  if (errors.length) return reply(res, 400, { error: errors.join(" ") });
  try {
    if (!await verifyHuman(raw.captchaToken))
      return reply(res, 400, { error: "Human verification failed. Please try again." });
    const token = await getGraphToken();
    const reference = randomUUID();
    const body = "Reference: " + reference + "\n"
      + "Collector contact email: " + email + "\n\n"
      + requestSummary(brief)
      + "\n\nThis is an enquiry, not permission to purchase. Reply to the collector only after reviewing the request.";
    await sendSourcingMail(token, { card: brief.card, email, body });
    return reply(res, 202, {
      accepted: true, reference,
      message: "Microsoft accepted the message for processing; inbox delivery is not yet guaranteed."
    });
  } catch {
    // Never disclose Microsoft or Cloudflare secrets and do not log submitted personal information.
    return reply(res, 502, { error: "Request could not be relayed. Please use the email draft instead." });
  }
}
