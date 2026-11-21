// src/components/guide/guideUtils.js
//
// Small helpers shared by the module guide (first-visit panel + header icon).

// Which page shows which guide (module ids come from src/data/userGuide.js)
export const GUIDE_ROUTES = {
  "/customers": "customers",
  "/leads": "leads",
  "/campaigns": "campaigns",
  "/templates": "templates",
  "/services": "services",
  "/tasks": "tasks",
  "/tickets": "tickets",
  "/employees": "employees",
  "/instagram-conversations": "instagram",
  "/settings/integrations": "integrations",
  "/settings/ai-auto-reply": "ai-auto-reply",
  "/settings/backup": "backup",
  "/settings/support": "support",
  "/settings/audit-logs": "audit-logs",
};

// "/customers/" -> "customers"; "/customers/add" -> undefined (not a module page)
export const getGuideModuleId = (pathname = "") => {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return GUIDE_ROUTES[clean];
};

// Text of the green button for each module (first-visit panel)
export const PRIMARY_LABELS = {
  customers: "+ Add Customer",
  leads: "+ Add Leads",
  campaigns: "+ Create Campaigns",
  templates: "+ Create Template",
  tasks: "+ Add Task",
  tickets: "+ Add Ticket",
  services: "+ Add Service",
  employees: "+ Add Employee",
  integrations: "+ Add Integration",
  instagram: "+ Add Instagram Integration",
  "ai-auto-reply": "Open AI Auto reply",
  backup: "Open Backup & Restore",
  support: "Open Support",
  "audit-logs": "Open Audit logs",
};

// Page title + subtitle shown above the guide on the first visit
// (same wording as each page's own header)
export const GUIDE_HEADERS = {
  customers: { title: "Customers", subtitle: "Manage your customer records" },
  leads: { title: "Leads", subtitle: "Manage your WhatsApp CRM leads" },
  campaigns: { title: "Campaigns", subtitle: "Manage your marketing campaigns" },
  templates: { title: "Templates", subtitle: "Manage and monitor your templates" },
  tasks: { title: "Tasks", subtitle: "Manage and monitor your tasks" },
  tickets: { title: "Tickets", subtitle: "Manage customer support tickets" },
  services: {
    title: "Services",
    subtitle: "Group your customers by service to send targeted campaigns",
  },
  employees: {
    title: "Manage Employees",
    subtitle: "Manage your employees, roles and department information.",
  },
  integrations: { title: "Integrations", subtitle: "Connect your tools and channels" },
  instagram: { title: "Instagram", subtitle: "Connect and manage your Instagram messages" },
  "ai-auto-reply": { title: "AI Auto Reply", subtitle: "Let AI reply to your customers" },
  backup: { title: "Backup & Restore", subtitle: "Back up and restore your data" },
  support: { title: "Support", subtitle: "Get help from the Vatup team" },
  "audit-logs": { title: "Audit Logs", subtitle: "See who did what in your CRM" },
};

// Modules whose green button opens the page's own "add" form
export const ADD_FORM_MODULES = [
  "leads",
  "campaigns",
  "templates",
  "tasks",
  "tickets",
  "services",
  "employees",
];

// ...of those, only admins can add
export const ADMIN_ONLY_ADD = ["tasks", "tickets", "services"];

/* ---------- "open the add form after the guide" hand-over ---------- */
// The guide asks, the module page (useGuideAutoOpen) opens its form once.
let pendingOpen = null;

export const requestGuideOpen = (moduleId) => {
  pendingOpen = moduleId;
};

export const consumeGuideOpen = (moduleId) => {
  if (pendingOpen !== moduleId) return false;
  pendingOpen = null;
  return true;
};

/* ---------- "seen" flag (per user, per module, in this browser) ---------- */
const STORAGE_PREFIX = "vatup_module_guide_v1";
const storageKey = (userId, moduleId) => `${STORAGE_PREFIX}_${userId}_${moduleId}`;

export const hasSeenGuide = (userId, moduleId) => {
  try {
    return localStorage.getItem(storageKey(userId, moduleId)) === "seen";
  } catch {
    return false;
  }
};

export const markGuideSeen = (userId, moduleId) => {
  try {
    localStorage.setItem(storageKey(userId, moduleId), "seen");
  } catch {
    /* storage blocked - the guide may show again, that's fine */
  }
};

/* Accepts the YouTube <iframe> code, a normal link, a youtu.be link or just
   the 11-character video ID (same formats as the User Guide page). */
export function parseYouTube(input) {
  const text = String(input || "").trim().replace(/&amp;/g, "&");
  if (!text) return null;

  const srcMatch = text.match(/src=["']([^"']+)["']/i);
  const url = srcMatch ? srcMatch[1] : text;

  const idMatch = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|watch\?(?:[^#\s]*&)?v=))([A-Za-z0-9_-]{11})/
  );
  const id = idMatch ? idMatch[1] : /^[A-Za-z0-9_-]{11}$/.test(url) ? url : null;
  if (!id) return null;

  const timeMatch = url.match(/[?&](?:start|t)=(\d+)/);
  return { id, start: timeMatch ? Number(timeMatch[1]) : 0 };
}