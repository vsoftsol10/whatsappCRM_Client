// const prisma = require("../config/prisma");

// const {
//   notifyUser,
//   notifyAdmins,
//   NotificationType,
// } = require("../services/notificationService");

// // ======================================================
// // COMMON INCLUDE
// // ======================================================

// const workNoteInclude = {
//   employee: {
//     select: {
//       id: true,
//       name: true,
//       email: true,
//     },
//   },
// };

// // ======================================================
// // HELPER: check if user can view/manage notes for a task
// // ======================================================

// const canAccessTask = (user, task) => {

//   if (task.companyId !== user.companyId) {
//     return false;
//   }

//   if (user.role === "ADMIN") {
//     return true;
//   }

//   return task.assignedToId === user.userId;

// };

// // ======================================================
// // GET WORK NOTES FOR A TASK
// // ======================================================

// const getTaskWorkNotes = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const task = await prisma.task.findUnique({
//       where: { id },
//     });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     if (!canAccessTask(req.user, task)) {
//       return res.status(403).json({
//         success: false,
//         message: "You cannot view notes for this task",
//       });
//     }

//     const notes = await prisma.taskWorkNote.findMany({
//       where: { taskId: id },
//       include: workNoteInclude,
//       orderBy: { createdAt: "desc" },
//     });

//     return res.status(200).json({
//       success: true,
//       count: notes.length,
//       data: notes,
//     });
//   } catch (error) {
//     console.error("Get Task Work Notes Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch work notes",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // CREATE WORK NOTE FOR A TASK
// // ======================================================

// const createTaskWorkNote = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { note } = req.body;

//     if (!note || !note.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Note content is required",
//       });
//     }

//     const task = await prisma.task.findUnique({
//       where: { id },
//     });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     if (!canAccessTask(req.user, task)) {
//       return res.status(403).json({
//         success: false,
//         message: "You cannot add notes to this task",
//       });
//     }

//     const workNote = await prisma.taskWorkNote.create({
//       data: {
//         taskId: id,
//         employeeId: req.user.userId,
//         note: note.trim(),
//       },
//       include: workNoteInclude,
//     });

//     // ================= NOTIFICATION =================
//     try {
//       const author = await prisma.user.findUnique({
//         where: { id: req.user.userId },
//         select: { name: true },
//       });

//       const message = `${author?.name || "Someone"} updated Task "${task.title}".`;

//       if (req.user.role === "ADMIN") {
//         if (task.assignedToId && task.assignedToId !== req.user.userId) {
//           await notifyUser({
//             userId: task.assignedToId,
//             title: "New Work Note",
//             message,
//             type: NotificationType.TASK,
//           });
//         }
//       } else {
//         await notifyAdmins({
//           companyId: task.companyId,
//           title: "New Work Note",
//           message,
//           type: NotificationType.TASK,
//         });
//       }
//     } catch (notificationError) {
//       console.error(
//         "Task work note notification failed:",
//         notificationError
//       );
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Work note added successfully",
//       data: workNote,
//     });
//   } catch (error) {
//     console.error("Create Task Work Note Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to add work note",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // UPDATE WORK NOTE
// // ======================================================

// const updateTaskWorkNote = async (req, res) => {
//   try {
//     const { noteId } = req.params;
//     const { note } = req.body;

//     if (!note || !note.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Note content is required",
//       });
//     }

//     const existingNote = await prisma.taskWorkNote.findUnique({
//       where: { id: noteId },
//     });

//     if (!existingNote) {
//       return res.status(404).json({
//         success: false,
//         message: "Work note not found",
//       });
//     }

//     const isOwner = existingNote.employeeId === req.user.userId;

//     if (req.user.role !== "ADMIN" && !isOwner) {
//       return res.status(403).json({
//         success: false,
//         message: "You can only edit your own notes",
//       });
//     }

//     const updatedNote = await prisma.taskWorkNote.update({
//       where: { id: noteId },
//       data: { note: note.trim() },
//       include: workNoteInclude,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Work note updated successfully",
//       data: updatedNote,
//     });
//   } catch (error) {
//     console.error("Update Task Work Note Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update work note",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // DELETE WORK NOTE
// // ======================================================

// const deleteTaskWorkNote = async (req, res) => {
//   try {
//     const { noteId } = req.params;

