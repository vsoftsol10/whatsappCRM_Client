const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");
const allowWriteAccess = require("../middleware/allowWriteAccess");
const kbImportUpload = require("../middleware/kbImportUpload");

const {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  previewEntries,
  importEntries,
  deleteAllEntries,
} = require("../controllers/knowledgeBaseController");

const router = express.Router();

// Company knowledge base used by the AI auto-reply.
// Company admins only. Every handler scopes by req.user.companyId.
router.use(authMiddleware, adminOnly);

router.get("/", listEntries);

// Writes are blocked for inactive / expired companies (same as the rest of the CRM)
router.post("/", allowWriteAccess, createEntry);
router.patch("/:id", allowWriteAccess, updateEntry);
router.delete("/:id", allowWriteAccess, deleteEntry);

// CSV / Excel import: preview changes nothing, import does it in one transaction
router.post("/import/preview", kbImportUpload, previewEntries);
router.post("/import", allowWriteAccess, kbImportUpload, importEntries);

// Remove every entry of this company (needs {"confirm":"DELETE ALL"})
router.delete("/", allowWriteAccess, deleteAllEntries);

module.exports = router;