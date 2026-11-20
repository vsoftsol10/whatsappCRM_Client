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
  campaigns: "+ Add Campaigns",
  templates: "+ Add Template",
  tasks: "+ Add Tasks",
  tickets: "+ Add Tickets",
  services: "+ Add Services",
  employees: "+ Add Employees",
  integrations: "+ Add Integration",
  instagram: "+ Add Instagram Integration",
  "ai-auto-reply": "Open AI Auto reply",
  backup: "Open Backup & Restore",
  support: "Open Support",
  "audit-logs": "Open Audit logs",
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
