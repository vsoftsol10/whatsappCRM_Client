const prisma = require("../config/prisma");

// ======================================================
// CREATE SUPPORT TICKET
// CRM COMPANY → SUPER ADMIN
// ======================================================

const createSupportTicket = async (req, res) => {
  try {
    // Company comes from logged-in CRM user
    const companyId = Number(req.user.companyId);

    const {
      title,
      description,
      priority
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found."
      });
    }

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required."
      });
    }

    // ==================================================
    // CHECK COMPANY
    // ==================================================

    const company = await prisma.company.findUnique({
      where: {
        id: companyId
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found."
      });
    }

    // ==================================================
    // CREATE SUPPORT TICKET
    // ==================================================

    const ticket = await prisma.supportTicket.create({
      data: {
        companyId,
        employeeId: null,
        title: title.trim(),
        description: description.trim(),
        priority: priority || "MEDIUM",
        status: "OPEN"
      },
      include: {
        company: true,
        assignedTo: true
      }
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully.",
      ticket
    });

  } catch (error) {

    console.error(
      "Create Support Ticket Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create support ticket."
    });
  }
};
// ============================================
// GET SUPPORT TICKETS FOR CURRENT COMPANY
// ============================================

const getMySupportTickets = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company information not found in token",
      });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: {
        companyId: Number(companyId),
      },
      include: {
        company: true,
        assignedTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get My Support Tickets Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch support tickets",
    });
  }
};


module.exports = {
  createSupportTicket,
  getMySupportTickets,
};