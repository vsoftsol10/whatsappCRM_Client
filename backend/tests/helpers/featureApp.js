// Test app for: WhatsApp webhook, public lead capture, campaigns and tickets.
//
// Same idea as testApp.js: the REAL routes, controllers and middleware run,
// and only the outside world (database, WhatsApp/Meta, AI, sockets, email,
// Cloudinary) is replaced by fakes. Nothing here can reach a real service.
//
// This file only ADDS test support. It does not change any app code.

require("./env");

// Secrets used only by the tests (never real values)
process.env.META_APP_SECRET = "test-meta-app-secret";
process.env.VERIFY_TOKEN = "test-verify-token";

const path = require("path");
const http = require("http");
const crypto = require("crypto");
const express = require("express");

// Loading testApp installs the shared fakes (database, audit log, email,
// notifications ...) and gives us the seeded companies, users and tokens.
const base = require("./testApp");

const SRC = path.resolve(__dirname, "../../src");
const { db } = base;

// ---- extra fakes ------------------------------------------------------------
const stub = (relPath, exports) => {
  const file = require.resolve(path.join(SRC, relPath));
  require.cache[file] = { id: file, filename: file, loaded: true, exports, children: [], paths: [] };
};
const noop = async () => undefined;
const noopProxy = () => new Proxy({}, { get: () => noop });

// WhatsApp sending: records every call and lets a test decide the result.
//   whatsapp.calls            -> list of { fn, to, template }
//   whatsapp.queue(r1, r2...) -> results returned by the next sends, in order
//   whatsapp.failFor(phone)   -> every send to this phone fails (not temporary)
const whatsapp = {
  calls: [],
  _queue: [],
  _failPhones: new Set(),
  reset() {
    this.calls.length = 0;
    this._queue.length = 0;
    this._failPhones.clear();
  },
  queue(...results) {
    this._queue.push(...results);
  },
  failFor(phone) {
    this._failPhones.add(String(phone));
  },
  _send(fn, to, template) {
    this.calls.push({ fn, to: String(to), template });
    if (this._queue.length) return this._queue.shift();
    if (this._failPhones.has(String(to))) {
      return { success: false, error: { code: 100, message: "Invalid parameter" } };
    }
    return { success: true, data: { messages: [{ id: `wamid.${crypto.randomUUID()}` }] } };
  },
};
const OK = () => ({ success: true, data: { messages: [{ id: `wamid.${crypto.randomUUID()}` }] } });
const TEMPORARY_ERROR = { success: false, error: { code: 131016, message: "Service unavailable" } };

stub("services/whatsappService.js", new Proxy({}, {
  get: (_, name) => {
    if (name === "sendTemplateMessage") return async (to, template) => whatsapp._send(name, to, template);
    if (name === "sendCampaignImageTemplate") return async (to, template) => whatsapp._send(name, to, template);
    if (name === "sendTextMessage") return async (to) => whatsapp._send(name, to, null);
    return noop;
  },
}));
stub("socket.js", { emitToCompany: noop, initSocket: noop, getIO: () => null });
stub("services/aiService.js", { getAutoReply: noop });
stub("services/ai/handoffService.js", noopProxy());
stub("services/ai/leadCaptureService.js", noopProxy());
stub("services/geminiService.js", noopProxy());
stub("services/metaMediaDownloadService.js", { downloadAndStoreWhatsAppMedia: noop });
stub("services/cloudinaryService.js", { uploadBufferToCloudinary: noop, uploadCampaignImage: noop });

// The campaign plan-limit check should be the REAL one (testApp makes it a
// pass-through for its own tests). Remove that stub so the real file loads.
delete require.cache[require.resolve(path.join(SRC, "middleware/planLimitMiddleware.js"))];

// ---- the app ----------------------------------------------------------------
// Same order as server.js: the Meta signature check runs before the webhook.
const verifyMetaWebhookSignature = require(path.join(SRC, "middleware/verifyMetaWebhookSignature.js"));

function buildApp() {
  const app = express();

  // Public lead capture has its own CORS + JSON parser (mounted first, like server.js)
  app.use("/api/public", require(path.join(SRC, "routes/publicLeadRoutes.js")));

  // Raw body is needed to check Meta's signature
  app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

  app.use("/api/saas/webhook", verifyMetaWebhookSignature, require(path.join(SRC, "routes/saasWebhook.js")));
  app.use("/api/campaigns", require(path.join(SRC, "routes/campaignRoutes.js")));
  app.use("/api/tickets", require(path.join(SRC, "routes/ticketRoutes.js")));

  app.use((err, req, res, next) => res.status(500).json({ success: false, message: "Internal Server Error" }));
  return app;
}

