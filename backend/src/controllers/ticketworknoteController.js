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
// HELPER: check if user can view/manage notes for a ticket
// ======================================================

const canAccessTicket = (user, ticket) => {
  if (user.role === "ADMIN") return true;
  return ticket.assignedToId === user.userId;
};

// ======================================================
// GET WORK NOTES FOR A TICKET
// ======================================================

const getTicketWorkNotes = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({
        success: false,
        message: "You cannot view notes for this ticket",
      });
    }

    const notes = await prisma.ticketWorkNote.findMany({
      where: { ticketId: id },
      include: workNoteInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    console.error("Get Ticket Work Notes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch work notes",
      error: error.message,
    });
  }
};

// ======================================================
// CREATE WORK NOTE FOR A TICKET
// ======================================================

const createTicketWorkNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({
        success: false,
        message: "You cannot add notes to this ticket",
      });
    }

    const workNote = await prisma.ticketWorkNote.create({
      data: {
        ticketId: id,
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

      const message = `${author?.name || "Someone"} added a work note to Ticket "${ticket.title}".`;

      if (req.user.role === "ADMIN") {
        if (ticket.assignedToId && ticket.assignedToId !== req.user.userId) {
          await notifyUser({
            userId: ticket.assignedToId,
            title: "New Work Note",
            message,
            type: NotificationType.TICKET,
          });
        }
      } else {
        await notifyAdmins({
          companyId: ticket.companyId,
          title: "New Work Note",
          message,
          type: NotificationType.TICKET,
        });
      }
    } catch (notificationError) {
      console.error(
        "Ticket work note notification failed:",
        notificationError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Work note added successfully",
      data: workNote,
    });
  } catch (error) {
    console.error("Create Ticket Work Note Error:", error);

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

const updateTicketWorkNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const existingNote = await prisma.ticketWorkNote.findFirst({
      where: { id: noteId, ticket: { companyId: req.user.companyId } },
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

    const updatedNote = await prisma.ticketWorkNote.update({
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
    console.error("Update Ticket Work Note Error:", error);

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

const deleteTicketWorkNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const existingNote = await prisma.ticketWorkNote.findFirst({
      where: { id: noteId, ticket: { companyId: req.user.companyId } },
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

    await prisma.ticketWorkNote.delete({
      where: { id: noteId },
    });

    return res.status(200).json({
      success: true,
      message: "Work note deleted successfully",
    });
  } catch (error) {
    console.error("Delete Ticket Work Note Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete work note",
      error: error.message,
    });
  }
};

module.exports = {
  getTicketWorkNotes,
  createTicketWorkNote,
  updateTicketWorkNote,
  deleteTicketWorkNote,
};