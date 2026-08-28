
const prisma = require("../config/prisma");

const {
  sendTextMessage,
  sendImageMessage,
  sendTemplateMessage,
  sendCampaignImageTemplate,
} = require("../services/whatsappService");
const { generateCampaign } = require("../services/geminiService");
const { notifyAdmins } = require("../services/notificationService");
const {
  uploadCampaignImage,
} = require("../services/cloudinaryService");
const {
  getOrCreateConversation,
} = require("../helpers/conversationHelper");
const { logAction } = require("../services/auditLogService");
// =====================================================
// CREATE CAMPAIGN
// =====================================================
exports.createCampaign = async (req, res) => {
  try {
    let {
      name,
      type,
      messageContent,
      scheduledAt,
      customerIds,
    } = req.body;

    // =============================
    // Convert customerIds to array
    // =============================
    if (!customerIds) {
      customerIds = [];
    } else if (!Array.isArray(customerIds)) {
      customerIds = [customerIds];
    }

    // Convert all ids to Number
    customerIds = customerIds.map((id) => String(id));

    console.log("Customer IDs:", customerIds);

    console.log("Customer IDs:", customerIds);
    console.log("Is Array:", Array.isArray(customerIds));
    if (!name || !messageContent) {
      return res.status(400).json({
        success: false,
        message: "Campaign name and message are required.",
      });
    }

    // ============================
    // Upload Image to Cloudinary
    // ============================
    let imageUrl = null;

    if (req.file) {
      const uploadResult = await uploadCampaignImage(req.file);

      imageUrl = uploadResult?.imageUrl || null;
    }

    const campaign = await prisma.campaign.create({
      data: {
        companyId: req.user.companyId,

        name,
        type,
        messageContent,

        imageUrl,

        scheduledAt: scheduledAt
          ? new Date(scheduledAt)
          : null,

        audienceCount: customerIds.length,

        createdById: req.user.userId,

        recipients: {
          create: customerIds.map((customerId) => ({
            customerId,
          })),
        },
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        recipients: {
          include: {
            customer: true,
          },
        },
      },
    });

    notifyAdmins({
      title: "New Campaign",
      message: `${campaign.name} has been created.`,
      type: "CAMPAIGN",
    }).catch(console.error);

    logAction({
      req,
      action: "CREATE",
      module: "CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,
    });

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully.",
      data: campaign,
    });

  } catch (error) {

    console.error("Create Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create campaign.",
      error: error.message,
    });

  }
};

// =====================================================
// GET ALL CAMPAIGNS
// =====================================================
exports.getCampaigns = async (req, res) => {
  try {

    const campaigns = await prisma.campaign.findMany({
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

        recipients: {
          include: {
            customer: true,
          },
        },

      },

      orderBy: {
        createdAt: "desc",
      },

    });

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });

  } catch (error) {

    console.error("Get Campaigns Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns.",
      error: error.message,
    });

  }
};

// =====================================================
// GET CAMPAIGN BY ID
// =====================================================
exports.getCampaignById = async (req, res) => {
  try {

    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        companyId: req.user.companyId,
      },

      include: {

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        recipients: {
          include: {
            customer: true,
          },
        },

      },

    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: campaign,
    });

  } catch (error) {

    console.error("Get Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaign.",
      error: error.message,
    });

  }
};
// =====================================================
// UPDATE CAMPAIGN
// =====================================================
exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      type,
      messageContent,
      status,
      scheduledAt,
    } = req.body;

    // Find campaign
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    // Keep old image
    // Keep old image
    let imageUrl = existingCampaign.imageUrl;

    // Upload new image if selected
    if (req.file) {
      const uploadResult = await uploadCampaignImage(req.file);

      imageUrl = uploadResult?.imageUrl || existingCampaign.imageUrl;
    }

    const campaign = await prisma.campaign.update({
      where: {
        id,
      },

      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(messageContent && { messageContent }),
        ...(status && { status }),

        imageUrl,

        scheduledAt:
          scheduledAt !== undefined
            ? scheduledAt
              ? new Date(scheduledAt)
              : null
            : undefined,
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        recipients: {
          include: {
            customer: true,
          },
        },
      },
    });

    logAction({
      req,
      action: "UPDATE",
      module: "CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,
      changes: {
        before: { status: existingCampaign.status, messageContent: existingCampaign.messageContent },
        after: { status: campaign.status, messageContent: campaign.messageContent },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Campaign updated successfully.",
      data: campaign,
    });

  } catch (error) {

    console.error("Update Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update campaign.",
      error: error.message,
    });

  }
};

// =====================================================
// DELETE CAMPAIGN
// =====================================================
exports.deleteCampaign = async (req, res) => {
  try {

    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    await prisma.campaign.delete({
      where: {
        id,
      },
    });

    logAction({
      req,
      action: "DELETE",
      module: "CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,
    });

    return res.status(200).json({
      success: true,
      message: "Campaign deleted successfully.",
    });

  } catch (error) {

    console.error("Delete Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete campaign.",
      error: error.message,
    });

  }
};

