
// const dns = require("dns");
// dns.setDefaultResultOrder("ipv4first");
 
// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");
// require("dotenv").config();
// const { initSocket } = require("./socket");
 
// const publicLeadRoutes = require("./routes/publicLeadRoutes");
// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const customerRoutes = require("./routes/customerRoutes");
// const integrationRoutes = require("./routes/integrationRoutes");
// const employeeRoutes = require("./routes/employeeRoutes");
// const conversationRoutes = require("./routes/conversationRoutes");
// const messageRoutes = require("./routes/messageRoutes");
// const dashboardRoutes = require("./routes/dashboardRoutes");
// const leadRoutes = require("./routes/leadRoutes");
// const campaignRoutes = require("./routes/campaignRoutes");
// const templateRoutes = require("./routes/templateRoutes");
// const taskRoutes = require("./routes/taskRoutes");
// const ticketRoutes = require("./routes/ticketRoutes");
// const dealRoutes = require("./routes/dealRoutes");
// const dealActivityRoutes = require("./routes/dealActivityRoutes");
// // const webhookRoutes = require("./routes/webhook"); // legacy, replaced (see below)
// const userNotificationRoutes = require("./routes/userNotificationRoutes");
// const subscriptionRoutes = require("./routes/subscriptionRoutes");
// const planRoutes = require("./routes/planRoutes");
// const upgradeRequestRoutes = require("./routes/upgradeRequestRoutes");
// const supportTicketRoutes = require("./routes/supportTicketRoutes");
// const auditLogRoutes = require("./routes/auditLogRoutes");
// const whatsappAccountRoutes = require("./routes/whatsappAccountRoutes");
// const aiSettingsRoutes = require("./routes/aiSettingsRoutes");
// const companyRoutes = require("./routes/companyRoutes");
// const backupRoutes = require("./routes/backupRoutes");
 
// const saasWebhookRoutes = require("./routes/saasWebhook");
// const verifyMetaWebhookSignature = require("./middleware/verifyMetaWebhookSignature");
// const facebookRoutes = require("./routes/facebookRoutes");
// const facebookWebhookRoutes = require("./routes/facebookWebhook");
// const instagramRoutes = require("./routes/instagramRoutes");
// const {
//   startInstagramTokenRefreshJob,
// } = require("./jobs/instagramTokenRefresh");
// const {
//   startCampaignScheduler,
// } = require("./jobs/campaignScheduler");
 
// const app = express();
 
 
// // ======================================================
// // GLOBAL MIDDLEWARE
// // ======================================================
 
// // Use the configured CRM frontend origin(s), rather than reflecting any
// // requesting origin. FRONTEND_URL may contain comma-separated origins.
// const allowedFrontendOrigins = (process.env.FRONTEND_URL || "https://watsupcl.thevsoft.com")
//   .split(",")
//   .map((origin) => origin.trim().replace(/\/$/, ""))
//   .filter(Boolean);

// // Render (and most hosts) put a proxy in front of the app. Trust the first
// // proxy so req.ip is the real visitor IP - otherwise everyone shares one
// // rate-limit bucket and express-rate-limit logs ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
// app.set("trust proxy", 1);

// app.use(helmet());

// // General API protection. Configure trust proxy correctly in production if
// // running behind a reverse proxy so client IP-based limits are accurate.
// // The CRM screen itself makes many calls (chat list, messages, status...), so
// // the general limit is higher than before (was 300 per 15 min, which a few
// // busy agents behind one IP could hit). Override with API_RATE_LIMIT_MAX.
// // Meta's webhooks are NOT limited here: they have their own signature check,
// // and limiting them could make incoming messages arrive late or get lost.
// app.use("/api", rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: Number(process.env.API_RATE_LIMIT_MAX) || 3000,
//   standardHeaders: "draft-7",
//   legacyHeaders: false,
//   skip: (req) => /^\/(webhook|saas\/webhook|facebook\/webhook)(\/|$)/.test(req.path),
//   message: { success: false, message: "Too many requests. Please try again later." },
// }));

// // Login / password routes keep the original strict limit (300 per 15 min).
// app.use("/api/auth", rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 300,
//   standardHeaders: "draft-7",
//   legacyHeaders: false,
//   message: { success: false, message: "Too many requests. Please try again later." },
// }));

