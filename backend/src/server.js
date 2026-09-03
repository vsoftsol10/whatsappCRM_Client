// const dns = require("dns");
// dns.setDefaultResultOrder("ipv4first");

// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();

// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const customerRoutes = require("./routes/customerRoutes");
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

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/customers", customerRoutes);
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
// app.use("/api/notifications", userNotificationRoutes);
// app.use("/api/subscriptions", subscriptionRoutes);
// app.use("/api/subscriptions", planRoutes);
// app.use("/api/upgrade-requests", upgradeRequestRoutes);

// // Test route
// app.get("/", (req, res) => {
//   res.send("Backend is running...");
// });

// app.use(
//   "/api/support-tickets",
//   supportTicketRoutes
// );

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



const dns = require("dns");
// Render's network doesn't have a working IPv6 route, but Node 17+
// resolves hostnames IPv6-first by default. This breaks outbound
// connections like Gmail SMTP (nodemailer) with ENETUNREACH.
// Forcing IPv4-first resolution for the whole process fixes it.
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
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


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
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
app.use("/api/webhook", webhookRoutes);
app.use("/api/user-notifications", userNotificationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/subscriptions", planRoutes);
app.use("/api/upgrade-requests", upgradeRequestRoutes);
app.use("/api/audit-logs", auditLogRoutes);
const saasWebhookRoutes = require("./routes/saasWebhook");
app.use(
  "/api/whatsapp/accounts",
  whatsappAccountRoutes
);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

app.use(
  "/api/saas/webhook",
  saasWebhookRoutes
);

app.use(
  "/api/support-tickets",
  supportTicketRoutes
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
});