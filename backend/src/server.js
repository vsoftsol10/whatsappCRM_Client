// const dns = require("dns");
// dns.setDefaultResultOrder("ipv4first");
 
// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();
 
 
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
// const webhookRoutes = require("./routes/webhook");
// const userNotificationRoutes = require("./routes/userNotificationRoutes");
// const subscriptionRoutes = require("./routes/subscriptionRoutes");
// const planRoutes = require("./routes/planRoutes");
// const upgradeRequestRoutes = require("./routes/upgradeRequestRoutes");
// const supportTicketRoutes = require("./routes/supportTicketRoutes");
// const auditLogRoutes = require("./routes/auditLogRoutes");
// const whatsappAccountRoutes = require("./routes/whatsappAccountRoutes");
// const aiSettingsRoutes = require("./routes/aiSettingsRoutes");
// const backupRoutes = require("./routes/backupRoutes");
 
// const saasWebhookRoutes = require("./routes/saasWebhook");
 
// const app = express();
 
 
// // ======================================================
// // GLOBAL MIDDLEWARE
// // ======================================================
 
// app.use(
//   cors({
//     origin: true,
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
// // DEBUG BODY MIDDLEWARE
// // ======================================================
 
// app.use((req, res, next) => {
//   if (
//     req.path.includes("/customers/import") ||
//     req.path.includes("/customers")
//   ) {
//     console.log("========================================");
//     console.log("REQUEST:", req.method, req.originalUrl);
//     console.log("CONTENT-TYPE:", req.headers["content-type"]);
//     console.log("BODY:", req.body);
//     console.log("========================================");
//   }
 
//   next();
// });
 
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
 
// app.use("/api/webhook", webhookRoutes);
 
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
 
// app.use(
//   "/api/whatsapp/accounts",
//   whatsappAccountRoutes
// );
 
// app.use(
//   "/api/saas/webhook",
//   saasWebhookRoutes
// );
 
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
 
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || "Internal Server Error",
//   });
// });
 
// // ======================================================
// // START SERVER
// // ======================================================
 
// const PORT = process.env.PORT || 5000;
 
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(
//     "FRONTEND_URL:",
//     process.env.FRONTEND_URL
//   );
// });



const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
 
const express = require("express");
const cors = require("cors");
require("dotenv").config();
 
 
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
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
const webhookRoutes = require("./routes/webhook");
const userNotificationRoutes = require("./routes/userNotificationRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const planRoutes = require("./routes/planRoutes");
const upgradeRequestRoutes = require("./routes/upgradeRequestRoutes");
const supportTicketRoutes = require("./routes/supportTicketRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const whatsappAccountRoutes = require("./routes/whatsappAccountRoutes");
const aiSettingsRoutes = require("./routes/aiSettingsRoutes");
const backupRoutes = require("./routes/backupRoutes");
 
const saasWebhookRoutes = require("./routes/saasWebhook");
const verifyMetaWebhookSignature = require("./middleware/verifyMetaWebhookSignature");
 
const app = express();
 
 
// ======================================================
// GLOBAL MIDDLEWARE
// ======================================================
 
app.use(
  cors({
    origin: true,
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
// DEBUG BODY MIDDLEWARE
// ======================================================
 
app.use((req, res, next) => {
  if (
    req.path.includes("/customers/import") ||
    req.path.includes("/customers")
  ) {
    console.log("========================================");
    console.log("REQUEST:", req.method, req.originalUrl);
    console.log("CONTENT-TYPE:", req.headers["content-type"]);
    console.log("BODY:", req.body);
    console.log("========================================");
  }
 
  next();
});
 
// ======================================================
// API ROUTES
// ======================================================
 
app.use("/api/auth", authRoutes);
 
app.use("/api/users", userRoutes);
 
app.use("/api/customers", customerRoutes);
 
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
 
app.use("/api/webhook", verifyMetaWebhookSignature, webhookRoutes);
 
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
 
app.use(
  "/api/whatsapp/accounts",
  whatsappAccountRoutes
);
 
app.use(
  "/api/saas/webhook",
  verifyMetaWebhookSignature,
  saasWebhookRoutes
);
 
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
 
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
 
// ======================================================
// START SERVER
// ======================================================
 
const PORT = process.env.PORT || 5000;
 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    "FRONTEND_URL:",
    process.env.FRONTEND_URL
  );
});