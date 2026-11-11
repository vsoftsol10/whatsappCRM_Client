// Builds a real Express app from the project's REAL routes, controllers and
// middleware - only the outside world (database, email, WhatsApp, Cloudinary,
// audit log) is replaced by fakes.
require("./env");

const path = require("path");
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { createDb } = require("./fakePrisma");

const SRC = path.resolve(__dirname, "../../src");
const db = createDb();
const sentEmails = []; // password-reset emails captured instead of sent

// ---- replace modules that talk to the outside world -----------------------
const stub = (relPath, exports) => {
  const file = require.resolve(path.join(SRC, relPath));
  require.cache[file] = { id: file, filename: file, loaded: true, exports, children: [], paths: [] };
};
const noop = async () => undefined;

stub("config/prisma.js", db);
// Plan limits (billing) are a separate concern from login/roles/isolation.
const passThrough = (req, res, next) => next();
stub("middleware/planLimitMiddleware.js", new Proxy({}, { get: () => passThrough }));
stub("services/auditLogService.js", { logAction: noop, logDirect: noop });
stub("services/passwordResetEmail.js", async (to, link) => { sentEmails.push({ to, link }); });
stub("services/emailService.js", async () => undefined);
stub("services/notificationService.js", {
  notifyUser: noop, notifyAdmins: noop, NotificationType: new Proxy({}, { get: (_, k) => String(k) }),
});
stub("services/whatsappService.js", new Proxy({}, { get: () => noop }));
stub("services/cloudinaryService.js", { uploadBufferToCloudinary: noop });
stub("helpers/messengerSend.js", new Proxy({}, { get: () => noop }));
stub("middleware/mediaUploadMiddleware.js", {
  handleMediaUpload: (req, res, next) => next(), classifyMedia: () => ({}),
});
stub("middleware/voiceNoteMiddleware.js", { convertVoiceNote: (req, res, next) => next() });

// ---- the app --------------------------------------------------------------
const mount = (app, url, file) => app.use(url, require(path.join(SRC, "routes", file)));

