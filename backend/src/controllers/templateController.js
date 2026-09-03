
const prisma = require("../config/prisma");
const { generateTemplate } = require("../services/geminiService");
const {
  sendTemplateMessage,
} = require("../services/whatsappService");
const {
  getOrCreateConversation,
} = require("../helpers/conversationHelper");
const { logAction } = require("../services/auditLogService");

// ============================================================
// CREATE TEMPLATE
// ============================================================

const createTemplate = async (req, res) => {
  try {
    const {
      name,
      category,
      purpose,
      language,
      headerType,
      headerContent,
      content,
      footerContent,
    } = req.body;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Template category is required",
      });
    }

    if (!purpose) {
      return res.status(400).json({
        success: false,
        message: "Template purpose is required",
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Template language is required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template body is required",
      });
    }

    // ----------------------------------------------------------
    // HEADER VALIDATION
    // ----------------------------------------------------------

    if (
      headerType &&
      headerType !== "NONE" &&
      (!headerContent || !headerContent.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Header content is required",
      });
    }

    // ----------------------------------------------------------
    // CREATE TEMPLATE
    // ----------------------------------------------------------

    const template = await prisma.template.create({
      data: {
        companyId: req.user.companyId,
        createdById: req.user.userId,

        name: name.trim(),

        category,
        purpose,
        language,

        headerType: headerType || "NONE",
        headerContent:
          headerType && headerType !== "NONE"
            ? headerContent?.trim() || null
            : null,

        content: content.trim(),

        footerContent:
          footerContent?.trim() || null,

        // IMPORTANT:
        // New templates always start as DRAFT.
        status: "DRAFT",

        // This is a local CRM setting.
        autoSend: false,
      },
    });

    // ----------------------------------------------------------
    // AUDIT LOG
    // ----------------------------------------------------------

    logAction({
      req,
      action: "CREATE",
      module: "TEMPLATE",
      entityId: template.id,
      entityName: template.name,
    });

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Template saved as draft successfully",
      data: template,
    });
  } catch (error) {
    console.error("Create Template Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create template",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL TEMPLATES
// ============================================================

const getTemplates = async (req, res) => {
  try {
    const {
      search,
      category,
      purpose,
      language,
      status,
    } = req.query;

    // ----------------------------------------------------------
    // COMPANY ISOLATION
    // ----------------------------------------------------------

    const where = {
      companyId: req.user.companyId,
    };

    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    // ----------------------------------------------------------
    // FILTERS
    // ----------------------------------------------------------

    if (category) {
      where.category = category;
    }

    if (purpose) {
      where.purpose = purpose;
    }

    if (language) {
      where.language = language;
    }

    if (status) {
      where.status = status;
    }

    // ----------------------------------------------------------
    // FETCH
    // ----------------------------------------------------------

    const templates = await prisma.template.findMany({
      where,

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        recipients: {
          select: {
            customerId: true,
            status: true,
            sentAt: true,
            deliveredAt: true,
            readAt: true,
            metaMessageId: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error("Get Templates Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
      error: error.message,
    });
  }
};

// ============================================================
// GET SINGLE TEMPLATE
// ============================================================

const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
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
          select: {
            customerId: true,
            status: true,
            sentAt: true,
            deliveredAt: true,
            readAt: true,
            metaMessageId: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Get Template Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch template",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE TEMPLATE
// ============================================================

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      category,
      purpose,
      language,
      headerType,
      headerContent,
      content,
      footerContent,
    } = req.body;

    // ----------------------------------------------------------
    // FIND EXISTING TEMPLATE
    // ----------------------------------------------------------

    const existingTemplate =
      await prisma.template.findFirst({
        where: {
          id,
          companyId: req.user.companyId,
        },
      });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // ----------------------------------------------------------
    // DON'T ALLOW EDITING APPROVED TEMPLATE DIRECTLY
    // ----------------------------------------------------------

    if (
      existingTemplate.status === "APPROVED" ||
      existingTemplate.status === "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          existingTemplate.status === "APPROVED"
            ? "Approved templates cannot be edited directly. Create a new version instead."
            : "Templates pending approval cannot be edited.",
      });
    }

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Template category is required",
      });
    }

    if (!purpose) {
      return res.status(400).json({
        success: false,
        message: "Template purpose is required",
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Template language is required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template body is required",
      });
    }

    if (
      headerType &&
      headerType !== "NONE" &&
      (!headerContent || !headerContent.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Header content is required",
      });
    }

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------

    const template = await prisma.template.update({
      where: {
        id,
      },

      data: {
        name: name.trim(),

        category,
        purpose,
        language,

        headerType: headerType || "NONE",

        headerContent:
          headerType && headerType !== "NONE"
            ? headerContent?.trim() || null
            : null,

        content: content.trim(),

        footerContent:
          footerContent?.trim() || null,

        // Any modification puts the template back into draft.
        status: "DRAFT",
      },
    });

    // ----------------------------------------------------------
    // AUDIT LOG
    // ----------------------------------------------------------

    logAction({
      req,
      action: "UPDATE",
      module: "TEMPLATE",
      entityId: template.id,
      entityName: template.name,

      changes: {
        before: {
          name: existingTemplate.name,
          category: existingTemplate.category,
          purpose: existingTemplate.purpose,
          language: existingTemplate.language,
          headerType: existingTemplate.headerType,
          headerContent: existingTemplate.headerContent,
          content: existingTemplate.content,
          footerContent: existingTemplate.footerContent,
          status: existingTemplate.status,
        },

        after: {
          name: template.name,
          category: template.category,
          purpose: template.purpose,
          language: template.language,
          headerType: template.headerType,
          headerContent: template.headerContent,
          content: template.content,
          footerContent: template.footerContent,
          status: template.status,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("Update Template Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update template",
      error: error.message,
    });
  }
};

// ============================================================
// DELETE TEMPLATE
// ============================================================

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // ----------------------------------------------------------
    // FIND TEMPLATE
    // ----------------------------------------------------------

    const existingTemplate =
      await prisma.template.findFirst({
        where: {
          id,
          companyId: req.user.companyId,
        },
      });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // ----------------------------------------------------------
    // DELETE
    // ----------------------------------------------------------

    await prisma.template.delete({
      where: {
        id,
      },
    });

    // ----------------------------------------------------------
    // AUDIT LOG
    // ----------------------------------------------------------

    logAction({
      req,
      action: "DELETE",
      module: "TEMPLATE",
      entityId: existingTemplate.id,
      entityName: existingTemplate.name,
    });

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Delete Template Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete template",
      error: error.message,
    });
  }
};