// // This public widget intentionally handles its own CORS before the CRM-wide
// // CORS middleware because customer websites submit leads from their domains.
// app.use("/api/public", publicLeadRoutes);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Requests without an Origin header (e.g. server-to-server webhooks)
//       // are not browser CORS requests and remain allowed.
//       if (!origin || allowedFrontendOrigins.includes(origin.replace(/\/$/, ""))) {
//         return callback(null, true);
//       }
//       // Show WHICH origin was blocked, so it can be added to FRONTEND_URL
//       console.warn(
//         "CORS blocked origin:",
//         origin,
//         "| allowed:",
//         allowedFrontendOrigins.join(", ")
//       );
//       return callback(new Error("Origin not allowed by CORS"));
//     },
//     credentials: true,
//   })
// );
 
// // Parse JSON requests
// //
// // UPDATED: `verify` captures the exact raw request bytes onto
// // req.rawBody BEFORE Express parses/re-serializes them as a JS
// // object. Webhook signature schemes (Stripe, Razorpay, etc.)
// // hash the exact bytes the provider sent - re-serializing
// // req.body back to JSON is NOT guaranteed to produce identical
// // bytes (key order, spacing), so signature checks would
// // intermittently fail without this. See
// // integrations/adapters/*.js for where req.rawBody is used.
// app.use(
//   express.json({
//     limit: "10mb",
//     verify: (req, res, buf) => {
//       req.rawBody = buf;
//     },
//   })
// );
 
// // Parse URL encoded requests
// app.use(
//   express.urlencoded({
//     extended: true,
//     limit: "10mb",
//   })
// );
 
// // ======================================================
// // API ROUTES
// // ======================================================
 
// app.use("/api/auth", authRoutes);
 
// app.use("/api/users", userRoutes);
 
// app.use("/api/customers", customerRoutes);
 
// app.use("/api/integrations", integrationRoutes);
 
 
 
// app.use("/api/employees", employeeRoutes);
 
// app.use("/api/conversations", conversationRoutes);
 
// app.use("/api/messages", messageRoutes);
 
// app.use("/api/dashboard", dashboardRoutes);
 
// app.use("/api/leads", leadRoutes);
 
// app.use("/api/campaigns", campaignRoutes);
 
// app.use("/api/templates", templateRoutes);
 
// app.use("/api/tasks", taskRoutes);
 
// app.use("/api/tickets", ticketRoutes);
 
// app.use("/api/deals", dealRoutes);
 
// app.use("/api/deals", dealActivityRoutes);
 
// // LEGACY /api/webhook: the old handler (routes/webhook.js) used findUnique on
// // non-unique fields and always threw. The URL is kept alive (in case the Meta
// // dashboard still points to it) but now runs the same handler as /api/saas/webhook.
// // app.use("/api/webhook", verifyMetaWebhookSignature, webhookRoutes);
// app.use("/api/webhook", verifyMetaWebhookSignature, saasWebhookRoutes);
 
// app.use(
//   "/api/user-notifications",
//   userNotificationRoutes
// );
 
// app.use(
//   "/api/subscriptions",
//   subscriptionRoutes
// );
 
// app.use(
//   "/api/subscriptions",
//   planRoutes
// );
 
// app.use(
//   "/api/upgrade-requests",
//   upgradeRequestRoutes
// );
 
// app.use(
//   "/api/audit-logs",
//   auditLogRoutes
// );
 
// app.use(
//   "/api/ai-settings",
//   aiSettingsRoutes
// );

// app.use("/api/company", companyRoutes);
 
// app.use(
//   "/api/whatsapp/accounts",
//   whatsappAccountRoutes
// );
 
// app.use(
//   "/api/saas/webhook",
//   verifyMetaWebhookSignature,
//   saasWebhookRoutes
// );
 
// // FACEBOOK MESSENGER
// // The webhook must be mounted BEFORE /api/facebook, because /api/facebook
// // requires a logged-in user and Meta's webhook calls are not logged in.
// app.use(
//   "/api/facebook/webhook",
//   verifyMetaWebhookSignature,
//   facebookWebhookRoutes
// );
 
// app.use("/api/facebook", facebookRoutes);

// // INSTAGRAM LOGIN (customers without Facebook)
// // /callback is public (Instagram redirects the browser there); /auth-url is admin-only.
// app.use("/api/instagram", instagramRoutes);
 
// app.use(
//   "/api/support-tickets",
//   supportTicketRoutes
// );
 
