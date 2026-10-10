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
// HELPER: check if user can view/manage notes for a lead
// ======================================================

const canAccessLead = (user, lead) => {
  if (user.role === "ADMIN") return true;
  return lead.assignedToId === user.userId;
};

// ======================================================
// GET WORK NOTES FOR A LEAD
// ======================================================

const getLeadWorkNotes = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: { id: Number(id), companyId: req.user.companyId },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    if (!canAccessLead(req.user, lead)) {
      return res.status(403).json({
        success: false,
        message: "You cannot view notes for this lead",
      });
    }

    const notes = await prisma.leadWorkNote.findMany({
      where: { leadId: Number(id) },
      include: workNoteInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    console.error("Get Lead Work Notes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch work notes",
      error: error.message,
    });
  }
};

// ======================================================
// CREATE WORK NOTE FOR A LEAD
// ======================================================

const createLeadWorkNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const lead = await prisma.lead.findFirst({
      where: { id: Number(id), companyId: req.user.companyId },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    if (!canAccessLead(req.user, lead)) {
      return res.status(403).json({
        success: false,
        message: "You cannot add notes to this lead",
      });
    }

    const workNote = await prisma.leadWorkNote.create({
      data: {
        leadId: Number(id),
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

      const message = `${author?.name || "Someone"} added a work note to Lead "${lead.name}".`;

      if (req.user.role === "ADMIN") {
        if (lead.assignedToId && lead.assignedToId !== req.user.userId) {
          await notifyUser({
            userId: lead.assignedToId,
            title: "New Work Note",
            message,
            type: NotificationType.LEAD,
          });
        }
      } else {
        await notifyAdmins({
          companyId: lead.companyId,
          title: "New Work Note",
          message,
          type: NotificationType.LEAD,
        });
      }
    } catch (notificationError) {
      console.error(
        "Lead work note notification failed:",
        notificationError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Work note added successfully",
      data: workNote,
    });
  } catch (error) {
    console.error("Create Lead Work Note Error:", error);

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

const updateLeadWorkNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const existingNote = await prisma.leadWorkNote.findFirst({
      where: { id: noteId, lead: { companyId: req.user.companyId } },
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

    const updatedNote = await prisma.leadWorkNote.update({
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
    console.error("Update Lead Work Note Error:", error);

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

const deleteLeadWorkNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const existingNote = await prisma.leadWorkNote.findFirst({
      where: { id: noteId, lead: { companyId: req.user.companyId } },
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

    await prisma.leadWorkNote.delete({
      where: { id: noteId },
    });

    return res.status(200).json({
      success: true,
      message: "Work note deleted successfully",
    });
  } catch (error) {
    console.error("Delete Lead Work Note Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete work note",
      error: error.message,
    });
  }
};

module.exports = {
  getLeadWorkNotes,
  createLeadWorkNote,
  updateLeadWorkNote,
  deleteLeadWorkNote,
};