// ============================================================
// SEND TEMPLATE
// ============================================================

const sendTemplate = async (req, res) => {
  try {
    const {
      templateId,
      customerIds,
    } = req.body;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (
      !templateId ||
      !Array.isArray(customerIds) ||
      customerIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Template ID and customers are required.",
      });
    }

    // ----------------------------------------------------------
    // FIND TEMPLATE
    // ----------------------------------------------------------

    const template =
      await prisma.template.findFirst({
        where: {
          id: templateId,
          companyId: req.user.companyId,
        },
      });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }

    // ----------------------------------------------------------
    // ONLY APPROVED TEMPLATES CAN BE SENT
    // ----------------------------------------------------------

    if (template.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message:
          "Only Meta-approved templates can be sent.",
      });
    }

    // ----------------------------------------------------------
    // SEND TO CUSTOMERS
    // ----------------------------------------------------------

    const results = [];

    for (const customerId of customerIds) {
      try {
        // ------------------------------------------------------
        // FIND CUSTOMER
        // ------------------------------------------------------

        const customer =
          await prisma.customer.findFirst({
            where: {
              id: customerId,
              companyId: req.user.companyId,
            },
          });

        if (!customer) {
          results.push({
            customerId,
            status: "FAILED",
            reason: "Customer not found",
          });

          continue;
        }

        // ------------------------------------------------------
        // GET / CREATE CONVERSATION
        // ------------------------------------------------------

        let conversation =
          await getOrCreateConversation(
            customer.phone
          );

        if (
          conversation.customerId !== customerId
        ) {
          conversation =
            await prisma.conversation.update({
              where: {
                id: conversation.id,
              },

              data: {
                customerId,
              },
            });
        }

        // ------------------------------------------------------
        // SEND META TEMPLATE
        // ------------------------------------------------------

        /*
         * IMPORTANT:
         *
         * This currently assumes your Template model
         * contains the actual Meta template name.
         *
         * Your current Prisma model does NOT yet have
         * metaTemplateName.
         *
         * Therefore this is a temporary placeholder.
         *
         * We will add the Meta fields later when you
         * connect Embedded Signup / WABA.
         */

        const metaTemplateName =
          template.name;

        const variables = [];

        const result =
          await sendTemplateMessage(
            customer.phone,
            metaTemplateName,
            variables
          );

        let sendStatus = "FAILED";
        let metaMessageId = null;

        if (result?.success) {
          sendStatus = "SENT";

          metaMessageId =
            result.data?.messages?.[0]?.id ||
            null;
        }

        // ------------------------------------------------------
        // SAVE MESSAGE
        // ------------------------------------------------------

        await prisma.message.create({
          data: {
            conversationId:
              conversation.id,

            sender: "AGENT",

            content: template.content,

            messageType: "TEXT",

            status: sendStatus,

            metaMessageId,
          },
        });

        // ------------------------------------------------------
        // TEMPLATE RECIPIENT
        // ------------------------------------------------------

        await prisma.templateRecipient.upsert({
          where: {
            templateId_customerId: {
              templateId,
              customerId,
            },
          },

          update: {
            status: sendStatus === "SENT"
              ? "SENT"
              : "FAILED",

            sentAt:
              sendStatus === "SENT"
                ? new Date()
                : null,

            metaMessageId,
          },

          create: {
            templateId,
            customerId,

            status: sendStatus === "SENT"
              ? "SENT"
              : "FAILED",

            sentAt:
              sendStatus === "SENT"
                ? new Date()
                : null,

            metaMessageId,
          },
        });

        // ------------------------------------------------------
        // UPDATE CONVERSATION
        // ------------------------------------------------------

        if (sendStatus === "SENT") {
          await prisma.conversation.update({
            where: {
              id: conversation.id,
            },

            data: {
              lastMessage: template.content,
              updatedAt: new Date(),
            },
          });
        }

        results.push({
          customerId,
          status: sendStatus,
          metaMessageId,
        });
      } catch (customerError) {
        console.error(
          `Template send failed for customer ${customerId}:`,
          customerError
        );

        results.push({
          customerId,
          status: "FAILED",
          reason: customerError.message,
        });
      }
    }

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    const successful =
      results.filter(
        (item) => item.status === "SENT"
      ).length;

    const failed =
      results.filter(
        (item) => item.status === "FAILED"
      ).length;

    return res.status(200).json({
      success: true,

      message:
        "Template sending completed.",

      summary: {
        total: results.length,
        successful,
        failed,
      },

      data: results,
    });
  } catch (error) {
    console.error(
      "Send Template Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send template.",
      error: error.message,
    });
  }
};

