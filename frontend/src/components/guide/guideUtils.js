// src/components/guide/guideUtils.js
//
// Small helpers shared by the module guide (first-visit panel + header icon).
import apiClient from "../../api/apiClient";
import { useAuthStore } from "../../store/authStore";

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

/* ---------- "seen" flag (saved on the ACCOUNT, not in the browser) ----------
   The demo video is shown only once - the first time a new user opens a
   module after their first login. As soon as they finish it, it is saved on
   their account in the database (user.moduleGuideSeenAt). After that it is
   never shown again - not in another module, not after logout, not in a new
   browser or on another device.

   The "?" icon in the header still lets the user open any module's video
   whenever they want. */
const LOCAL_KEY_PREFIX = "vatup_module_guide_done_v2";
const localKey = (userId) => `${LOCAL_KEY_PREFIX}_${userId}`;

const getUserId = (user) => user?.id ?? user?._id ?? user?.email;

// Backup flag for this browser only - used when the server could not be reached
// at the moment the user finished the guide.
const hasLocalFlag = (userId) => {
  try {
    return localStorage.getItem(localKey(userId)) === "seen";
  } catch {
    return false;
  }
};

const setLocalFlag = (userId) => {
  try {
    localStorage.setItem(localKey(userId), "seen");
  } catch {
    /* storage blocked - the account flag below still works */
  }
};

// true  -> do NOT show the demo video
// false -> first login, show it
export const hasSeenGuide = (user) => {
  const userId = getUserId(user);
  if (!userId) return true;

  // Old session saved before this feature existed: the server value is not
  // known yet (AppLayout refreshes it a moment later). Never guess - don't show.
  if (user.moduleGuideSeenAt === undefined) return true;

  // Already finished on this account (any browser / device)
  if (user.moduleGuideSeenAt) return true;

  return hasLocalFlag(userId);
};

// Call when the user finishes the demo video (clicks the green button).
export const markGuideSeen = async () => {
  const { user } = useAuthStore.getState();
  const userId = getUserId(user);
  if (!userId) return;

  // Same browser: stop it right away, even if the request below fails
  setLocalFlag(userId);

  if (user.moduleGuideSeenAt) return;

  try {
    const response = await apiClient.post("/api/auth/module-guide-seen");

    const updatedUser = {
      ...useAuthStore.getState().user,
      moduleGuideSeenAt: response.data?.moduleGuideSeenAt || new Date().toISOString(),
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    useAuthStore.setState({ user: updatedUser });
  } catch {
    /* ignore - the browser flag above still stops it in this browser */
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