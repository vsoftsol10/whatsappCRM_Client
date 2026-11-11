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
const proposalRoutes = require("./routes/proposalRoutes");
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
const userNotificationRoutes = require("./routes/userNotificationRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const planRoutes = require("./routes/planRoutes");
const upgradeRequestRoutes = require("./routes/upgradeRequestRoutes");
const billingRoutes = require("./routes/billingRoutes");
const supportTicketRoutes = require("./routes/supportTicketRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const whatsappAccountRoutes = require("./routes/whatsappAccountRoutes");
const aiSettingsRoutes = require("./routes/aiSettingsRoutes");

// Knowledge Base
const knowledgeBaseRoutes = require("./routes/knowledgeBaseRoutes");
const {
  ensureKbSearchSetup,
} = require("./services/ai/knowledgeBaseSetup");

const supportBotRoutes = require("./routes/supportBotRoutes");
const companyRoutes = require("./routes/companyRoutes");
const backupRoutes = require("./routes/backupRoutes");
const backupSettingRoutes = require("./routes/backupSettingRoutes");

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

const {
  startAutoBackupScheduler,
} = require("./jobs/autoBackupScheduler");

const app = express();

// ======================================================
// GLOBAL MIDDLEWARE
// ======================================================

// Use the configured CRM frontend origin(s), rather than reflecting any
// requesting origin. FRONTEND_URL may contain comma-separated origins.
const allowedFrontendOrigins = (
  process.env.FRONTEND_URL || "https://crm.vatupcrm.in"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Trust proxy
app.set("trust proxy", 1);

app.use(helmet());

// General API rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.API_RATE_LIMIT_MAX) || 3000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) =>
      /^\/(webhook|saas\/webhook|facebook\/webhook)(\/|$)/.test(
        req.path
      ),
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  })
);

// Authentication rate limiting
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  })
);

// Public lead routes
app.use("/api/public", publicLeadRoutes);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedFrontendOrigins.includes(origin.replace(/\/$/, ""))
      ) {
        return callback(null, true);
      }

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
app.use("/api/proposals", proposalRoutes);
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

// Legacy webhook
app.use(
  "/api/webhook",
  verifyMetaWebhookSignature,
  saasWebhookRoutes
);

app.use("/api/user-notifications", userNotificationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/subscriptions", planRoutes);
app.use("/api/upgrade-requests", upgradeRequestRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/ai-settings", aiSettingsRoutes);

// Knowledge Base routes
app.use("/api/knowledge-base", knowledgeBaseRoutes);

// AI Support chatbot
app.use("/api/support-bot", supportBotRoutes);

app.use("/api/company", companyRoutes);
app.use("/api/whatsapp/accounts", whatsappAccountRoutes);

// SaaS webhook
app.use(
  "/api/saas/webhook",
  verifyMetaWebhookSignature,
  saasWebhookRoutes
);

// ======================================================
// FACEBOOK MESSENGER
// ======================================================

// Facebook webhook
app.use(
  "/api/facebook/webhook",
  verifyMetaWebhookSignature,
  facebookWebhookRoutes
);

app.use("/api/facebook", facebookRoutes);

// Instagram login
app.use("/api/instagram", instagramRoutes);

// Support tickets
app.use("/api/support-tickets", supportTicketRoutes);

// Backup routes
app.use("/api/backups", backupRoutes);

// Automatic backup schedule (admin only)
app.use("/api/backup-settings", backupSettingRoutes);

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

  const status =
    Number.isInteger(err.status) &&
    err.status >= 400 &&
    err.status < 500
      ? err.status
      : 500;

  res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Internal Server Error"
        : "Request failed",
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

  // Knowledge Base search setup
  ensureKbSearchSetup().catch((error) =>
    console.error(
      "Knowledge base search setup skipped (run `npx prisma db push` first?):",
      error.message
    )
  );

  // Automatic backup scheduler
  startAutoBackupScheduler();

  console.log(
    "FRONTEND_URL:",
    process.env.FRONTEND_URL
  );
});