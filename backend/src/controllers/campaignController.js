
const prisma = require("../config/prisma");

const {
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
      templateId,
      messageContent,
      scheduledAt,
      customerIds,
    } = req.body;

    const companyId = req.user.companyId;
    const createdById = req.user.userId;

    // =====================================================
    // NORMALIZE CUSTOMER IDS
    // =====================================================

    if (!customerIds) {
      customerIds = [];
    } else if (!Array.isArray(customerIds)) {
      customerIds = [customerIds];
    }

    customerIds = customerIds
      .filter(Boolean)
      .map((id) => String(id));

    // Remove duplicates
    customerIds = [...new Set(customerIds)];

    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Campaign name is required.",
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Campaign type is required.",
      });
    }

    // =====================================================
    // TEMPLATE VALIDATION
    // =====================================================

    let template = null;

    if (templateId) {
      template = await prisma.template.findFirst({
        where: {
          id: String(templateId),
          companyId,
        },
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Selected template was not found.",
        });
      }

      // Campaigns are business initiated WhatsApp messages.
      // Only approved templates should be used for sending.
      if (template.status !== "APPROVED") {
        return res.status(400).json({
          success: false,
          message:
            "Only approved WhatsApp templates can be used for campaigns.",
        });
      }
    }

    // =====================================================
    // CUSTOMER VALIDATION
    // =====================================================

    let validCustomerIds = [];

    if (customerIds.length > 0) {
      const customers = await prisma.customer.findMany({
        where: {
          id: {
            in: customerIds,
          },
          companyId,
        },
        select: {
          id: true,
        },
      });

      validCustomerIds = customers.map((customer) =>
        String(customer.id)
      );

      const invalidCustomerIds = customerIds.filter(
        (id) => !validCustomerIds.includes(id)
      );

      if (invalidCustomerIds.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "One or more selected customers do not belong to your company.",
          invalidCustomerIds,
        });
      }
    }

    // =====================================================
    // UPLOAD CAMPAIGN IMAGE
    // =====================================================

    let imageUrl = null;

    if (req.file) {
      const uploadResult = await uploadCampaignImage(req.file);

      imageUrl = uploadResult?.imageUrl || null;
    }

    // =====================================================
    // DETERMINE STATUS
    // =====================================================

    let campaignStatus = "DRAFT";

    if (scheduledAt) {
      const scheduleDate = new Date(scheduledAt);

      if (isNaN(scheduleDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid scheduled date.",
        });
      }

      if (scheduleDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Scheduled time must be in the future.",
        });
      }

      campaignStatus = "SCHEDULED";
    }

    // =====================================================
    // CREATE CAMPAIGN
    // =====================================================

    const campaign = await prisma.campaign.create({
      data: {
        companyId,

        name: name.trim(),

        type,

        templateId: template
          ? template.id
          : null,

        messageContent:
          messageContent?.trim() || null,

        status: campaignStatus,

        scheduledAt: scheduledAt
          ? new Date(scheduledAt)
          : null,

        audienceCount: validCustomerIds.length,

        totalRecipients: validCustomerIds.length,

        imageUrl,

        createdById,

        recipients: {
          create: validCustomerIds.map((customerId) => ({
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

        template: {
          select: {
            id: true,
            name: true,
            language: true,
            category: true,
            messageType: true,
            content: true,
            status: true,
          },
        },

        recipients: {
          include: {
            customer: true,
          },
        },
      },
    });

    // =====================================================
    // NOTIFICATION
    // =====================================================

    notifyAdmins({
      title: "New Campaign",
      message: `${campaign.name} has been created.`,
      type: "CAMPAIGN",
    }).catch(console.error);

    // =====================================================
    // AUDIT LOG
    // =====================================================

    logAction({
      req,
      action: "CREATE",
      module: "CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json({
      success: true,
      message: scheduledAt
        ? "Campaign scheduled successfully."
        : "Campaign created successfully.",
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
    const companyId = req.user.companyId;

    const campaigns = await prisma.campaign.findMany({
      where: {
        companyId,
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        template: {
          select: {
            id: true,
            name: true,
            language: true,
            category: true,
            messageType: true,
            content: true,
            status: true,
          },
        },

        // Don't load every customer for the campaign list.
        // SaaS CRM campaign tables should use statistics instead.
        _count: {
          select: {
            recipients: true,
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
    const companyId = req.user.companyId;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        companyId,
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        template: {
          select: {
            id: true,
            name: true,
            language: true,
            category: true,
            messageType: true,
            content: true,
            status: true,
          },
        },

        recipients: {
          include: {
            customer: true,
          },
          orderBy: {
            createdAt: "desc",
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

    const companyId = req.user.companyId;

    const {
      name,
      type,
      templateId,
      messageContent,
      status,
      scheduledAt,
    } = req.body;

    // =====================================================
    // FIND CAMPAIGN
    // =====================================================

    const existingCampaign =
      await prisma.campaign.findFirst({
        where: {
          id,
          companyId,
        },
      });

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    // =====================================================
    // DON'T MODIFY COMPLETED CAMPAIGNS
    // =====================================================

    if (
      existingCampaign.status === "COMPLETED" ||
      existingCampaign.status === "SENDING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Completed or currently sending campaigns cannot be edited.",
      });
    }

    // =====================================================
    // TEMPLATE VALIDATION
    // =====================================================

    let validatedTemplateId =
      existingCampaign.templateId;

    if (templateId !== undefined) {
      if (!templateId) {
        validatedTemplateId = null;
      } else {
        const template =
          await prisma.template.findFirst({
            where: {
              id: String(templateId),
              companyId,
            },
          });

        if (!template) {
          return res.status(404).json({
            success: false,
            message: "Selected template was not found.",
          });
        }

        if (template.status !== "APPROVED") {
          return res.status(400).json({
            success: false,
            message:
              "Only approved templates can be used for campaigns.",
          });
        }

        validatedTemplateId = template.id;
      }
    }

    // =====================================================
    // IMAGE
    // =====================================================

    let imageUrl = existingCampaign.imageUrl;

    if (req.file) {
      const uploadResult =
        await uploadCampaignImage(req.file);

      imageUrl =
        uploadResult?.imageUrl ||
        existingCampaign.imageUrl;
    }

    // =====================================================
    // SCHEDULE
    // =====================================================

    let finalScheduledAt =
      existingCampaign.scheduledAt;

    let finalStatus =
      status || existingCampaign.status;

    if (scheduledAt !== undefined) {
      if (scheduledAt) {
        const scheduleDate =
          new Date(scheduledAt);

        if (isNaN(scheduleDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid scheduled date.",
          });
        }

        if (scheduleDate <= new Date()) {
          return res.status(400).json({
            success: false,
            message:
              "Scheduled time must be in the future.",
          });
        }

        finalScheduledAt = scheduleDate;
        finalStatus = "SCHEDULED";
      } else {
        finalScheduledAt = null;

        if (finalStatus === "SCHEDULED") {
          finalStatus = "DRAFT";
        }
      }
    }

    // =====================================================
    // UPDATE
    // =====================================================

    const campaign =
      await prisma.campaign.update({
        where: {
          id,
        },

        data: {
          ...(name !== undefined && {
            name: name.trim(),
          }),

          ...(type !== undefined && {
            type,
          }),

          templateId: validatedTemplateId,

          ...(messageContent !== undefined && {
            messageContent:
              messageContent?.trim() || null,
          }),

          status: finalStatus,

          scheduledAt:
            finalScheduledAt,

          imageUrl,
        },

        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          template: {
            select: {
              id: true,
              name: true,
              language: true,
              category: true,
              messageType: true,
              content: true,
              status: true,
            },
          },

          _count: {
            select: {
              recipients: true,
            },
          },
        },
      });

    // =====================================================
    // AUDIT
    // =====================================================

    logAction({
      req,
      action: "UPDATE",
      module: "CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,

      changes: {
        before: {
          status: existingCampaign.status,
          templateId:
            existingCampaign.templateId,
          scheduledAt:
            existingCampaign.scheduledAt,
        },

        after: {
          status: campaign.status,
          templateId:
            campaign.templateId,
          scheduledAt:
            campaign.scheduledAt,
        },
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

    const companyId = req.user.companyId;

    const campaign =
      await prisma.campaign.findFirst({
        where: {
          id,
          companyId,
        },
      });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    // Don't delete campaigns that are currently sending
    if (campaign.status === "SENDING") {
      return res.status(400).json({
        success: false,
        message:
          "A campaign that is currently sending cannot be deleted.",
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

    const campaign =
      await generateCampaign(prompt);

    return res.status(200).json({
      success: true,
      message:
        "AI campaign generated successfully.",
      data: campaign,
    });

  } catch (error) {
    console.error(
      "Generate AI Campaign Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate campaign.",
      error: error.message,
    });
  }
};


// =====================================================
// SEND CAMPAIGN
// =====================================================

exports.sendCampaign = async (req, res) => {
  try {
    console.log(
      "========== SEND CAMPAIGN =========="
    );

    const { campaignId } = req.body;

    const companyId = req.user.companyId;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required.",
      });
    }

    // =====================================================
    // GET CAMPAIGN
    // =====================================================

    const campaign =
      await prisma.campaign.findFirst({
        where: {
          id: String(campaignId),
          companyId,
        },

        include: {
          template: true,

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

    // =====================================================
    // VALIDATE TEMPLATE
    // =====================================================

    if (!campaign.templateId) {
      return res.status(400).json({
        success: false,
        message:
          "This campaign does not have a WhatsApp template selected.",
      });
    }

    if (!campaign.template) {
      return res.status(400).json({
        success: false,
        message: "Campaign template not found.",
      });
    }

    if (campaign.template.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message:
          "The selected WhatsApp template is not approved.",
      });
    }

    // =====================================================
    // VALIDATE STATUS
    // =====================================================

    if (
      campaign.status === "COMPLETED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This campaign has already been completed.",
      });
    }

    if (
      campaign.status === "SENDING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This campaign is already being sent.",
      });
    }

    // =====================================================
    // CHECK RECIPIENTS
    // =====================================================

    if (
      !campaign.recipients ||
      campaign.recipients.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select at least one customer.",
      });
    }

    // =====================================================
    // MARK CAMPAIGN AS SENDING
    // =====================================================

    await prisma.campaign.update({
      where: {
        id: campaign.id,
      },

      data: {
        status: "SENDING",
        startedAt: new Date(),
        totalRecipients:
          campaign.recipients.length,
        audienceCount:
          campaign.recipients.length,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
      },
    });

    // =====================================================
    // SEND TO RECIPIENTS
    // =====================================================

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of campaign.recipients) {
      const customer = recipient.customer;

      if (!customer) {
        failedCount++;

        await prisma.campaignRecipient.update({
          where: {
            id: recipient.id,
          },

          data: {
            status: "FAILED",
          },
        });

        continue;
      }

      if (!customer.phone) {
        failedCount++;

        await prisma.campaignRecipient.update({
          where: {
            id: recipient.id,
          },

          data: {
            status: "FAILED",
          },
        });

        continue;
      }

      try {
        // =====================================================
        // CONVERSATION
        // =====================================================

        let conversation =
          await getOrCreateConversation(
            customer.phone
          );

        if (
          conversation.customerId !==
          customer.id
        ) {
          conversation =
            await prisma.conversation.update({
              where: {
                id: conversation.id,
              },

              data: {
                customerId:
                  customer.id,
              },
            });
        }

        // =====================================================
        // SEND TEMPLATE
        // =====================================================

        let result;

        /*
         * Your current template system appears to use:
         *
         * {{1}} = Customer name
         * {{2}} = Campaign/custom message
         *
         * Keep this compatible with your existing
         * WhatsApp service for now.
         */

        if (campaign.imageUrl) {
          result =
            await sendCampaignImageTemplate(
              customer.phone,

              campaign.template.name,

              campaign.imageUrl,

              [
                customer.name,
                campaign.messageContent || "",
              ],

              campaign.template.language ||
                "en_US"
            );
        } else {
          result =
            await sendTemplateMessage(
              customer.phone,

              campaign.template.name,

              [
                customer.name,
                campaign.messageContent || "",
              ],

              campaign.template.language ||
                "en_US"
            );
        }

        console.log(
          "WhatsApp Result:",
          result
        );

        // =====================================================
        // SUCCESS
        // =====================================================

        if (result?.success) {
          const metaMessageId =
            result.data?.messages?.[0]?.id ||
            null;

          sentCount++;

          await prisma.campaignRecipient.update({
            where: {
              id: recipient.id,
            },

            data: {
              status: "SENT",
              sentAt: new Date(),
            },
          });

          // =====================================================
          // SAVE MESSAGE
          // =====================================================

          await prisma.message.create({
            data: {
              conversationId:
                conversation.id,

              sender: "AGENT",

              content:
                campaign.messageContent ||
                campaign.template.content,

              imageUrl:
                campaign.imageUrl,

              messageType:
                campaign.imageUrl
                  ? "IMAGE"
                  : "TEXT",

              status: "SENT",

              metaMessageId,
            },
          });

          // =====================================================
          // UPDATE CONVERSATION
          // =====================================================

          await prisma.conversation.update({
            where: {
              id: conversation.id,
            },

            data: {
              lastMessage:
                campaign.messageContent ||
                campaign.template.content,
            },
          });

        } else {
          failedCount++;

          await prisma.campaignRecipient.update({
            where: {
              id: recipient.id,
            },

            data: {
              status: "FAILED",
            },
          });
        }

      } catch (error) {
        console.error(
          `Campaign send failed for ${customer.phone}:`,
          error
        );

        failedCount++;

        await prisma.campaignRecipient.update({
          where: {
            id: recipient.id,
          },

          data: {
            status: "FAILED",
          },
        });
      }
    }

    // =====================================================
    // FINAL CAMPAIGN STATUS
    // =====================================================

    let finalStatus = "COMPLETED";

    if (
      sentCount === 0 &&
      failedCount > 0
    ) {
      finalStatus = "FAILED";
    }

    const completedCampaign =
      await prisma.campaign.update({
        where: {
          id: campaign.id,
        },

        data: {
          status: finalStatus,

          completedAt:
            new Date(),

          sentCount,

          failedCount,

          totalRecipients:
            campaign.recipients.length,

          audienceCount:
            campaign.recipients.length,
        },
      });

    // =====================================================
    // AUDIT
    // =====================================================

    logAction({
      req,
      action: "UPDATE",
      module: "CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,

      changes: {
        after: {
          status: finalStatus,
          totalRecipients:
            campaign.recipients.length,
          sentCount,
          failedCount,
        },
      },
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message:
        finalStatus === "COMPLETED"
          ? "Campaign sent successfully."
          : "Campaign sending failed.",

      data: {
        campaignId:
          completedCampaign.id,

        status:
          completedCampaign.status,

        totalRecipients:
          campaign.recipients.length,

        sentCount,

        failedCount,
      },
    });

  } catch (error) {
    console.error(
      "Send Campaign Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to send campaign.",
      error: error.message,
    });
  }
};


// =====================================================
// GET CAMPAIGN RECIPIENTS
// =====================================================

exports.getCampaignRecipients = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const companyId =
      req.user.companyId;

    // =====================================================
    // MAKE SURE CAMPAIGN BELONGS TO COMPANY
    // =====================================================

    const campaign =
      await prisma.campaign.findFirst({
        where: {
          id,
          companyId,
        },

        select: {
          id: true,
        },
      });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message:
          "Campaign not found.",
      });
    }

    // =====================================================
    // GET RECIPIENTS
    // =====================================================

    const recipients =
      await prisma.campaignRecipient.findMany({
        where: {
          campaignId: id,
        },

        include: {
          customer: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: recipients.length,
      data: recipients,
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

