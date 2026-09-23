// const prisma = require("../config/prisma");
// const crypto = require("crypto");

// // ==========================================
// // CREATE INTEGRATION
// // ==========================================

// const createIntegration = async (req, res) => {
//   try {
//     const { name, provider, type } = req.body;

//     // Get company from logged-in user's JWT
//     const companyId = req.user.companyId;

//     // ------------------------------------------
//     // VALIDATION
//     // ------------------------------------------

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Integration name is required",
//       });
//     }

//     if (!type) {
//       return res.status(400).json({
//         success: false,
//         message: "Integration type is required",
//       });
//     }

//     const validTypes = [
//       "BILLING",
//       "ECOMMERCE",
//       "POS",
//       "ERP",
//       "PAYMENT",
//       "CUSTOM",
//     ];

//     if (!validTypes.includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid integration type",
//       });
//     }

//     // ------------------------------------------
//     // GENERATE WEBHOOK KEY + SECRET
//     // ------------------------------------------
//     //
//     // webhookKey:
//     // Used to uniquely identify this integration.
//     //
//     // webhookSecret:
//     // Used for authentication/verification.
//     //
//     // Different providers may use different
//     // authentication methods later, so secret
//     // remains optional in the database.
//     // ------------------------------------------

//     const webhookKey = crypto.randomBytes(16).toString("hex");
//     const webhookSecret = crypto.randomBytes(32).toString("hex");

//     // ------------------------------------------
//     // CREATE INTEGRATION
//     // ------------------------------------------

//     const integration = await prisma.integration.create({
//       data: {
//         companyId,
//         name: name.trim(),
//         provider: provider?.trim() || null,
//         type,
//         webhookKey,
//         webhookSecret,
//       },
//     });

//     // ------------------------------------------
//     // RESPONSE
//     // ------------------------------------------

//     return res.status(201).json({
//       success: true,
//       message: "Integration created successfully",
//       integration: {
//         id: integration.id,
//         name: integration.name,
//         provider: integration.provider,
//         type: integration.type,
//         status: integration.status,

//         // Show these when integration is created
//         // so the user can configure the external system.
//         webhookKey: integration.webhookKey,
//         webhookSecret: integration.webhookSecret,

//         lastEventAt: integration.lastEventAt,
//         lastSyncAt: integration.lastSyncAt,
//         createdAt: integration.createdAt,
//       },
//     });
//   } catch (error) {
//     console.error("Create integration error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create integration",
//       error:
//         process.env.NODE_ENV === "development"
//           ? error.message
//           : undefined,
//     });
//   }
// };

// // ==========================================
// // GET ALL COMPANY INTEGRATIONS
// // ==========================================

// const getIntegrations = async (req, res) => {
//   try {
//     // IMPORTANT:
//     // Never take companyId from req.body or req.params.
//     // Always get it from the authenticated JWT.
//     const companyId = req.user.companyId;

//     const integrations = await prisma.integration.findMany({
//       where: {
//         companyId,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       select: {
//         id: true,
//         name: true,
//         provider: true,
//         type: true,
//         status: true,

//         // Do not expose secret/key in the list.
//         // They are available in Integration Details.
//         lastEventAt: true,
//         lastSyncAt: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       integrations,
//     });
//   } catch (error) {
//     console.error("Get integrations error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch integrations",
//       error:
//         process.env.NODE_ENV === "development"
//           ? error.message
//           : undefined,
//     });
//   }
// };

// // ==========================================
// // GET SINGLE INTEGRATION
// // ==========================================

// const getIntegrationById = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;
//     const integrationId = Number(req.params.id);

//     // ------------------------------------------
//     // VALIDATE ID
//     // ------------------------------------------

//     if (!Number.isInteger(integrationId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid integration ID",
//       });
//     }

//     // ------------------------------------------
//     // FIND INTEGRATION
//     // ------------------------------------------

//     const integration = await prisma.integration.findFirst({
//       where: {
//         id: integrationId,
//         companyId,
//       },
//       select: {
//         id: true,
//         name: true,
//         provider: true,
//         type: true,
//         status: true,

//         // New webhook identification fields
//         webhookKey: true,
//         webhookSecret: true,