//     const existingNote = await prisma.taskWorkNote.findUnique({
//       where: { id: noteId },
//     });

//     if (!existingNote) {
//       return res.status(404).json({
//         success: false,
//         message: "Work note not found",
//       });
//     }

//     const isOwner = existingNote.employeeId === req.user.userId;

//     if (req.user.role !== "ADMIN" && !isOwner) {
//       return res.status(403).json({
//         success: false,
//         message: "You can only delete your own notes",
//       });
//     }

//     await prisma.taskWorkNote.delete({
//       where: { id: noteId },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Work note deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete Task Work Note Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete work note",
//       error: error.message,
//     });
//   }
// };

// module.exports = {
//   getTaskWorkNotes,
//   createTaskWorkNote,
//   updateTaskWorkNote,
//   deleteTaskWorkNote,
// };

const prisma = require("../config/prisma");

const {
  notifyUser,
  notifyAdmins,
  NotificationType,
} = require("../services/notificationService");

// ======================================================
// COMMON INCLUDE
// ======================================================

const workNoteInclude = {
  employee: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

// ======================================================
// HELPER: check if user can view/manage notes for a task
// ======================================================

const canAccessTask = (user, task) => {

  if (task.companyId !== user.companyId) {
    return false;
  }

  if (user.role === "ADMIN") {
    return true;
  }

  return task.assignedToId === user.userId;

};

// ======================================================
// GET WORK NOTES FOR A TASK
// ======================================================

const getTaskWorkNotes = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({
        success: false,
        message: "You cannot view notes for this task",
      });
    }

    const notes = await prisma.taskWorkNote.findMany({
      where: { taskId: id },
      include: workNoteInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    console.error("Get Task Work Notes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch work notes",
      error: error.message,
    });
  }
};

// ======================================================
// CREATE WORK NOTE FOR A TASK
// ======================================================

const createTaskWorkNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({
        success: false,
        message: "You cannot add notes to this task",
      });
    }

    const workNote = await prisma.taskWorkNote.create({
      data: {
        taskId: id,
        employeeId: req.user.userId,
        note: note.trim(),
      },
      include: workNoteInclude,
    });

    // ================= NOTIFICATION =================
    try {
      const author = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { name: true },
      });

      const message = `${author?.name || "Someone"} updated Task "${task.title}".`;

      if (req.user.role === "ADMIN") {
        if (task.assignedToId && task.assignedToId !== req.user.userId) {
          await notifyUser({
            userId: task.assignedToId,
            title: "New Work Note",
            message,
            type: NotificationType.TASK,
          });
        }
      } else {
        await notifyAdmins({
          companyId: task.companyId,
          title: "New Work Note",
          message,
          type: NotificationType.TASK,
        });
      }
    } catch (notificationError) {
      console.error(
        "Task work note notification failed:",
        notificationError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Work note added successfully",
      data: workNote,
    });
  } catch (error) {
    console.error("Create Task Work Note Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add work note",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE WORK NOTE
// ======================================================

const updateTaskWorkNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const existingNote = await prisma.taskWorkNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: "Work note not found",
      });
    }

    const isOwner = existingNote.employeeId === req.user.userId;

    if (req.user.role !== "ADMIN" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own notes",
      });
    }

    const updatedNote = await prisma.taskWorkNote.update({
      where: { id: noteId },
      data: { note: note.trim() },
      include: workNoteInclude,
    });

    return res.status(200).json({
      success: true,
      message: "Work note updated successfully",
      data: updatedNote,
    });
  } catch (error) {
    console.error("Update Task Work Note Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update work note",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE WORK NOTE
// ======================================================

const deleteTaskWorkNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const existingNote = await prisma.taskWorkNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: "Work note not found",
      });
    }

    const isOwner = existingNote.employeeId === req.user.userId;

    if (req.user.role !== "ADMIN" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own notes",
      });
    }

    await prisma.taskWorkNote.delete({
      where: { id: noteId },
    });

    return res.status(200).json({
      success: true,
      message: "Work note deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Work Note Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete work note",
      error: error.message,
    });
  }
};

module.exports = {
  getTaskWorkNotes,
  createTaskWorkNote,
  updateTaskWorkNote,
  deleteTaskWorkNote,
};