function buildApp() {
  const app = express();
  app.use(express.json());
  mount(app, "/api/auth", "authRoutes.js");
  mount(app, "/api/users", "userRoutes.js");
  mount(app, "/api/customers", "customerRoutes.js");
  mount(app, "/api/services", "serviceRoutes.js");
  mount(app, "/api/employees", "employeeRoutes.js");
  mount(app, "/api/conversations", "conversationRoutes.js");
  mount(app, "/api/messages", "messageRoutes.js");
  mount(app, "/api/leads", "leadRoutes.js");
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

async function request(method, url, { token, body, headers } = {}) {
  const res = await fetch(baseUrl + url, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

// ---- test data ------------------------------------------------------------
const PASSWORD = "Password@123";
const HASH = bcrypt.hashSync(PASSWORD, 4); // low cost = fast tests
const future = () => new Date(Date.now() + 365 * 24 * 3600 * 1000);

function addUser(row) {
  return db.insert("user", {
    password: HASH, role: "USER", status: "ACTIVE", isFirstLogin: false,
    resetToken: null, resetTokenExpiry: null, tourSeenAt: null, ...row,
  });
}

/**
 * Two completely separate companies, each with an admin (the owner),
 * two employees, customers, leads and chats.
 */
function seedWorld() {
  db.reset();
  sentEmails.length = 0;

  const companyA = db.insert("company", { id: 1, companyId: "COM-A", companyName: "Acme Ltd", status: "ACTIVE", expiryDate: future() });
  const companyB = db.insert("company", { id: 2, companyId: "COM-B", companyName: "Bravo Ltd", status: "ACTIVE", expiryDate: future() });

  const users = {
    aAdmin: addUser({ id: "a-admin", companyId: 1, name: "Asha Admin", email: "admin@acme.test", role: "ADMIN", createdAt: new Date("2026-01-01") }),
    aEmp1: addUser({ id: "a-emp1", companyId: 1, name: "Arun Emp", email: "arun@acme.test" }),
    aEmp2: addUser({ id: "a-emp2", companyId: 1, name: "Anu Emp", email: "anu@acme.test" }),
    bAdmin: addUser({ id: "b-admin", companyId: 2, name: "Bala Admin", email: "admin@bravo.test", role: "ADMIN", createdAt: new Date("2026-01-01") }),
    bEmp: addUser({ id: "b-emp", companyId: 2, name: "Bina Emp", email: "bina@bravo.test" }),
  };

  const customers = {
    a1: db.insert("customer", { id: "cust-a1", companyId: 1, name: "Alice Acme", phone: "919000000001", email: "alice@acme-client.test", status: "ACTIVE", userId: "a-admin" }),
    a2: db.insert("customer", { id: "cust-a2", companyId: 1, name: "Arjun Acme", phone: "919000000003", email: null, status: "ACTIVE", userId: "a-admin" }),
    b1: db.insert("customer", { id: "cust-b1", companyId: 2, name: "Bravo Secret Client", phone: "919000000002", email: "secret@bravo-client.test", status: "ACTIVE", userId: "b-admin" }),
    b2: db.insert("customer", { id: "cust-b2", companyId: 2, name: "Bhavna Bravo", phone: "919000000004", email: null, status: "ACTIVE", userId: "b-admin" }),
  };

  const leads = {
    a1: db.insert("lead", { id: 1, companyId: 1, name: "Lead A1", phone: "9100000001", status: "NEW", isConverted: false, assignedToId: "a-emp1" }),
    a2: db.insert("lead", { id: 2, companyId: 1, name: "Lead A2", phone: "9100000002", status: "NEW", isConverted: false, assignedToId: "a-emp2" }),
    a3: db.insert("lead", { id: 3, companyId: 1, name: "Lead A3", phone: "9100000003", status: "NEW", isConverted: false, assignedToId: null }),
    b1: db.insert("lead", { id: 11, companyId: 2, name: "Lead B1 Confidential", phone: "9200000001", status: "NEW", isConverted: false, assignedToId: "b-emp" }),
    b2: db.insert("lead", { id: 12, companyId: 2, name: "Lead B2", phone: "9200000002", status: "NEW", isConverted: false, assignedToId: null }),
  };
  db.insert("leadWorkNote", { id: 1, leadId: 1, employeeId: "a-emp1", note: "A note" });
  db.insert("leadWorkNote", { id: 2, leadId: 11, employeeId: "b-emp", note: "B private note" });

  const conversations = {
    a1: db.insert("conversation", { id: "conv-a1", companyId: 1, customerId: "cust-a1", status: "OPEN", channel: "WHATSAPP", unreadCount: 2, botEnabled: true, lastMessage: "hi from A" }),
    b1: db.insert("conversation", { id: "conv-b1", companyId: 2, customerId: "cust-b1", status: "OPEN", channel: "WHATSAPP", unreadCount: 3, botEnabled: true, lastMessage: "hi from B" }),
  };
  const messages = {
    a1: db.insert("message", { id: "msg-a1", conversationId: "conv-a1", content: "Hello from Acme chat", sender: "CUSTOMER" }),
    b1: db.insert("message", { id: "msg-b1", conversationId: "conv-b1", content: "Bravo private message", sender: "CUSTOMER" }),
  };

  return { companyA, companyB, users, customers, leads, conversations, messages };
}

/** A real, signed login token for a seeded user (same shape as loginUser creates). */
function tokenFor(user, overrides = {}, options = { expiresIn: "1h" }) {
  return jwt.sign(
    { userId: user.id, companyId: user.companyId, role: user.role, ...overrides },
    process.env.JWT_SECRET,
    options
  );
}

module.exports = { db, api, start, stop, seedWorld, addUser, tokenFor, sentEmails, PASSWORD, bcrypt, jwt };