// =====================================================
// GENERATE AI CAMPAIGN
// =====================================================
exports.generateAICampaign = async (req, res) => {
  try {

    const { prompt } = req.body;

    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Prompt is required.",
      });
    }

    const campaign = await generateCampaign(prompt);

    return res.status(200).json({
      success: true,
      message: "AI campaign generated successfully.",
      data: campaign,
    });

  } catch (error) {

    console.error("Generate AI Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI campaign.",
      error: error.message,
    });

  }
};
// =====================================================
// SEND CAMPAIGN TO CUSTOMERS
// =====================================================
exports.sendCampaign = async (req, res) => {
  try {
    console.log("========== SEND CAMPAIGN ==========");
    console.log("Request Body:", req.body);
    const { campaignId, customerIds } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required.",
      });
    }

    if (!customerIds || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one customer.",
      });
    }

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    let successCount = 0;

    for (const customerId of customerIds) {

      // =============================
      // Find Customer
      // =============================
      const customer = await prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

      if (!customer) continue;

      // =============================
      // Save Campaign Recipient
      // =============================
      const existingRecipient =
        await prisma.campaignRecipient.findUnique({
          where: {
            campaignId_customerId: {
              campaignId,
              customerId,
            },
          },
        });

      if (!existingRecipient) {
        await prisma.campaignRecipient.create({
          data: {
            campaignId,
            customerId,
          },
        });
      }

      // =============================
      // Find or Create Conversation (by phone — avoids duplicate
      // conversations / unique constraint crashes when a
      // Conversation already exists for this phone but isn't
      // linked to this customerId yet, e.g. inbound webhook
      // messages that arrived before the Customer record existed)
      // =============================
      let conversation = await getOrCreateConversation(customer.phone);

      if (conversation.customerId !== customerId) {
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: { customerId },
        });
      }

      // =============================
      // Send WhatsApp Message
      // =============================

      let sendStatus = "FAILED";
      let metaMessageId = null;

      try {

        let result;

        // Campaigns are business-initiated, so they must always go
        // through an approved template (never plain sendTextMessage).
        // Use the image-header template when the campaign has an image,
        // otherwise the text-only template.
        if (campaign.imageUrl) {

          result = await sendCampaignImageTemplate(
            customer.phone,
            "campaign", // approved IMAGE-header template name (Meta template: "campaign")
            campaign.imageUrl,
            [customer.name, campaign.messageContent], // fills {{1}} and {{2}}
            "en" // Meta approved this template under "English", not "English (US)"
          );

        } else {

          result = await sendTemplateMessage(
            customer.phone,
            "custom_campaign_message", // approved text-only template name
            [customer.name, campaign.messageContent] // fills {{1}} and {{2}}
          );

        }

        console.log("WhatsApp Result:", result);

        if (result.success) {
          sendStatus = "SENT";
          metaMessageId = result.data?.messages?.[0]?.id || null;
        }

      } catch (err) {

        console.error("WhatsApp Send Error:", err);

      }
      // =============================
      // Save Message
      // =============================

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: "AGENT",
          content: campaign.messageContent,
          imageUrl: campaign.imageUrl,
          messageType: campaign.imageUrl ? "IMAGE" : "TEXT",
          status: sendStatus,
          metaMessageId,
        },
      });

      // =============================
      // Update Conversation
      // =============================
      await prisma.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          lastMessage: campaign.messageContent,
        },
      });

      if (sendStatus === "SENT") {
        successCount++;
      }
    }

    // =============================
    // Audience Count
    // =============================
    const audienceCount =
      await prisma.campaignRecipient.count({
        where: {
          campaignId,
        },
      });

    // =============================
    // Update Campaign
    // =============================
    await prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: {
        status: "COMPLETED",
        audienceCount,
      },
    });

    logAction({
      req,
      action: "UPDATE",
      module: "CAMPAIGN",
      entityId: campaignId,
      entityName: campaign.name,
      changes: {
        after: { status: "COMPLETED", totalSent: successCount, audienceCount },
      },
    });

    return res.status(200).json({
      success: true,
      totalSent: successCount,
      audienceCount,
      message: `${successCount} customer(s) received the campaign.`,
    });

  } catch (error) {

    console.error("Send Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send campaign.",
      error: error.message,
    });

  }
};

// =====================================================
// GET CAMPAIGN RECIPIENTS
// =====================================================
exports.getCampaignRecipients = async (req, res) => {
  try {

    const { id } = req.params;

    const recipients =
      await prisma.campaignRecipient.findMany({

        where: {
          campaignId: id,
        },

        select: {
          customerId: true,
        },

      });

    return res.status(200).json({
      success: true,
      data: recipients.map(
        (recipient) => recipient.customerId
      ),
    });

  } catch (error) {

    console.error(
      "Get Campaign Recipients Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch campaign recipients.",
      error: error.message,
    });

  }
};