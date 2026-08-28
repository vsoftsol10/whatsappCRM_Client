

// const prisma = require("../config/prisma");
// const {
//   notifyUser,
//   NotificationType,
// } = require("../services/notificationService");

// // ================= CREATE TASK =================
// const createTask = async (req, res) => {
//   try {
//     if (req.user.role !== "ADMIN") {
//       return res.status(403).json({
//         success: false,
//         message: "Only admin can create tasks",
//       });
//     }

//     const {
//       title,
//       description,
//       priority,
//       dueDate,
//       assignedToId,
//     } = req.body;

//     if (!title || !priority || !assignedToId) {
//       return res.status(400).json({
//         success: false,
//         message: "Title, priority and assigned employee are required",
//       });
//     }

//     const employee = await prisma.user.findFirst({
//       where: {
//         id: assignedToId,
//         companyId: req.user.companyId,
//         role: "USER"
//       }
//     });

//     if (!employee || employee.role !== "USER") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid employee selected",
//       });
//     }

//     const task = await prisma.task.create({
//       data: {
//         companyId: req.user.companyId,
//         title,
//         description,
//         priority,
//         dueDate: dueDate ? new Date(dueDate) : null,
//         status: "TODO",
//         createdById: req.user.userId,
//         assignedToId,
//       },
//       include: {
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     // ================= CREATE NOTIFICATION =================
//     try {
//       await notifyUser({
//         userId: assignedToId,
//         title: "New Task Assigned",
//         message: `You have been assigned a new task: "${task.title}".`,
//         type: NotificationType.TASK,
//       });
//     } catch (notificationError) {
//       console.error(
//         "Task notification failed:",
//         notificationError
//       );
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Task created successfully",
//       data: task,
//     });
//   } catch (error) {
//     console.error("Create Task Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create task",
//       error: error.message,
//     });
//   }
// };

// // ================= GET ALL TASKS =================
// const getTasks = async (req, res) => {
//   try {
//     let tasks;

//     if (req.user.role === "ADMIN") {
//       tasks = await prisma.task.findMany({
//         where: {
//           companyId: req.user.companyId
//         },
//         include: {
//           createdBy: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//           assignedTo: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//       });
//     } else {
//       tasks = await prisma.task.findMany({
//         where: {
//           assignedToId: req.user.userId,
//         },
//         include: {
//           createdBy: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//           assignedTo: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       count: tasks.length,
//       data: tasks,
//     });
//   } catch (error) {
//     console.error("Get Tasks Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch tasks",
//       error: error.message,
//     });
//   }
// };