// app.use(
//   "/api/backups",
//   backupRoutes
// );
 
// // ======================================================
// // TEST ROUTE
// // ======================================================
 
// app.get("/", (req, res) => {
//   res.status(200).send("Backend is running...");
// });
 
// // ======================================================
// // GLOBAL ERROR HANDLER
// // ======================================================
 
// app.use((err, req, res, next) => {
//   console.error("========================================");
//   console.error("GLOBAL ERROR");
//   console.error(err);
//   console.error("========================================");
 
//   const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500
//     ? err.status
//     : 500;
//   res.status(status).json({
//     success: false,
//     // Never expose exception text, database details, or stack-derived data.
//     message: status === 500 ? "Internal Server Error" : "Request failed",
//   });
// });
 
// // ======================================================
// // START SERVER
// // ======================================================
 
// const PORT = process.env.PORT || 5000;
 
// const httpServer = http.createServer(app);
// initSocket(httpServer);

// httpServer.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   startInstagramTokenRefreshJob();
//   startCampaignScheduler();
//   console.log(
//     "FRONTEND_URL:",
//     process.env.FRONTEND_URL
//   );
// });






const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
 
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { initSocket } = require("./socket");
 
const publicLeadRoutes = require("./routes/publicLeadRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const integrationRoutes = require("./routes/integrationRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const leadRoutes = require("./routes/leadRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const templateRoutes = require("./routes/templateRoutes");
const taskRoutes = require("./routes/taskRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const dealRoutes = require("./routes/dealRoutes");
const dealActivityRoutes = require("./routes/dealActivityRoutes");
// const webhookRoutes = require("./routes/webhook"); // legacy, replaced (see below)
const userNotificationRoutes = require("./routes/userNotificationRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const planRoutes = require("./routes/planRoutes");
const upgradeRequestRoutes = require("./routes/upgradeRequestRoutes");
const supportTicketRoutes = require("./routes/supportTicketRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const whatsappAccountRoutes = require("./routes/whatsappAccountRoutes");
const aiSettingsRoutes = require("./routes/aiSettingsRoutes");
const companyRoutes = require("./routes/companyRoutes");
const backupRoutes = require("./routes/backupRoutes");
 
const saasWebhookRoutes = require("./routes/saasWebhook");
const verifyMetaWebhookSignature = require("./middleware/verifyMetaWebhookSignature");
const facebookRoutes = require("./routes/facebookRoutes");
const facebookWebhookRoutes = require("./routes/facebookWebhook");
const instagramRoutes = require("./routes/instagramRoutes");
const {
  startInstagramTokenRefreshJob,
} = require("./jobs/instagramTokenRefresh");
const {
  startCampaignScheduler,
} = require("./jobs/campaignScheduler");
 
const app = express();
 
 
// ======================================================
// GLOBAL MIDDLEWARE
// ======================================================
 
// Use the configured CRM frontend origin(s), rather than reflecting any
// requesting origin. FRONTEND_URL may contain comma-separated origins.
const allowedFrontendOrigins = (process.env.FRONTEND_URL || "https://watsupcl.thevsoft.com")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Render (and most hosts) put a proxy in front of the app. Trust the first
// proxy so req.ip is the real visitor IP - otherwise everyone shares one
// rate-limit bucket and express-rate-limit logs ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set("trust proxy", 1);

app.use(helmet());

// General API protection. Configure trust proxy correctly in production if
// running behind a reverse proxy so client IP-based limits are accurate.
// The CRM screen itself makes many calls (chat list, messages, status...), so
// the general limit is higher than before (was 300 per 15 min, which a few
// busy agents behind one IP could hit). Override with API_RATE_LIMIT_MAX.
// Meta's webhooks are NOT limited here: they have their own signature check,
// and limiting them could make incoming messages arrive late or get lost.
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT_MAX) || 3000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => /^\/(webhook|saas\/webhook|facebook\/webhook)(\/|$)/.test(req.path),
  message: { success: false, message: "Too many requests. Please try again later." },
}));

// Login / password routes keep the original strict limit (300 per 15 min).
app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
}));

// This public widget intentionally handles its own CORS before the CRM-wide
// CORS middleware because customer websites submit leads from their domains.
app.use("/api/public", publicLeadRoutes);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (e.g. server-to-server webhooks)
      // are not browser CORS requests and remain allowed.
      if (!origin || allowedFrontendOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      // Show WHICH origin was blocked, so it can be added to FRONTEND_URL
      console.warn(
        "CORS blocked origin:",
        origin,
        "| allowed:",
        allowedFrontendOrigins.join(", ")
      );
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);
 
