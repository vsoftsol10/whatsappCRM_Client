const prisma = require("../config/prisma");
const crypto = require("crypto");

// ==========================================
// CREATE INTEGRATION
// ==========================================

const createIntegration = async (req, res) => {
  try {
    const { name, provider, type } = req.body;

    // Get company from logged-in user's JWT
    const companyId = req.user.companyId;

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Integration name is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Integration type is required",
      });
    }

    const validTypes = [
      "BILLING",
      "ECOMMERCE",
      "POS",
      "ERP",
      "PAYMENT",
      "CUSTOM",
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration type",
      });
    }

    // ------------------------------------------
    // GENERATE WEBHOOK SECRET
    // ------------------------------------------

    const webhookSecret = crypto.randomBytes(32).toString("hex");

    // ------------------------------------------
    // CREATE INTEGRATION
    // ------------------------------------------

    const integration = await prisma.integration.create({
      data: {
        companyId,
        name: name.trim(),
        provider: provider?.trim() || null,
        type,
        webhookSecret,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Integration created successfully",
      integration: {
        id: integration.id,
        name: integration.name,
        provider: integration.provider,
        type: integration.type,
        status: integration.status,
        webhookSecret: integration.webhookSecret,
        lastEventAt: integration.lastEventAt,
        lastSyncAt: integration.lastSyncAt,
        createdAt: integration.createdAt,
      },
    });
  } catch (error) {
    console.error("Create integration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create integration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// GET ALL COMPANY INTEGRATIONS
// ==========================================

const getIntegrations = async (req, res) => {
  try {
    // IMPORTANT:
    // Never take companyId from req.body or req.params.
    // Always get it from the authenticated JWT.
    const companyId = req.user.companyId;

    const integrations = await prisma.integration.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        provider: true,
        type: true,
        status: true,
        lastEventAt: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      integrations,
    });
  } catch (error) {
    console.error("Get integrations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integrations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// GET SINGLE INTEGRATION
// ==========================================

const getIntegrationById = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const integrationId = Number(req.params.id);

    // ------------------------------------------
    // VALIDATE ID
    // ------------------------------------------

    if (!Number.isInteger(integrationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID",
      });
    }

    // ------------------------------------------
    // FIND INTEGRATION
    // ------------------------------------------

    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        companyId,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        type: true,
        status: true,
        webhookSecret: true,
        lastEventAt: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found",
      });
    }

    return res.status(200).json({
      success: true,
      integration,
    });
  } catch (error) {
    console.error("Get integration by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// UPDATE INTEGRATION STATUS
// ==========================================

const updateIntegrationStatus = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const integrationId = Number(req.params.id);
    const { status } = req.body;

    // ------------------------------------------
    // VALIDATE ID
    // ------------------------------------------

    if (!Number.isInteger(integrationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID",
      });
    }

    // ------------------------------------------
    // VALIDATE STATUS
    // ------------------------------------------

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration status",
      });
    }

    // ------------------------------------------
    // CHECK COMPANY OWNERSHIP
    // ------------------------------------------

    const existingIntegration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        companyId,
      },
    });

    if (!existingIntegration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found",
      });
    }

    // ------------------------------------------
    // UPDATE
    // ------------------------------------------

    const integration = await prisma.integration.update({
      where: {
        id: integrationId,
      },
      data: {
        status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Integration status updated successfully",
      integration: {
        id: integration.id,
        name: integration.name,
        status: integration.status,
      },
    });
  } catch (error) {
    console.error("Update integration status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update integration status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// DELETE INTEGRATION
// ==========================================

const deleteIntegration = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const integrationId = Number(req.params.id);

    // ------------------------------------------
    // VALIDATE ID
    // ------------------------------------------

    if (!Number.isInteger(integrationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID",
      });
    }

    // ------------------------------------------
    // CHECK COMPANY OWNERSHIP
    // ------------------------------------------

    const existingIntegration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        companyId,
      },
    });

    if (!existingIntegration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found",
      });
    }

    // ------------------------------------------
    // DELETE
    // ------------------------------------------

    await prisma.integration.delete({
      where: {
        id: integrationId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Integration deleted successfully",
    });
  } catch (error) {
    console.error("Delete integration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete integration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createIntegration,
  getIntegrations,
  getIntegrationById,
  updateIntegrationStatus,
  deleteIntegration,
};