let server, baseUrl;

async function start() {
  if (!require(path.join(SRC, "config/prisma.js")).__isFake) {
    throw new Error("SAFETY STOP: tests must never run against the real Prisma client");
  }
  server = http.createServer(buildApp());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}
const stop = () => new Promise((resolve) => (server ? server.close(resolve) : resolve()));

// body can be an object (sent as JSON) or a ready string (used for webhooks
// so the signature is computed on exactly the bytes that are sent)
async function request(method, url, { token, body, rawBody, headers } = {}) {
  const payload = rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined;
  const res = await fetch(baseUrl + url, {
    method,
    headers: {
      ...(payload !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: payload,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, body: json, text };
}
const api = {
  get: (url, opts) => request("GET", url, opts),
  post: (url, opts) => request("POST", url, opts),
  put: (url, opts) => request("PUT", url, opts),
  patch: (url, opts) => request("PATCH", url, opts),
  delete: (url, opts) => request("DELETE", url, opts),
};

// ---- Meta webhook helpers -----------------------------------------------------
const signMeta = (raw, secret = process.env.META_APP_SECRET) =>
  "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");

/** POST a Meta webhook payload with a valid (or custom) signature. */
function postWebhook(payload, { signature, url = "/api/saas/webhook" } = {}) {
  const raw = JSON.stringify(payload);
  const headers = {};
  if (signature !== null) headers["x-hub-signature-256"] = signature || signMeta(raw);
  return api.post(url, { rawBody: raw, headers });
}

/** Builds the payload Meta sends when a customer writes to a business number. */
const incomingTextPayload = ({ phoneNumberId = "PNID-A", from = "919888800001", id = "wamid.IN1", text = "Hello" } = {}) => ({
  object: "whatsapp_business_account",
  entry: [{
    id: "WABA-1",
    changes: [{
      field: "messages",
      value: {
        messaging_product: "whatsapp",
        metadata: { display_phone_number: "15550001111", phone_number_id: phoneNumberId },
        contacts: [{ profile: { name: "New Person" }, wa_id: from }],
        messages: [{ from, id, timestamp: "1700000000", type: "text", text: { body: text } }],
      },
    }],
  }],
});

// ---- test data ------------------------------------------------------------------
/**
 * Everything from seedWorld() (two companies, admins, employees, customers)
 * plus WhatsApp numbers, a lead-form integration, templates, a plan,
 * a campaign with recipients and some tickets.
 */
function seedFeatureWorld() {
  const w = base.seedWorld();

  // one connected WhatsApp number per company
  db.insert("whatsAppAccount", { id: 1, companyId: 1, phoneNumberId: "PNID-A", displayPhoneNumber: "15550001111", status: "CONNECTED", whatsappAccessToken: "token-a" });
  db.insert("whatsAppAccount", { id: 2, companyId: 2, phoneNumberId: "PNID-B", displayPhoneNumber: "15550002222", status: "CONNECTED", whatsappAccessToken: "token-b" });
  db.insert("whatsAppAccount", { id: 3, companyId: 1, phoneNumberId: "PNID-OFF", displayPhoneNumber: "15550003333", status: "DISCONNECTED", whatsappAccessToken: "token-x" });

  // website lead-form integration (company A) + one for company B
  db.insert("integration", { id: 1, companyId: 1, name: "Acme Website", provider: "WEBSITE", type: "ECOMMERCE", status: "ACTIVE", webhookKey: "key-acme", settings: null });
  db.insert("integration", { id: 2, companyId: 2, name: "Bravo Website", provider: "WEBSITE", type: "ECOMMERCE", status: "ACTIVE", webhookKey: "key-bravo", settings: null });
  db.insert("integration", { id: 3, companyId: 1, name: "Old Website", provider: "WEBSITE", type: "ECOMMERCE", status: "INACTIVE", webhookKey: "key-off", settings: null });
  db.insert("integration", { id: 4, companyId: 1, name: "Acme Shop", provider: "SHOPIFY", type: "ECOMMERCE", status: "ACTIVE", webhookKey: "key-shopify", settings: null });
  db.insert("integration", { id: 5, companyId: 1, name: "Locked Website", provider: "WEBSITE", type: "ECOMMERCE", status: "ACTIVE", webhookKey: "key-locked", settings: { allowedOrigins: ["https://acme.test"] } });

  // plans: A has room for campaigns, B is already at its limit
  db.insert("subscriptionPlan", { id: "plan-a", planName: "Growth", maxCampaigns: 5 });
  db.insert("subscriptionPlan", { id: "plan-b", planName: "Starter", maxCampaigns: 1 });
  db.insert("subscription", { id: "sub-a", companyId: 1, status: "ACTIVE", planId: "plan-a" });
  db.insert("subscription", { id: "sub-b", companyId: 2, status: "ACTIVE", planId: "plan-b" });

  // templates
  db.insert("template", { id: "tpl-a", companyId: 1, name: "offer_a", language: "en_US", status: "APPROVED", content: "Hi {{1}}, {{2}}", buttons: null });
  db.insert("template", { id: "tpl-a-draft", companyId: 1, name: "draft_a", language: "en_US", status: "PENDING", content: "Hi {{1}}", buttons: null });
  db.insert("template", { id: "tpl-b", companyId: 2, name: "offer_b", language: "en_US", status: "APPROVED", content: "Hi {{1}}", buttons: null });

  // campaign A (3 recipients: two customers + one without a phone) and campaign B
  db.insert("customer", { id: "cust-a3", companyId: 1, name: "Anil Acme", phone: "919000000005", email: null, status: "ACTIVE", userId: "a-admin" });
  db.insert("campaign", { id: "camp-a", companyId: 1, name: "Diwali Offer", type: "PROMOTIONAL", templateId: "tpl-a", messageContent: "20% off", status: "DRAFT", createdById: "a-admin", totalRecipients: 3, audienceCount: 3, sentCount: 0, failedCount: 0, imageUrl: null });
  ["cust-a1", "cust-a2", "cust-a3"].forEach((customerId, i) =>
    db.insert("campaignRecipient", { id: `rec-a${i + 1}`, campaignId: "camp-a", customerId, status: "PENDING" })
  );
  db.insert("campaign", { id: "camp-b", companyId: 2, name: "Bravo Offer", type: "PROMOTIONAL", templateId: "tpl-b", messageContent: "Hi", status: "DRAFT", createdById: "b-admin", totalRecipients: 1, audienceCount: 1, sentCount: 0, failedCount: 0, imageUrl: null });
  db.insert("campaignRecipient", { id: "rec-b1", campaignId: "camp-b", customerId: "cust-b1", status: "PENDING" });

  // tickets: two in company A (one per employee), one in company B
  db.insert("ticket", { id: "tick-a1", companyId: 1, title: "Printer broken", description: "no ink", status: "OPEN", priority: "HIGH", customerId: "cust-a1", createdById: "a-admin", assignedToId: "a-emp1" });
  db.insert("ticket", { id: "tick-a2", companyId: 1, title: "Login issue", description: "", status: "OPEN", priority: "LOW", customerId: "cust-a2", createdById: "a-admin", assignedToId: "a-emp2" });
  db.insert("ticket", { id: "tick-b1", companyId: 2, title: "Bravo confidential", description: "secret", status: "OPEN", priority: "MEDIUM", customerId: "cust-b1", createdById: "b-admin", assignedToId: "b-emp" });
  db.insert("ticketWorkNote", { id: "note-a1", ticketId: "tick-a1", employeeId: "a-emp1", note: "Checked the printer" });
  db.insert("ticketWorkNote", { id: "note-b1", ticketId: "tick-b1", employeeId: "b-emp", note: "Bravo private note" });

  whatsapp.reset();
  return w;
}

/** Wait until a background job finishes (campaign sending runs after the HTTP reply). */
async function waitFor(check, { timeout = 8000, step = 25 } = {}) {
  const end = Date.now() + timeout;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() > end) throw new Error("waitFor: timed out");
    await new Promise((r) => setTimeout(r, step));
  }
}

module.exports = {
  ...base, // db, tokenFor, addUser, PASSWORD, jwt, bcrypt ...
  api, start, stop,
  seedFeatureWorld, whatsapp, OK, TEMPORARY_ERROR,
  signMeta, postWebhook, incomingTextPayload, waitFor,
};