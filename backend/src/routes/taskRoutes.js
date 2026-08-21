// const express = require("express");

// const router = express.Router();

// const {
//   createTask,
//   getTasks,
//   getTaskById,
//   updateTask,
//   deleteTask,
//   updateTaskStatus,
// } = require("../controllers/taskController");

// const {
//   getTaskWorkNotes,
//   createTaskWorkNote,
//   updateTaskWorkNote,
//   deleteTaskWorkNote,
// } = require("../controllers/taskworknoteController");

// const authMiddleware = require("../middleware/authMiddleware");


// // ================= WORK NOTES =================

// // Get task work notes
// router.get(
//   "/:id/work-notes",
//   authMiddleware,
//   getTaskWorkNotes
// );


// // Create task work note
// router.post(
//   "/:id/work-notes",
//   authMiddleware,
//   createTaskWorkNote
// );


// // Update work note
// router.put(
//   "/work-notes/:noteId",
//   authMiddleware,
//   updateTaskWorkNote
// );


// // Delete work note
// router.delete(
//   "/work-notes/:noteId",
//   authMiddleware,
//   deleteTaskWorkNote
// );


// // ================= TASK CRUD =================


// // Create Task
// router.post(
//   "/",
//   authMiddleware,
//   createTask
// );


// // Get All Tasks
// router.get(
//   "/",
//   authMiddleware,
//   getTasks
// );


// // Get Single Task
// router.get(
//   "/:id",
//   authMiddleware,
//   getTaskById
// );


// // Update Task
// router.put(
//   "/:id",
//   authMiddleware,
//   updateTask
// );


// // Update Task Status
// router.patch(
//   "/:id/status",
//   authMiddleware,
//   updateTaskStatus
// );


// // Delete Task
// router.delete(
//   "/:id",
//   authMiddleware,
//   deleteTask
// );


// module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
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
router.use(authMiddleware);

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