//         lastEventAt: true,
//         lastSyncAt: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     if (!integration) {
//       return res.status(404).json({
//         success: false,
//         message: "Integration not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       integration,
//     });
//   } catch (error) {
//     console.error("Get integration by ID error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch integration",
//       error:
//         process.env.NODE_ENV === "development"
//           ? error.message
//           : undefined,
//     });
//   }
// };

// // ==========================================
// // UPDATE INTEGRATION STATUS
// // ==========================================

// const updateIntegrationStatus = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;
//     const integrationId = Number(req.params.id);
//     const { status } = req.body;

//     // ------------------------------------------
//     // VALIDATE ID
//     // ------------------------------------------

//     if (!Number.isInteger(integrationId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid integration ID",
//       });
//     }

//     // ------------------------------------------
//     // VALIDATE STATUS
//     // ------------------------------------------

//     if (!["ACTIVE", "INACTIVE"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid integration status",
//       });
//     }

//     // ------------------------------------------
//     // CHECK COMPANY OWNERSHIP
//     // ------------------------------------------

//     const existingIntegration = await prisma.integration.findFirst({
//       where: {
//         id: integrationId,
//         companyId,
//       },
//     });

//     if (!existingIntegration) {
//       return res.status(404).json({
//         success: false,
//         message: "Integration not found",
//       });
//     }

//     // ------------------------------------------
//     // UPDATE
//     // ------------------------------------------

//     const integration = await prisma.integration.update({
//       where: {
//         id: integrationId,
//       },
//       data: {
//         status,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Integration status updated successfully",
//       integration: {
//         id: integration.id,
//         name: integration.name,
//         status: integration.status,
//       },
//     });
//   } catch (error) {
//     console.error("Update integration status error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update integration status",
//       error:
//         process.env.NODE_ENV === "development"
//           ? error.message
//           : undefined,
//     });
//   }
// };

// // ==========================================
// // DELETE INTEGRATION
// // ==========================================

// const deleteIntegration = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;
//     const integrationId = Number(req.params.id);

//     // ------------------------------------------
//     // VALIDATE ID
//     // ------------------------------------------

//     if (!Number.isInteger(integrationId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid integration ID",
//       });
//     }

//     // ------------------------------------------
//     // CHECK COMPANY OWNERSHIP
//     // ------------------------------------------

//     const existingIntegration = await prisma.integration.findFirst({
//       where: {
//         id: integrationId,
//         companyId,
//       },
//     });

//     if (!existingIntegration) {
//       return res.status(404).json({
//         success: false,
//         message: "Integration not found",
//       });
//     }

//     // ------------------------------------------
//     // DELETE
//     // ------------------------------------------

//     await prisma.integration.delete({
//       where: {
//         id: integrationId,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Integration deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete integration error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete integration",
//       error:
//         process.env.NODE_ENV === "development"
//           ? error.message
//           : undefined,
//     });
//   }
// };

// // ==========================================
// // EXPORT
// // ==========================================

// module.exports = {
//   createIntegration,
//   getIntegrations,
//   getIntegrationById,
//   updateIntegrationStatus,
//   deleteIntegration,
// };


