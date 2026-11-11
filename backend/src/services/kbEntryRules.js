// ============================================
// KNOWLEDGE BASE - SHARED RULES
// ============================================
// Limits and validation used by BOTH the admin screen API
// (controllers/knowledgeBaseController.js) and the file import
// (services/kbImportService.js), so a row is valid or invalid
// the same way everywhere.

// Entries one company may keep. Search stays fast with the index
// (tested to 20,000); raise or lower with KB_MAX_ENTRIES_PER_COMPANY.
const MAX_ENTRIES_PER_COMPANY =
  Number(process.env.KB_MAX_ENTRIES_PER_COMPANY) > 0
    ? Number(process.env.KB_MAX_ENTRIES_PER_COMPANY)
    : 5000;

const LIMITS = { title: 200, category: 60, keywords: 300, content: 4000 };
const DEFAULT_CATEGORY = "General";

// Same title (ignoring case, spacing and punctuation-free) = same entry
// when importing a price list again.
const normalizeTitle = (title) =>
  String(title || "").trim().replace(/\s+/g, " ").toLowerCase();

// Validates the fields typed by the admin (or read from a file row).
// partial = true (PATCH): only the fields that were sent are checked.
// Returns { data } or { error }.
const sanitizeEntry = (body, { partial }) => {
  const src = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const data = {};

  const text = (key, label, { required, max }) => {
    const value = src[key];

    if (value === undefined) {
      return partial || !required ? null : `${label} is required`;
    }

    if (value === null) {
      return required ? `${label} is required` : void (data[key] = null);
    }

    if (typeof value !== "string") return `${label} must be text`;

    const trimmed = value.trim();

    if (required && !trimmed) return `${label} is required`;
    if (trimmed.length > max) return `${label} must be ${max} characters or fewer`;

    data[key] = trimmed;
    return null;
  };

  const problems = [
    text("title", "Title", { required: true, max: LIMITS.title }),
    text("content", "Answer / content", { required: true, max: LIMITS.content }),
    text("category", "Category", { required: false, max: LIMITS.category }),
    text("keywords", "Keywords", { required: false, max: LIMITS.keywords }),
  ].filter(Boolean);

  if (problems.length) return { error: problems[0] };

  if (src.isActive !== undefined) {
    if (typeof src.isActive !== "boolean") {
      return { error: "isActive must be true or false" };
    }
    data.isActive = src.isActive;
  }

  if ("category" in data && !data.category) data.category = DEFAULT_CATEGORY;
  if ("keywords" in data && !data.keywords) data.keywords = null;

  return { data };
};

module.exports = {
  MAX_ENTRIES_PER_COMPANY,
  LIMITS,
  DEFAULT_CATEGORY,
  normalizeTitle,
  sanitizeEntry,
};