// ============================================================
// GENERATE TEMPLATE WITH AI
// ============================================================

const generateTemplateWithAI = async (
  req,
  res
) => {
  try {
    const {
      topic,
      tone = "Professional",
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "Topic is required.",
      });
    }

    const content =
      await generateTemplate(
        topic.trim(),
        tone
      );

    return res.status(200).json({
      success: true,
      message:
        "Template generated successfully.",

      data: {
        content,
      },
    });
  } catch (error) {
    console.error(
      "Generate Template AI Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate template.",
      error: error.message,
    });
  }
};

// ============================================================
// GET TEMPLATE RECIPIENTS
// ============================================================

const getTemplateRecipients = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ----------------------------------------------------------
    // VERIFY TEMPLATE BELONGS TO COMPANY
    // ----------------------------------------------------------

    const template =
      await prisma.template.findFirst({
        where: {
          id,
          companyId: req.user.companyId,
        },
      });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // ----------------------------------------------------------
    // FETCH RECIPIENTS
    // ----------------------------------------------------------

    const recipients =
      await prisma.templateRecipient.findMany({
        where: {
          templateId: id,
        },

        select: {
          customerId: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          readAt: true,
          metaMessageId: true,
        },
      });

    return res.status(200).json({
      success: true,
      data: recipients,
    });
  } catch (error) {
    console.error(
      "Get Template Recipients Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch template recipients.",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

// ============================================================
// SUBMIT TEMPLATE FOR APPROVAL
// ============================================================

const submitTemplateForApproval = async (req, res) => {
  try {
    const { id } = req.params;

    // ----------------------------------------------------------
    // FIND TEMPLATE
    // ----------------------------------------------------------

    const template = await prisma.template.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }

    // ----------------------------------------------------------
    // ONLY DRAFT / REJECTED CAN BE SUBMITTED
    // ----------------------------------------------------------

    if (
      template.status !== "DRAFT" &&
      template.status !== "REJECTED"
    ) {
      return res.status(400).json({
        success: false,
        message: `Template cannot be submitted from ${template.status} status.`,
      });
    }

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!template.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template name is required.",
      });
    }

    if (!template.category) {
      return res.status(400).json({
        success: false,
        message: "Template category is required.",
      });
    }

    if (!template.language) {
      return res.status(400).json({
        success: false,
        message: "Template language is required.",
      });
    }

    if (!template.content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template body is required.",
      });
    }

    // ----------------------------------------------------------
    // UPDATE STATUS
    // ----------------------------------------------------------

    const updatedTemplate = await prisma.template.update({
      where: {
        id: template.id,
      },

      data: {
        status: "PENDING",
      },
    });

    // ----------------------------------------------------------
    // AUDIT LOG
    // ----------------------------------------------------------

    logAction({
      req,
      action: "STATUS_CHANGE",
      module: "TEMPLATE",
      entityId: updatedTemplate.id,
      entityName: updatedTemplate.name,

      changes: {
        before: {
          status: template.status,
        },

        after: {
          status: updatedTemplate.status,
        },
      },
    });

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Template submitted for approval successfully.",
      data: updatedTemplate,
    });
  } catch (error) {
    console.error(
      "Submit Template For Approval Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to submit template for approval.",
      error: error.message,
    });
  }
};


module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  sendTemplate,
  generateTemplateWithAI,
  getTemplateRecipients,
  submitTemplateForApproval,
};