const prisma = require("../config/prisma");
const crypto = require("crypto");
const { SUPPORTED_PROVIDERS } = require("../integrations/adapters");

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
    // VALIDATE + NORMALIZE PROVIDER
    // ------------------------------------------
    //
    // The provider name is what picks the adapter used to
    // verify signatures and normalize payloads at webhook time
    // (see integrations/adapters/index.js). It must exactly
    // match one of SUPPORTED_PROVIDERS, uppercased, or webhooks
    // for this integration will silently fall back to the
    // GENERIC adapter.
    //
    // No provider given -> defaults to GENERIC (custom/manual
    // integrations that already speak our internal format).
    // ------------------------------------------

    const normalizedProvider = provider?.trim()
      ? provider.trim().toUpperCase()
      : "GENERIC";

    if (!SUPPORTED_PROVIDERS.includes(normalizedProvider)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported provider "${provider}". Supported providers: ${SUPPORTED_PROVIDERS.join(", ")}`,
      });
    }

    // ------------------------------------------
    // GENERATE WEBHOOK KEY + SECRET
    // ------------------------------------------
    //
    // webhookKey:
    // Used to uniquely identify this integration.
    //
    // webhookSecret:
    // Used for authentication/verification.
    //
    // IMPORTANT for STRIPE / RAZORPAY:
    // A random secret is generated here as a starting point,
    // but Stripe and Razorpay compute their signature using
    // THEIR OWN signing secret from their dashboard - not
    // whatever your server invents. After creating a
    // STRIPE/RAZORPAY integration, copy the signing secret
    // from that provider's dashboard and overwrite
    // Integration.webhookSecret with it (directly in the
    // database, or add an "update secret" endpoint), otherwise
    // signature verification will always fail (401) for real
    // webhook deliveries.
    // For GENERIC integrations the auto-generated value here
    // is fine as-is.
    // ------------------------------------------

    const webhookKey = crypto.randomBytes(16).toString("hex");
    const webhookSecret = crypto.randomBytes(32).toString("hex");

    // ------------------------------------------
    // CREATE INTEGRATION
    // ------------------------------------------

    const integration = await prisma.integration.create({
      data: {
        companyId,
        name: name.trim(),
        provider: normalizedProvider,
        type,
        webhookKey,
        webhookSecret,
      },
    });

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Integration created successfully",
      integration: {
        id: integration.id,
        name: integration.name,
        provider: integration.provider,
        type: integration.type,
        status: integration.status,

        // Show these when integration is created
        // so the user can configure the external system.
        webhookKey: integration.webhookKey,
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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
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

        // Do not expose secret/key in the list.
        // They are available in Integration Details.
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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
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

        // New webhook identification fields
        webhookKey: true,
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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// UPDATE INTEGRATION WEBHOOK SECRET
// ==========================================
//
// Needed for STRIPE / RAZORPAY: after creating the
// integration, the user copies the *provider's own* signing
// secret from their Stripe/Razorpay dashboard and pastes it
// here, overwriting the auto-generated one from createIntegration.
// Without this endpoint, real provider signatures can never
// verify (401 forever) - only the DB-edit workaround worked.
// ==========================================

const updateIntegrationSecret = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const integrationId = Number(req.params.id);
    const { webhookSecret } = req.body;

    if (!Number.isInteger(integrationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID",
      });
    }

    if (!webhookSecret || !webhookSecret.trim()) {
      return res.status(400).json({
        success: false,
        message: "webhookSecret is required",
      });
    }

    const existingIntegration = await prisma.integration.findFirst({
      where: { id: integrationId, companyId },
    });

    if (!existingIntegration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found",
      });
    }

    const integration = await prisma.integration.update({
      where: { id: integrationId },
      data: { webhookSecret: webhookSecret.trim() },
      select: {
        id: true,
        webhookKey: true,
        webhookSecret: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Webhook secret updated successfully",
      integration,
    });
  } catch (error) {
    console.error("Update integration secret error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update webhook secret",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// UPDATE INTEGRATION AUTOMATION SETTINGS
// ==========================================
//
// Wires up the settings form already built in
// IntegrationDetailsModal.jsx (frontend was calling this
// route, but it never existed on the backend - 404).
// ==========================================

const { sanitizeIncomingSettings } = require("../utils/integrationSettings");

const updateIntegrationSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const integrationId = Number(req.params.id);
    const { settings } = req.body;

    if (!Number.isInteger(integrationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID",
      });
    }

    const existingIntegration = await prisma.integration.findFirst({
      where: { id: integrationId, companyId },
    });

    if (!existingIntegration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found",
      });
    }

    let sanitized;
    try {
      sanitized = sanitizeIncomingSettings(settings);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    const integration = await prisma.integration.update({
      where: { id: integrationId },
      data: { settings: sanitized },
      select: {
        id: true,
        settings: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Integration settings updated successfully",
      integration,
    });
  } catch (error) {
    console.error("Update integration settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update integration settings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// GET SUPPORTED PROVIDERS
// ==========================================
//
// Powers the provider dropdown on the "Add Integration" form
// on the frontend, so the user can only pick a provider name
// that actually has a matching adapter - no more mismatches
// between what's typed here and what the webhook handler
// expects.
// ==========================================

const getSupportedProviders = async (req, res) => {
  return res.status(200).json({
    success: true,
    providers: SUPPORTED_PROVIDERS,
  });
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createIntegration,
  getIntegrations,
  getIntegrationById,
  updateIntegrationStatus,
  updateIntegrationSecret,
  updateIntegrationSettings,
  deleteIntegration,
  getSupportedProviders,
};