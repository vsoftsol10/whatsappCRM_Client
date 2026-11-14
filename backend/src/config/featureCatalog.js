// ======================================================================
// COPY of Super Admin  backend/config/featureCatalog.js
// Keep the `key` names identical in both projects. When you add a new
// feature in Super Admin, add the same entry here.
// ======================================================================

// ======================================================================
// FEATURE CATALOG  (single source of truth for plan features)
// ----------------------------------------------------------------------
// Every feature that a plan can switch on/off or limit is defined HERE,
// once. The Super Admin plan form is drawn from this list.
//
// To add a new CRM feature later:
//   1. Add one entry below.
//   2. In the WhatsApp CRM, check the same `key` (Stage 2).
//
// Fields
//   key          unique id saved in featureConfig (never rename it later)
//   label        text shown in the plan form
//   group        section heading in the form
//   type         "limit"         -> always on, only a limit (users, customers)
//                "toggle+limit"  -> on/off switch + limit
//                "toggle"        -> on/off switch only
//   column       (optional) existing SubscriptionPlan column that is kept
//                in sync automatically, so the current CRM checks keep working
//   defaultLimit starting value for a NEW plan (null = unlimited)
//   defaultOn    starting switch value for a NEW plan / newly added feature
//   hint         small helper text under the label
// ======================================================================

const FEATURE_CATALOG = [
  // ---------------- Core ----------------
  {
    key: "users",
    label: "Users (Employees)",
    group: "Core",
    type: "limit",
    column: "maxUsers",
    defaultLimit: 5,
    defaultOn: true,
  },
  {
    key: "customers",
    label: "Customers",
    group: "Core",
    type: "limit",
    column: "maxCustomers",
    defaultLimit: 1000,
    defaultOn: true,
  },
  {
    key: "campaigns",
    label: "Campaigns",
    group: "Core",
    type: "toggle+limit",
    column: "maxCampaigns",
    defaultLimit: 10,
    defaultOn: true,
  },
  {
    key: "templates",
    label: "Templates",
    group: "Core",
    type: "toggle+limit",
    column: "maxTemplates",
    defaultLimit: 10,
    defaultOn: true,
  },

  // ---------------- Channels ----------------
  {
    key: "facebook",
    label: "Facebook Messenger (Pages)",
    group: "Channels",
    type: "toggle+limit",
    column: "maxFacebookPages",
    defaultLimit: 1,
    defaultOn: true,
  },
  {
    key: "instagram",
    label: "Instagram (Accounts)",
    group: "Channels",
    type: "toggle+limit",
    column: "maxInstagramAccounts",
    defaultLimit: 1,
    defaultOn: true,
  },

  // ---------------- CRM modules ----------------
  { key: "leads", label: "Leads", group: "CRM Modules", type: "toggle", defaultOn: true },
  { key: "services", label: "Services", group: "CRM Modules", type: "toggle", defaultOn: true },
  { key: "proposals", label: "Proposals", group: "CRM Modules", type: "toggle", defaultOn: true },
  { key: "tasks", label: "Tasks", group: "CRM Modules", type: "toggle", defaultOn: true },
  { key: "tickets", label: "Support Tickets", group: "CRM Modules", type: "toggle", defaultOn: true },

  // ---------------- AI ----------------
  { key: "aiAutoReply", label: "AI Auto-Reply", group: "AI", type: "toggle", defaultOn: true },
  { key: "knowledgeBase", label: "Knowledge Base", group: "AI", type: "toggle", defaultOn: true },

  // ---------------- Integrations ----------------
  {
    key: "websiteIntegration",
    label: "Website Integrations",
    group: "Integrations",
    type: "toggle+limit",
    column: "maxWebsiteIntegrations",
    defaultLimit: 1,
    defaultOn: true,
  },
  {
    key: "appIntegration",
    label: "App Integrations (E-commerce, Billing, Custom)",
    group: "Integrations",
    type: "toggle+limit",
    column: "maxAppIntegrations",
    defaultLimit: 1,
    defaultOn: true,
  },

  // ---------------- Other ----------------
  { key: "autoBackup", label: "Automatic Backup", group: "Other", type: "toggle", defaultOn: true },
  { key: "auditLog", label: "Audit Log", group: "Other", type: "toggle", defaultOn: true },
];

const CATALOG_BY_KEY = Object.fromEntries(FEATURE_CATALOG.map((f) => [f.key, f]));

