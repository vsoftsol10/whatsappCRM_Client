// ============================================
// COMPANY KNOWLEDGE BASE (admin CRUD)
// ============================================
// The AI auto-reply answers from these entries (see services/ai/knowledgeBase.js).
//
// TENANT ISOLATION: companyId ALWAYS comes from the logged-in admin's token
// (req.user.companyId), never from the request body, query or URL.
// Updates and deletes filter on { id, companyId } in the query itself, so
// another company's entry id simply behaves as "not found" (404).

const prisma = require("../config/prisma");

const {
  MAX_ENTRIES_PER_COMPANY,
  DEFAULT_CATEGORY,
  sanitizeEntry,
} = require("../services/kbEntryRules");
const {
  ImportError,
  previewImport,
  applyImport,
} = require("../services/kbImportService");

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

const notFound = (res) =>
  res.status(404).json({ success: false, message: "Knowledge base entry not found" });

const serverError = (res, label, error, message) => {
  console.error(`${label}:`, error);
  return res.status(500).json({ success: false, message });
};

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const serialize = (entry) => ({
  id: entry.id,
  title: entry.title,
  category: entry.category,
  keywords: entry.keywords || "",
  content: entry.content,
  isActive: entry.isActive,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});

// ============================================
// GET /api/knowledge-base?search=&status=&page=&limit=
// ============================================
const listEntries = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = String(req.query.search || "").trim().slice(0, 100);
    const status = String(req.query.status || "all");

    const where = { companyId };

    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { keywords: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [entries, total, totalAll, totalActive, settings] = await Promise.all([
      prisma.kbEntry.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kbEntry.count({ where }),
      prisma.kbEntry.count({ where: { companyId } }),
      prisma.kbEntry.count({ where: { companyId, isActive: true } }),
      prisma.aiSettings.findUnique({
        where: { companyId },
        select: { useKnowledgeBase: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      entries: entries.map(serialize),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
      stats: {
        total: totalAll,
        active: totalActive,
        inactive: totalAll - totalActive,
        limit: MAX_ENTRIES_PER_COMPANY,
      },
      // No AiSettings row yet = default (on)
      useKnowledgeBase: settings ? settings.useKnowledgeBase !== false : true,
    });
  } catch (error) {
    return serverError(res, "List KB entries error", error, "Failed to fetch knowledge base");
  }
};

// ============================================
// POST /api/knowledge-base
// ============================================
const createEntry = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);

    const { data, error } = sanitizeEntry(req.body, { partial: false });
    if (error) return badRequest(res, error);

    const total = await prisma.kbEntry.count({ where: { companyId } });

    if (total >= MAX_ENTRIES_PER_COMPANY) {
      return badRequest(
        res,
        `You can keep up to ${MAX_ENTRIES_PER_COMPANY} knowledge base entries. Delete or merge some first.`
      );
    }

    const entry = await prisma.kbEntry.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category || DEFAULT_CATEGORY,
        keywords: data.keywords || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        companyId, // from the token, never from the body
        createdById: req.user.userId ? String(req.user.userId) : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Knowledge base entry added",
      entry: serialize(entry),
    });
  } catch (error) {
    return serverError(res, "Create KB entry error", error, "Failed to add entry");
  }
};

// ============================================
// PATCH /api/knowledge-base/:id
// ============================================
const updateEntry = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);
    const id = parseId(req.params.id);

    if (!id) return notFound(res);

    const { data, error } = sanitizeEntry(req.body, { partial: true });
    if (error) return badRequest(res, error);

    if (Object.keys(data).length === 0) {
      return badRequest(res, "Nothing to update");
    }

    // { id, companyId } in the WHERE: another company's id matches nothing.
    const result = await prisma.kbEntry.updateMany({
      where: { id, companyId },
      data,
    });

    if (result.count === 0) return notFound(res);

    const entry = await prisma.kbEntry.findFirst({ where: { id, companyId } });

    return res.status(200).json({
      success: true,
      message: "Knowledge base entry updated",
      entry: serialize(entry),
    });
  } catch (error) {
    return serverError(res, "Update KB entry error", error, "Failed to update entry");
  }
};

// ============================================
// DELETE /api/knowledge-base/:id
// ============================================
const deleteEntry = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);
    const id = parseId(req.params.id);

    if (!id) return notFound(res);

    const result = await prisma.kbEntry.deleteMany({ where: { id, companyId } });

    if (result.count === 0) return notFound(res);

    return res.status(200).json({
      success: true,
      message: "Knowledge base entry deleted",
    });
  } catch (error) {
    return serverError(res, "Delete KB entry error", error, "Failed to delete entry");
  }
};

// ============================================
// IMPORT FROM CSV / EXCEL
// ============================================
// POST /api/knowledge-base/import/preview   (file + mode) -> what would happen
// POST /api/knowledge-base/import           (file + mode) -> does it
// mode: "update" (default) = same title replaces the existing entry
//       "skip"             = same title is left as it is
const importFailure = (res, label, error) =>
  error instanceof ImportError
    ? res.status(error.statusCode).json({ success: false, message: error.message })
    : serverError(res, label, error, "The import failed");

const previewEntries = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);
    const mode = String(req.body?.mode || "update");

    const result = await previewImport(companyId, req.file, mode);

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return importFailure(res, "Preview KB import error", error);
  }
};

const importEntries = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);
    const mode = String(req.body?.mode || "update");

    const result = await applyImport(companyId, req.file, mode, req.user.userId);

    return res.status(200).json({
      success: true,
      message: `Import finished: ${result.created} added, ${result.updated} updated`,
      ...result,
    });
  } catch (error) {
    return importFailure(res, "KB import error", error);
  }
};

// ============================================
// DELETE ALL (this company only, typed confirmation)
// ============================================
const DELETE_ALL_PHRASE = "DELETE ALL";

const deleteAllEntries = async (req, res) => {
  try {
    const companyId = Number(req.user.companyId);

    if (req.body?.confirm !== DELETE_ALL_PHRASE) {
      return badRequest(res, `Type ${DELETE_ALL_PHRASE} to confirm`);
    }

    const result = await prisma.kbEntry.deleteMany({ where: { companyId } });

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.count} entries`,
      deleted: result.count,
    });
  } catch (error) {
    return serverError(res, "Delete all KB entries error", error, "Failed to delete entries");
  }
};

module.exports = {
  MAX_ENTRIES_PER_COMPANY,
  DELETE_ALL_PHRASE,
  sanitizeEntry,
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  previewEntries,
  importEntries,
  deleteAllEntries,
};