
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requireFeature");
const allowWriteAccess = require("../middleware/allowWriteAccess");

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
} = require("../controllers/taskController");

const {
  getTaskWorkNotes,
  createTaskWorkNote,
  updateTaskWorkNote,
  deleteTaskWorkNote,
} = require("../controllers/taskworknoteController");

// Apply authentication to all routes
router.use(authMiddleware, requireFeature("tasks"));

/////////////////////////////////////////////////
// READ ROUTES (Allowed for everyone)
/////////////////////////////////////////////////

// Get All Tasks
router.get("/", getTasks);

// Get Single Task
router.get("/:id", getTaskById);

// Get Task Work Notes
router.get("/:id/work-notes", getTaskWorkNotes);

/////////////////////////////////////////////////
// WRITE ROUTES (Only ACTIVE / TRIAL companies)
/////////////////////////////////////////////////

// Create Task
router.post(
  "/",
  allowWriteAccess,
  createTask
);

// Update Task
router.put(
  "/:id",
  allowWriteAccess,
  updateTask
);

// Update Task Status
router.patch(
  "/:id/status",
  allowWriteAccess,
  updateTaskStatus
);

// Delete Task
router.delete(
  "/:id",
  allowWriteAccess,
  deleteTask
);

// Create Task Work Note
router.post(
  "/:id/work-notes",
  allowWriteAccess,
  createTaskWorkNote
);

// Update Task Work Note
router.put(
  "/work-notes/:noteId",
  allowWriteAccess,
  updateTaskWorkNote
);

// Delete Task Work Note
router.delete(
  "/work-notes/:noteId",
  allowWriteAccess,
  deleteTaskWorkNote
);

module.exports = router;