// Reads a limit coming from the form. null / "" / -1 => unlimited (null).
// Returns { ok, value } where value is null (unlimited) or an integer >= 0.
const parseLimit = (raw) => {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null };
  const n = Number(raw);
  if (!Number.isInteger(n)) return { ok: false, value: null };
  if (n === -1) return { ok: true, value: null };
  if (n < 0) return { ok: false, value: null };
  return { ok: true, value: n };
};

// Builds a full config (every catalog key) from a plan's old columns.
// Used for plans created before featureConfig existed.
const configFromLegacyColumns = (plan = {}) => {
  const config = {};

  for (const f of FEATURE_CATALOG) {
    if (f.type === "toggle") {
      config[f.key] = { enabled: true };
      continue;
    }

    const stored = plan[f.column];
    const hasValue = stored !== undefined && stored !== null;

    if (!hasValue) {
      config[f.key] = f.type === "limit"
        ? { enabled: true, limit: f.defaultLimit ?? null }
        : { enabled: f.defaultOn !== false, limit: f.defaultLimit ?? null };
      continue;
    }

    if (stored === -1) {
      config[f.key] = { enabled: true, limit: null };
    } else if (f.type === "toggle+limit" && stored === 0) {
      config[f.key] = { enabled: false };
    } else {
      config[f.key] = { enabled: true, limit: stored };
    }
  }

  return config;
};

// Turns whatever is stored / sent into a clean, complete config.
//  - unknown keys are dropped
//  - keys missing (for example a feature added to the catalog later)
//    fall back to the old columns or the catalog default
//  - disabled features never keep a limit
const normalizeFeatureConfig = (input, plan = {}) => {
  const fallback = configFromLegacyColumns(plan);
  const source = input && typeof input === "object" ? input : {};
  const config = {};

  for (const f of FEATURE_CATALOG) {
    const raw = source[f.key];

    if (!raw || typeof raw !== "object") {
      config[f.key] = fallback[f.key];
      continue;
    }

    if (f.type === "toggle") {
      config[f.key] = { enabled: raw.enabled !== false };
      continue;
    }

    const enabled = f.type === "limit" ? true : raw.enabled !== false;

    if (!enabled) {
      config[f.key] = { enabled: false };
      continue;
    }

    const parsed = parseLimit(raw.limit);
    config[f.key] = { enabled: true, limit: parsed.ok ? parsed.value : null };
  }

  return config;
};

// Checks a config sent from the form. Returns an error message or null.
const validateFeatureConfig = (input) => {
  if (!input || typeof input !== "object") return "Features and limits are missing";

  for (const f of FEATURE_CATALOG) {
    const raw = input[f.key];
    if (!raw || typeof raw !== "object") continue; // missing -> default is used

    if (f.type === "toggle") continue;

    const enabled = f.type === "limit" ? true : raw.enabled !== false;
    if (!enabled) continue;

    const parsed = parseLimit(raw.limit);
    if (!parsed.ok) {
      return `${f.label}: enter a whole number (0 or more) or tick Unlimited`;
    }

    if (f.key === "users" && parsed.value !== null && parsed.value < 1) {
      return "Users: the limit must be at least 1";
    }

    if (f.type === "toggle+limit" && parsed.value === 0) {
      return `${f.label}: use the switch to turn it off instead of setting 0`;
    }
  }

  return null;
};

// Old columns (-1 = unlimited, 0 = not included) filled from the config,
// so everything in the CRM that reads the old columns keeps working.
const columnsFromConfig = (config) => {
  const columns = {};

  for (const f of FEATURE_CATALOG) {
    if (!f.column) continue;
    const entry = config[f.key];

    if (!entry || entry.enabled === false) {
      columns[f.column] = 0;
    } else {
      columns[f.column] = entry.limit === null || entry.limit === undefined ? -1 : entry.limit;
    }
  }

  return columns;
};

// Every feature switched on / unlimited (used for custom plans).
const fullAccessConfig = () => {
  const config = {};
  for (const f of FEATURE_CATALOG) {
    config[f.key] = f.type === "toggle" ? { enabled: true } : { enabled: true, limit: null };
  }
  return config;
};

// Short list used by the plan card.
const buildFeatureSummary = (config) =>
  FEATURE_CATALOG.map((f) => ({
    key: f.key,
    label: f.label,
    group: f.group,
    type: f.type,
    enabled: config[f.key]?.enabled !== false,
    limit: config[f.key]?.limit ?? null,
  }));

module.exports = {
  FEATURE_CATALOG,
  CATALOG_BY_KEY,
  normalizeFeatureConfig,
  validateFeatureConfig,
  columnsFromConfig,
  fullAccessConfig,
  buildFeatureSummary,
};