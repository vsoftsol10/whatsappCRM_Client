const prisma = require("../config/prisma");

// ======================================================
// GET INTEGRATION EVENTS
// ======================================================

const getIntegrationEvents = async (req, res) => {
  try {
    const integrationId = Number(req.params.id);
    const companyId = req.user.companyId;

    if (!integrationId) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID",
      });
    }

    // --------------------------------------------------
    // Make sure this integration belongs to this company
    // --------------------------------------------------

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
      },
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found",
      });
    }

    // --------------------------------------------------
    // Get events
    // --------------------------------------------------

    const events = await prisma.integrationEvent.findMany({
      where: {
        integrationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      integration,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error(
      "Get integration events error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integration events",
      error: error.message,
    });
  }
};

module.exports = {
  getIntegrationEvents,
};