// Parse JSON requests
//
// UPDATED: `verify` captures the exact raw request bytes onto
// req.rawBody BEFORE Express parses/re-serializes them as a JS
// object. Webhook signature schemes (Stripe, Razorpay, etc.)
// hash the exact bytes the provider sent - re-serializing
// req.body back to JSON is NOT guaranteed to produce identical
// bytes (key order, spacing), so signature checks would
// intermittently fail without this. See
// integrations/adapters/*.js for where req.rawBody is used.
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
 
// Parse URL encoded requests
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);
 
// ======================================================
// API ROUTES
// ======================================================
 
app.use("/api/auth", authRoutes);
 
app.use("/api/users", userRoutes);
 
app.use("/api/customers", customerRoutes);

app.use("/api/services", serviceRoutes);
 
app.use("/api/integrations", integrationRoutes);
 
 
 
app.use("/api/employees", employeeRoutes);
 
app.use("/api/conversations", conversationRoutes);
 
app.use("/api/messages", messageRoutes);
 
app.use("/api/dashboard", dashboardRoutes);
 
app.use("/api/leads", leadRoutes);
 
app.use("/api/campaigns", campaignRoutes);
 
app.use("/api/templates", templateRoutes);
 
app.use("/api/tasks", taskRoutes);
 
app.use("/api/tickets", ticketRoutes);
 
app.use("/api/deals", dealRoutes);
 
app.use("/api/deals", dealActivityRoutes);
 
// LEGACY /api/webhook: the old handler (routes/webhook.js) used findUnique on
// non-unique fields and always threw. The URL is kept alive (in case the Meta
// dashboard still points to it) but now runs the same handler as /api/saas/webhook.
// app.use("/api/webhook", verifyMetaWebhookSignature, webhookRoutes);
app.use("/api/webhook", verifyMetaWebhookSignature, saasWebhookRoutes);
 
app.use(
  "/api/user-notifications",
  userNotificationRoutes
);
 
app.use(
  "/api/subscriptions",
  subscriptionRoutes
);
 
app.use(
  "/api/subscriptions",
  planRoutes
);
 
app.use(
  "/api/upgrade-requests",
  upgradeRequestRoutes
);
 
app.use(
  "/api/audit-logs",
  auditLogRoutes
);
 
app.use(
  "/api/ai-settings",
  aiSettingsRoutes
);

app.use("/api/company", companyRoutes);
 
app.use(
  "/api/whatsapp/accounts",
  whatsappAccountRoutes
);
 
app.use(
  "/api/saas/webhook",
  verifyMetaWebhookSignature,
  saasWebhookRoutes
);
 
// FACEBOOK MESSENGER
// The webhook must be mounted BEFORE /api/facebook, because /api/facebook
// requires a logged-in user and Meta's webhook calls are not logged in.
app.use(
  "/api/facebook/webhook",
  verifyMetaWebhookSignature,
  facebookWebhookRoutes
);
 
app.use("/api/facebook", facebookRoutes);

// INSTAGRAM LOGIN (customers without Facebook)
// /callback is public (Instagram redirects the browser there); /auth-url is admin-only.
app.use("/api/instagram", instagramRoutes);
 
app.use(
  "/api/support-tickets",
  supportTicketRoutes
);
 
app.use(
  "/api/backups",
  backupRoutes
);
 
// ======================================================
// TEST ROUTE
// ======================================================
 
app.get("/", (req, res) => {
  res.status(200).send("Backend is running...");
});
 
// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================
 
app.use((err, req, res, next) => {
  console.error("========================================");
  console.error("GLOBAL ERROR");
  console.error(err);
  console.error("========================================");
 
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500
    ? err.status
    : 500;
  res.status(status).json({
    success: false,
    // Never expose exception text, database details, or stack-derived data.
    message: status === 500 ? "Internal Server Error" : "Request failed",
  });
});
 
// ======================================================
// START SERVER
// ======================================================
 
const PORT = process.env.PORT || 5000;
 
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startInstagramTokenRefreshJob();
  startCampaignScheduler();
  console.log(
    "FRONTEND_URL:",
    process.env.FRONTEND_URL
  );
});