// // ================= GET SINGLE TASK =================
// const getTaskById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const task = await prisma.task.findFirst({
//       where: {
//         id,
//         companyId: req.user.companyId
//       },
//       include: {
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     if (
//       req.user.role !== "ADMIN" &&
//       task.assignedToId !== req.user.userId
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: task,
//     });
//   } catch (error) {
//     console.error("Get Task Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch task",
//       error: error.message,
//     });
//   }
// };

// // ================= UPDATE TASK =================
// const updateTask = async (req, res) => {
//   try {
//     if (req.user.role !== "ADMIN") {
//       return res.status(403).json({
//         success: false,
//         message: "Only admin can update tasks",
//       });
//     }

//     const { id } = req.params;

//     const {
//       title,
//       description,
//       priority,
//       dueDate,
//       assignedToId,
//     } = req.body;

//     // Get existing task before update
//     const existingTask = await prisma.task.findFirst({
//       where: {
//         id,
//         companyId: req.user.companyId
//       }
//     });

//     if (!existingTask) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     if (assignedToId) {
//       const employee = await prisma.user.findFirst({
//         where: {
//           id: assignedToId,
//           companyId: req.user.companyId,
//           role: "USER"
//         }
//       });

//       if (!employee || employee.role !== "USER") {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid employee selected",
//         });
//       }
//     }

//     const task = await prisma.task.update({
//       where: {
//         id,
//       },
//       data: {
//         title,
//         description,
//         priority,
//         dueDate: dueDate ? new Date(dueDate) : null,
//         assignedToId,
//       },
//       include: {
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     // Notify only if task is assigned to a different user
//     if (
//       assignedToId &&
//       assignedToId !== existingTask.assignedToId
//     ) {
//       try {
//         await notifyUser({
//           userId: assignedToId,
//           title: "Task Assigned",
//           message: `A task has been assigned to you: "${task.title}".`,
//           type: NotificationType.TASK,
//         });
//       } catch (notificationError) {
//         console.error(
//           "Task reassignment notification failed:",
//           notificationError
//         );
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Task updated successfully",
//       data: task,
//     });
//   } catch (error) {
//     console.error("Update Task Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update task",
//       error: error.message,
//     });
//   }
// };

// // ================= DELETE TASK =================
// const deleteTask = async (req, res) => {
//   try {
//     if (req.user.role !== "ADMIN") {
//       return res.status(403).json({
//         success: false,
//         message: "Only admin can delete tasks",
//       });
//     }

//     const { id } = req.params;
//     await prisma.task.deleteMany({
//       where: {
//         id,
//         companyId: req.user.companyId
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Task deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete Task Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete task",
//       error: error.message,
//     });
//   }
// };

// // ================= UPDATE TASK STATUS =================
// const updateTaskStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const task = await prisma.task.findUnique({
//       where: {
//         id,
//       },
//     });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     if (
//       req.user.role !== "ADMIN" &&
//       task.assignedToId !== req.user.userId
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not assigned to this task",
//       });
//     }

//     const updatedTask = await prisma.task.update({
//       where: {
//         id,
//       },
//       data: {
//         status,
//       },
//       include: {
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Task status updated successfully",
//       data: updatedTask,
//     });
//   } catch (error) {
//     console.error("Update Task Status Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update task status",
//       error: error.message,
//     });
//   }
// };

// module.exports = {
//   createTask,
//   getTasks,
//   getTaskById,
//   updateTask,
//   deleteTask,
//   updateTaskStatus,
// };

const prisma = require("../config/prisma");
const {
  notifyUser,
  NotificationType,
} = require("../services/notificationService");
const { logAction } = require("../services/auditLogService");

// ================= CREATE TASK =================
const createTask = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create tasks",
      });
    }

    const {
      title,
      description,
      priority,
      dueDate,
      assignedToId,
    } = req.body;

    if (!title || !priority || !assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Title, priority and assigned employee are required",
      });
    }

    const employee = await prisma.user.findFirst({
      where: {
        id: assignedToId,
        companyId: req.user.companyId,
        role: "USER"
      }
    });

    if (!employee || employee.role !== "USER") {
      return res.status(400).json({
        success: false,
        message: "Invalid employee selected",
      });
    }

    const task = await prisma.task.create({
      data: {
        companyId: req.user.companyId,
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "TODO",
        createdById: req.user.userId,
        assignedToId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // ================= CREATE NOTIFICATION =================
    try {
      await notifyUser({
        userId: assignedToId,
        title: "New Task Assigned",
        message: `You have been assigned a new task: "${task.title}".`,
        type: NotificationType.TASK,
      });
    } catch (notificationError) {
      console.error(
        "Task notification failed:",
        notificationError
      );
    }

    logAction({
      req,
      action: "CREATE",
      module: "TASK",
      entityId: task.id,
      entityName: task.title,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    });
  }
};

// ================= GET ALL TASKS =================
const getTasks = async (req, res) => {
  try {
    let tasks;

    if (req.user.role === "ADMIN") {
      tasks = await prisma.task.findMany({
        where: {
          companyId: req.user.companyId
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      tasks = await prisma.task.findMany({
        where: {
          assignedToId: req.user.userId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("Get Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// ================= GET SINGLE TASK =================
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      task.assignedToId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Get Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch task",
      error: error.message,
    });
  }
};

// ================= UPDATE TASK =================
const updateTask = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update tasks",
      });
    }

    const { id } = req.params;

    const {
      title,
      description,
      priority,
      dueDate,
      assignedToId,
    } = req.body;

    // Get existing task before update
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (assignedToId) {
      const employee = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          companyId: req.user.companyId,
          role: "USER"
        }
      });

      if (!employee || employee.role !== "USER") {
        return res.status(400).json({
          success: false,
          message: "Invalid employee selected",
        });
      }
    }

    const task = await prisma.task.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notify only if task is assigned to a different user
    if (
      assignedToId &&
      assignedToId !== existingTask.assignedToId
    ) {
      try {
        await notifyUser({
          userId: assignedToId,
          title: "Task Assigned",
          message: `A task has been assigned to you: "${task.title}".`,
          type: NotificationType.TASK,
        });
      } catch (notificationError) {
        console.error(
          "Task reassignment notification failed:",
          notificationError
        );
      }
    }

    logAction({
      req,
      action: "UPDATE",
      module: "TASK",
      entityId: task.id,
      entityName: task.title,
      changes: {
        before: { assignedToId: existingTask.assignedToId, dueDate: existingTask.dueDate },
        after: { assignedToId: task.assignedToId, dueDate: task.dueDate },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Update Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// ================= DELETE TASK =================
const deleteTask = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete tasks",
      });
    }

    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    await prisma.task.deleteMany({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (existingTask) {
      logAction({
        req,
        action: "DELETE",
        module: "TASK",
        entityId: existingTask.id,
        entityName: existingTask.title,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

// ================= UPDATE TASK STATUS =================
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      task.assignedToId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this task",
      });
    }

    const updatedTask = await prisma.task.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logAction({
      req,
      action: "STATUS_CHANGE",
      module: "TASK",
      entityId: updatedTask.id,
      entityName: updatedTask.title,
      changes: {
        before: { status: task.status },
        after: { status: updatedTask.status },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Update Task Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
};