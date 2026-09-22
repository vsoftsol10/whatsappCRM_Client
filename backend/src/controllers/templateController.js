
// const prisma = require("../config/prisma");
// const { generateTemplate } = require("../services/geminiService");
// const {
//   sendTemplateMessage,
//   createMetaTemplate,
// } = require("../services/saasWhatsAppService");
// const {
//   getOrCreateSaaSConversation,
// } = require("../helpers/saasConversationHelper");
// const { logAction } = require("../services/auditLogService");

// // ============================================================
// // HELPER: extract variable numbers from body text
// // ============================================================
// // Finds {{1}}, {{2}}, {{3}}... and returns a sorted, de-duplicated
// // list of variable numbers as strings, e.g. ["1", "2"]

// // 👈 FIXED: allow optional whitespace inside the braces, e.g. "{{ 1 }}".
// // The old regex (\{\{(\d+)\}\}) required zero spaces, which meant a body
// // like "Hi {{ 1 }}, welcome..." was seen as having 0 variables here even
// // though the frontend's own detector (CreateCampaignModal.jsx) DOES allow
// // spaces — that mismatch is what let templates through creation/approval
// // with a variable count of 0 on the backend, causing empty template
// // parameters to be sent to Meta at send time later.
// const extractVariables = (content) => {
//   const matches = [...content.matchAll(/\{\{\s*(\d+)\s*\}\}/g)];
//   const unique = [...new Set(matches.map((m) => m[1]))];
//   return unique.sort((a, b) => Number(a) - Number(b));
// };

// // ============================================================
// // CREATE TEMPLATE
// // ============================================================

// const createTemplate = async (req, res) => {
//   try {
//     const {
//       name,
//       category,
//       purpose,
//       language,
//       headerType,
//       headerContent,
//       content,
//       footerContent,
//       bodyExamples, // 👈 NEW
//     } = req.body;

//     // ----------------------------------------------------------
//     // VALIDATION
//     // ----------------------------------------------------------

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Template name is required",
//       });
//     }

//     if (!category) {
//       return res.status(400).json({
//         success: false,
//         message: "Template category is required",
//       });
//     }

//     if (!purpose) {
//       return res.status(400).json({
//         success: false,
//         message: "Template purpose is required",
//       });
//     }

//     if (!language) {
//       return res.status(400).json({
//         success: false,
//         message: "Template language is required",
//       });
//     }

//     if (!content || !content.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Template body is required",
//       });
//     }

//     // ----------------------------------------------------------
//     // HEADER VALIDATION
//     // ----------------------------------------------------------

//     if (
//       headerType &&
//       headerType !== "NONE" &&
//       (!headerContent || !headerContent.trim())
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Header content is required",
//       });
//     }

//     // ----------------------------------------------------------
//     // BODY VARIABLE / EXAMPLE VALIDATION  👈 NEW
//     // ----------------------------------------------------------
//     // If the body has {{1}}, {{2}}, etc., every one of them needs
//     // a matching sample value or Meta will reject the submission
//     // later. Catch it here, at creation time, instead.

//     const detectedVariables = extractVariables(content);

//     if (detectedVariables.length > 0) {
//       const examples = Array.isArray(bodyExamples) ? bodyExamples : [];

//       if (examples.length < detectedVariables.length) {
//         return res.status(400).json({
//           success: false,
//           message: `Sample values are required for all variables: ${detectedVariables
//             .map((v) => `{{${v}}}`)
//             .join(", ")}`,
//         });
//       }
//     }

//     // ----------------------------------------------------------
//     // CREATE TEMPLATE
//     // ----------------------------------------------------------

//     const template = await prisma.template.create({
//       data: {
//         companyId: req.user.companyId,
//         createdById: req.user.userId,

//         name: name.trim(),

//         category,
//         purpose,
//         language,

//         headerType: headerType || "NONE",
//         headerContent:
//           headerType && headerType !== "NONE"
//             ? headerContent?.trim() || null
//             : null,

//         content: content.trim(),

//         footerContent:
//           footerContent?.trim() || null,

//         // 👈 NEW: store sample values as-is (Prisma Json field).
//         // undefined if none were sent, so Prisma just skips setting it.
//         bodyExamples: Array.isArray(bodyExamples) ? bodyExamples : undefined,

//         // IMPORTANT:
//         // New templates always start as DRAFT.
//         status: "DRAFT",

//         // This is a local CRM setting.
//         autoSend: false,
//       },
//     });

//     // ----------------------------------------------------------
//     // AUDIT LOG
//     // ----------------------------------------------------------

//     logAction({
//       req,
//       action: "CREATE",
//       module: "TEMPLATE",
//       entityId: template.id,
//       entityName: template.name,
//     });

//     // ----------------------------------------------------------
//     // RESPONSE
//     // ----------------------------------------------------------

//     return res.status(201).json({
//       success: true,
//       message: "Template saved as draft successfully",
//       data: template,
//     });
//   } catch (error) {
//     console.error("Create Template Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create template",
//       error: error.message,
//     });
//   }
// };

// // ============================================================
// // GET ALL TEMPLATES
// // ============================================================

// const getTemplates = async (req, res) => {
//   try {
//     const {
//       search,
//       category,
//       purpose,
//       language,
//       status,
//     } = req.query;

//     // ----------------------------------------------------------
//     // COMPANY ISOLATION
//     // ----------------------------------------------------------

//     const where = {
//       companyId: req.user.companyId,
//     };

//     // ----------------------------------------------------------
//     // SEARCH
//     // ----------------------------------------------------------

//     if (search && search.trim()) {
//       where.name = {
//         contains: search.trim(),
//         mode: "insensitive",
//       };
//     }

//     // ----------------------------------------------------------
//     // FILTERS
//     // ----------------------------------------------------------

//     if (category) {
//       where.category = category;
//     }

//     if (purpose) {
//       where.purpose = purpose;
//     }

//     if (language) {
//       where.language = language;
//     }

//     if (status) {
//       where.status = status;
//     }

//     // ----------------------------------------------------------
//     // FETCH
//     // ----------------------------------------------------------

//     const templates = await prisma.template.findMany({
//       where,

//       include: {
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },

//         recipients: {
//           select: {
//             customerId: true,
//             status: true,
//             sentAt: true,
//             deliveredAt: true,
//             readAt: true,
//             metaMessageId: true,
//           },
//         },
//       },

//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       count: templates.length,
//       data: templates,
//     });
//   } catch (error) {
//     console.error("Get Templates Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch templates",
//       error: error.message,
//     });
//   }
// };

// // ============================================================
// // GET SINGLE TEMPLATE
// // ============================================================

// const getTemplateById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const template = await prisma.template.findFirst({
//       where: {
//         id,
//         companyId: req.user.companyId,
//       },

//       include: {
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },

//         recipients: {
//           select: {
//             customerId: true,
//             status: true,
//             sentAt: true,
//             deliveredAt: true,
//             readAt: true,
//             metaMessageId: true,
//           },
//         },
//       },
//     });

//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         message: "Template not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: template,
//     });
//   } catch (error) {
//     console.error("Get Template Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch template",
//       error: error.message,
//     });
//   }
// };

// // ============================================================
// // UPDATE TEMPLATE
// // ============================================================

// const updateTemplate = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       name,
//       category,
//       purpose,
//       language,
//       headerType,
//       headerContent,
//       content,
//       footerContent,
//       bodyExamples, // 👈 NEW
//     } = req.body;

//     // ----------------------------------------------------------
//     // FIND EXISTING TEMPLATE
//     // ----------------------------------------------------------

//     const existingTemplate =
//       await prisma.template.findFirst({
//         where: {
//           id,
//           companyId: req.user.companyId,
//         },
//       });

//     if (!existingTemplate) {
//       return res.status(404).json({
//         success: false,
//         message: "Template not found",
//       });
//     }

//     // ----------------------------------------------------------
//     // DON'T ALLOW EDITING APPROVED TEMPLATE DIRECTLY
//     // ----------------------------------------------------------

//     if (
//       existingTemplate.status === "APPROVED" ||
//       existingTemplate.status === "PENDING"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           existingTemplate.status === "APPROVED"
//             ? "Approved templates cannot be edited directly. Create a new version instead."
//             : "Templates pending approval cannot be edited.",
//       });
//     }

//     // ----------------------------------------------------------
//     // VALIDATION
//     // ----------------------------------------------------------

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Template name is required",
//       });
//     }

//     if (!category) {
//       return res.status(400).json({
//         success: false,
//         message: "Template category is required",
//       });
//     }

//     if (!purpose) {
//       return res.status(400).json({
//         success: false,
//         message: "Template purpose is required",
//       });
//     }

//     if (!language) {
//       return res.status(400).json({
//         success: false,
//         message: "Template language is required",
//       });
//     }

//     if (!content || !content.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Template body is required",
//       });
//     }

//     if (
//       headerType &&
//       headerType !== "NONE" &&
//       (!headerContent || !headerContent.trim())
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Header content is required",
//       });
//     }

//     // ----------------------------------------------------------
//     // BODY VARIABLE / EXAMPLE VALIDATION  👈 NEW
//     // ----------------------------------------------------------

//     const detectedVariables = extractVariables(content);

//     if (detectedVariables.length > 0) {
//       const examples = Array.isArray(bodyExamples) ? bodyExamples : [];

//       if (examples.length < detectedVariables.length) {
//         return res.status(400).json({
//           success: false,
//           message: `Sample values are required for all variables: ${detectedVariables
//             .map((v) => `{{${v}}}`)
//             .join(", ")}`,
//         });
//       }
//     }

//     // ----------------------------------------------------------
//     // UPDATE
//     // ----------------------------------------------------------

//     const template = await prisma.template.update({
//       where: {
//         id,
//       },

//       data: {
//         name: name.trim(),

//         category,
//         purpose,
//         language,

//         headerType: headerType || "NONE",

//         headerContent:
//           headerType && headerType !== "NONE"
//             ? headerContent?.trim() || null
//             : null,

//         content: content.trim(),

//         footerContent:
//           footerContent?.trim() || null,

//         // 👈 NEW
//         bodyExamples: Array.isArray(bodyExamples) ? bodyExamples : undefined,

//         // Any modification puts the template back into draft.
//         status: "DRAFT",
//       },
//     });

//     // ----------------------------------------------------------
//     // AUDIT LOG
//     // ----------------------------------------------------------

//     logAction({
//       req,
//       action: "UPDATE",
//       module: "TEMPLATE",
//       entityId: template.id,
//       entityName: template.name,

//       changes: {
//         before: {
//           name: existingTemplate.name,
//           category: existingTemplate.category,
//           purpose: existingTemplate.purpose,
//           language: existingTemplate.language,
//           headerType: existingTemplate.headerType,
//           headerContent: existingTemplate.headerContent,
//           content: existingTemplate.content,
//           footerContent: existingTemplate.footerContent,
//           status: existingTemplate.status,
//         },

//         after: {
//           name: template.name,
//           category: template.category,
//           purpose: template.purpose,
//           language: template.language,
//           headerType: template.headerType,
//           headerContent: template.headerContent,
//           content: template.content,
//           footerContent: template.footerContent,
//           status: template.status,
//         },
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Template updated successfully",
//       data: template,
//     });
//   } catch (error) {
//     console.error("Update Template Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update template",
//       error: error.message,
//     });
//   }
// };

// // ============================================================
// // DELETE TEMPLATE
// // ============================================================

// const deleteTemplate = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // ----------------------------------------------------------
//     // FIND TEMPLATE
//     // ----------------------------------------------------------

//     const existingTemplate =
//       await prisma.template.findFirst({
//         where: {
//           id,
//           companyId: req.user.companyId,
//         },
//       });

//     if (!existingTemplate) {
//       return res.status(404).json({
//         success: false,
//         message: "Template not found",
//       });
//     }

//     // ----------------------------------------------------------
//     // DELETE
//     // ----------------------------------------------------------

//     await prisma.template.delete({
//       where: {
//         id,
//       },
//     });

//     // ----------------------------------------------------------
//     // AUDIT LOG
//     // ----------------------------------------------------------

//     logAction({
//       req,
//       action: "DELETE",
//       module: "TEMPLATE",
//       entityId: existingTemplate.id,
//       entityName: existingTemplate.name,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Template deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete Template Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete template",
//       error: error.message,
//     });
//   }
// };

// // ============================================================
// // SEND TEMPLATE
// // ============================================================

// const sendTemplate = async (req, res) => {
//   try {
//     const {
//       templateId,
//       customerIds,
//     } = req.body;

//     // ----------------------------------------------------------
//     // VALIDATION
//     // ----------------------------------------------------------

//     if (
//       !templateId ||
//       !Array.isArray(customerIds) ||
//       customerIds.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Template ID and customers are required.",
//       });
//     }

//     // ----------------------------------------------------------
//     // FIND TEMPLATE
//     // ----------------------------------------------------------

//     const template =
//       await prisma.template.findFirst({
//         where: {
//           id: templateId,
//           companyId: req.user.companyId,
//         },
//       });

//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         message: "Template not found.",
//       });
//     }

//     // ----------------------------------------------------------
//     // ONLY APPROVED TEMPLATES CAN BE SENT
//     // ----------------------------------------------------------

//     if (template.status !== "APPROVED") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only Meta-approved templates can be sent.",
//       });
//     }

//     // ----------------------------------------------------------
//     // CONFIRM COMPANY HAS A CONNECTED WHATSAPP ACCOUNT
//     // ----------------------------------------------------------

//     const whatsappAccount = await prisma.whatsAppAccount.findFirst({
//       where: {
//         companyId: req.user.companyId,
//         status: "CONNECTED",
//       },
//     });

//     if (!whatsappAccount) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "No connected WhatsApp Business Account found for your company.",
//       });
//     }

//     if (!template.metaTemplateId) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "This template has not been submitted to Meta yet, so it has no approved Meta template name to send.",
//       });
//     }

//     // ----------------------------------------------------------
//     // SEND TO CUSTOMERS
//     // ----------------------------------------------------------

//     const results = [];

//     for (const customerId of customerIds) {
//       try {
//         // ------------------------------------------------------
//         // FIND CUSTOMER
//         // ------------------------------------------------------

//         const customer =
//           await prisma.customer.findFirst({
//             where: {
//               id: customerId,
//               companyId: req.user.companyId,
//             },
//           });

//         if (!customer) {
//           results.push({
//             customerId,
//             status: "FAILED",
//             reason: "Customer not found",
//           });

//           continue;
//         }

//         // ------------------------------------------------------
//         // GET / CREATE CONVERSATION (scoped to this company)
//         // ------------------------------------------------------

//         const conversation = await getOrCreateSaaSConversation(
//           req.user.companyId,
//           whatsappAccount.id,
//           customer.phone
//         );

//         // ------------------------------------------------------
//         // SEND META TEMPLATE (using this company's own WABA/token)
//         // ------------------------------------------------------
      

//         const metaTemplateName = template.name;

//         // 👈 FIXED: use the same permissive regex as extractVariables()
//         // so this always agrees with what was validated at template
//         // creation/approval time.
//         const variableCount = (
//           template.content.match(/\{\{\s*\d+\s*\}\}/g) || []
//         ).length;

//         const variables =
//           variableCount > 0 ? [customer.name] : [];

//         const result = await sendTemplateMessage(
//           req.user.companyId,
//           customer.phone,
//           metaTemplateName,
//           template.language,
//           variables
//         );

//         let sendStatus = "FAILED";
//         let metaMessageId = null;

//         if (result?.success) {
//           sendStatus = "SENT";

//           metaMessageId =
//             result.data?.messages?.[0]?.id ||
//             null;
//         }

//         // ------------------------------------------------------
//         // SAVE MESSAGE
//         // ------------------------------------------------------

//         await prisma.message.create({
//           data: {
//             conversationId:
//               conversation.id,

//             sender: "AGENT",

//             content: template.content,

//             messageType: "TEXT",

//             status: sendStatus,

//             metaMessageId,
//           },
//         });

//         // ------------------------------------------------------
//         // TEMPLATE RECIPIENT
//         // ------------------------------------------------------

//         await prisma.templateRecipient.upsert({
//           where: {
//             templateId_customerId: {
//               templateId,
//               customerId,
//             },
//           },

//           update: {
//             status: sendStatus === "SENT"
//               ? "SENT"
//               : "FAILED",

//             sentAt:
//               sendStatus === "SENT"
//                 ? new Date()
//                 : null,

//             metaMessageId,
//           },

//           create: {
//             templateId,
//             customerId,

//             status: sendStatus === "SENT"
//               ? "SENT"
//               : "FAILED",

//             sentAt:
//               sendStatus === "SENT"
//                 ? new Date()
//                 : null,

//             metaMessageId,
//           },
//         });

//         // ------------------------------------------------------
//         // UPDATE CONVERSATION
//         // ------------------------------------------------------

//         if (sendStatus === "SENT") {
//           await prisma.conversation.update({
//             where: {
//               id: conversation.id,
//             },

//             data: {
//               lastMessage: template.content,
//               updatedAt: new Date(),
//             },
//           });
//         }

//         results.push({
//           customerId,
//           status: sendStatus,
//           metaMessageId,
//         });
//       } catch (customerError) {
//         console.error(
//           `Template send failed for customer ${customerId}:`,
//           customerError
//         );

//         results.push({
//           customerId,
//           status: "FAILED",
//           reason: customerError.message,
//         });
//       }
//     }

//     // ----------------------------------------------------------
//     // RESPONSE
//     // ----------------------------------------------------------

//     const successful =
//       results.filter(
//         (item) => item.status === "SENT"
//       ).length;

//     const failed =
//       results.filter(
//         (item) => item.status === "FAILED"
//       ).length;

//     return res.status(200).json({
//       success: true,

//       message:
//         "Template sending completed.",

//       summary: {
//         total: results.length,
//         successful,
//         failed,
//       },

//       data: results,
//     });
//   } catch (error) {
//     console.error(
//       "Send Template Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Failed to send template.",
//       error: error.message,
//     });
//   }
// };

// // ============================================================
// // GENERATE TEMPLATE WITH AI
// // ============================================================

// const generateTemplateWithAI = async (
//   req,
//   res
// ) => {
//   try {
//     const {
//       topic,
//       tone = "Professional",
//     } = req.body;

//     if (!topic || !topic.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Topic is required.",
//       });
//     }

//     const content =
//       await generateTemplate(
//         topic.trim(),
//         tone
//       );

//     return res.status(200).json({
//       success: true,
//       message:
//         "Template generated successfully.",

//       data: {
//         content,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Generate Template AI Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to generate template.",
//       error: error.message,
//     });
//   }
// };

// // ============================================================
// // GET TEMPLATE RECIPIENTS
// // ============================================================

// const getTemplateRecipients = async (
//   req,
//   res
// ) => {
//   try {
//     const { id } = req.params;

//     // ----------------------------------------------------------
//     // VERIFY TEMPLATE BELONGS TO COMPANY
//     // ----------------------------------------------------------

//     const template =
//       await prisma.template.findFirst({
//         where: {
//           id,
//           companyId: req.user.companyId,
//         },
//       });

//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         message: "Template not found",
//       });
//     }

//     // ----------------------------------------------------------
//     // FETCH RECIPIENTS
//     // ----------------------------------------------------------

//     const recipients =
//       await prisma.templateRecipient.findMany({
//         where: {
//           templateId: id,
//         },

//         select: {
//           customerId: true,
//           status: true,
//           sentAt: true,
//           deliveredAt: true,
//           readAt: true,
//           metaMessageId: true,
//         },
//       });

//     return res.status(200).json({
//       success: true,
//       data: recipients,
//     });
//   } catch (error) {
//     console.error(
//       "Get Template Recipients Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to fetch template recipients.",
//       error: error.message,
//     });
//   }
// };

// // ============================================================
// // SUBMIT TEMPLATE FOR APPROVAL  (now actually calls Meta)
// // ============================================================

// const submitTemplateForApproval = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // ----------------------------------------------------------
//     // FIND TEMPLATE
//     // ----------------------------------------------------------

//     const template = await prisma.template.findFirst({
//       where: {
//         id,
//         companyId: req.user.companyId,
//       },
//     });

//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         message: "Template not found.",
//       });
//     }

//     // ----------------------------------------------------------
//     // ONLY DRAFT / REJECTED CAN BE SUBMITTED
//     // ----------------------------------------------------------

//     if (template.status !== "DRAFT" && template.status !== "REJECTED") {
//       return res.status(400).json({
//         success: false,
//         message: `Template cannot be submitted from ${template.status} status.`,
//       });
//     }

//     // ----------------------------------------------------------
//     // VALIDATION
//     // ----------------------------------------------------------

//     if (!template.name?.trim()) {
//       return res.status(400).json({ success: false, message: "Template name is required." });
//     }
//     if (!template.category) {
//       return res.status(400).json({ success: false, message: "Template category is required." });
//     }
//     if (!template.language) {
//       return res.status(400).json({ success: false, message: "Template language is required." });
//     }
//     if (!template.content?.trim()) {
//       return res.status(400).json({ success: false, message: "Template body is required." });
//     }

//     // ----------------------------------------------------------
//     // BODY VARIABLE / EXAMPLE VALIDATION  👈 NEW
//     // ----------------------------------------------------------
//     // Belt-and-braces: even though createTemplate/updateTemplate
//     // already require this, re-check here too, since submit can
//     // fire on a REJECTED template that might have been edited by
//     // some other path.

//     const detectedVariables = extractVariables(template.content);

//     if (detectedVariables.length > 0) {
//       const examples = Array.isArray(template.bodyExamples)
//         ? template.bodyExamples
//         : [];

//       if (examples.length < detectedVariables.length) {
//         return res.status(400).json({
//           success: false,
//           message: `Sample values are required for all variables: ${detectedVariables
//             .map((v) => `{{${v}}}`)
//             .join(", ")} before submitting to Meta.`,
//         });
//       }
//     }

//     // ----------------------------------------------------------
//     // CONFIRM COMPANY HAS A CONNECTED WHATSAPP ACCOUNT
//     // ----------------------------------------------------------

//     const whatsappAccount = await prisma.whatsAppAccount.findFirst({
//       where: {
//         companyId: req.user.companyId,
//         status: "CONNECTED",
//       },
//     });

//         if (!whatsappAccount || !whatsappAccount.wabaId) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "No connected WhatsApp Business Account found for your company. Please connect WhatsApp before submitting templates.",
//       });
//     }

//     if (!process.env.META_SYSTEM_USER_TOKEN) {
//       return res.status(500).json({
//         success: false,
//         message:
//           "Server is not configured with a WhatsApp system token. Contact support.",
//       });
//     }

//     // ----------------------------------------------------------
//     // CALL META'S GRAPH API (using this company's own WABA + token)
//     // ----------------------------------------------------------

//     const metaResult = await createMetaTemplate(req.user.companyId, {
//       name: template.name,
//       category: template.category,
//       language: template.language,
//       headerType: template.headerType,
//       headerContent: template.headerContent,
//       bodyText: template.content,
//       bodyExamples: template.bodyExamples, // 👈 NEW
//       footerContent: template.footerContent,
//     });

//     if (!metaResult.success) {
//       const metaErrorMessage =
//         typeof metaResult.error === "string"
//           ? metaResult.error
//           : metaResult.error?.message || "Unknown error";

//       return res.status(400).json({
//         success: false,
//         message: `Meta rejected this template: ${metaErrorMessage}`,
//       });
//     }

//     // ----------------------------------------------------------
//     // UPDATE LOCAL RECORD WITH META'S RESPONSE
//     // ----------------------------------------------------------
//     // Meta's create-template response includes: { id, status, category }
//     // status here is usually "PENDING" immediately after creation.

//     const updatedTemplate = await prisma.template.update({
//       where: { id: template.id },
//       data: {
//         status: "PENDING",
//         metaTemplateId: metaResult.data.id,
//         rejectionReason: null,
//       },
//     });

//     // ----------------------------------------------------------
//     // AUDIT LOG
//     // ----------------------------------------------------------

//     logAction({
//       req,
//       action: "STATUS_CHANGE",
//       module: "TEMPLATE",
//       entityId: updatedTemplate.id,
//       entityName: updatedTemplate.name,
//       changes: {
//         before: { status: template.status },
//         after: { status: updatedTemplate.status, metaTemplateId: metaResult.data.id },
//       },
//     });

//     // ----------------------------------------------------------
//     // RESPONSE
//     // ----------------------------------------------------------

//     return res.status(200).json({
//       success: true,
//       message: "Template submitted to Meta for approval.",
//       data: updatedTemplate,
//     });
//   } catch (error) {
//     console.error("Submit Template For Approval Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to submit template for approval.",
//       error: error.message,
//     });
//   }
// };

// module.exports = {
//   createTemplate,
//   getTemplates,
//   getTemplateById,
//   updateTemplate,
//   deleteTemplate,
//   sendTemplate,
//   generateTemplateWithAI,
//   getTemplateRecipients,
//   submitTemplateForApproval,
// };
 


const prisma = require("../config/prisma");
const { generateTemplate } = require("../services/geminiService");
const {
  sendTemplateMessage,
  createMetaTemplate,
} = require("../services/saasWhatsAppService");
// 👈 NEW: only used inside submitTemplateForApproval, for IMAGE / VIDEO /
// DOCUMENT headers — see that function below for why this is needed.
const {
  uploadHeaderMediaToMeta,
} = require("../services/metaMediaUploadService");
const {
  getOrCreateSaaSConversation,
} = require("../helpers/saasConversationHelper");
const { logAction } = require("../services/auditLogService");

// ============================================================
// HELPER: extract variable numbers from body text
// ============================================================
// Finds {{1}}, {{2}}, {{3}}... and returns a sorted, de-duplicated
// list of variable numbers as strings, e.g. ["1", "2"]

// 👈 FIXED: allow optional whitespace inside the braces, e.g. "{{ 1 }}".
// The old regex (\{\{(\d+)\}\}) required zero spaces, which meant a body
// like "Hi {{ 1 }}, welcome..." was seen as having 0 variables here even
// though the frontend's own detector (CreateCampaignModal.jsx) DOES allow
// spaces — that mismatch is what let templates through creation/approval
// with a variable count of 0 on the backend, causing empty template
// parameters to be sent to Meta at send time later.
const extractVariables = (content) => {
  const matches = [...content.matchAll(/\{\{\s*(\d+)\s*\}\}/g)];
  const unique = [...new Set(matches.map((m) => m[1]))];
  return unique.sort((a, b) => Number(a) - Number(b));
};

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
      bodyExamples, // 👈 NEW
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
    // BODY VARIABLE / EXAMPLE VALIDATION  👈 NEW
    // ----------------------------------------------------------
    // If the body has {{1}}, {{2}}, etc., every one of them needs
    // a matching sample value or Meta will reject the submission
    // later. Catch it here, at creation time, instead.

    const detectedVariables = extractVariables(content);

    if (detectedVariables.length > 0) {
      const examples = Array.isArray(bodyExamples) ? bodyExamples : [];

      if (examples.length < detectedVariables.length) {
        return res.status(400).json({
          success: false,
          message: `Sample values are required for all variables: ${detectedVariables
            .map((v) => `{{${v}}}`)
            .join(", ")}`,
        });
      }
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

        // 👈 NEW: store sample values as-is (Prisma Json field).
        // undefined if none were sent, so Prisma just skips setting it.
        bodyExamples: Array.isArray(bodyExamples) ? bodyExamples : undefined,

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
      bodyExamples, // 👈 NEW
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
    // BODY VARIABLE / EXAMPLE VALIDATION  👈 NEW
    // ----------------------------------------------------------

    const detectedVariables = extractVariables(content);

    if (detectedVariables.length > 0) {
      const examples = Array.isArray(bodyExamples) ? bodyExamples : [];

      if (examples.length < detectedVariables.length) {
        return res.status(400).json({
          success: false,
          message: `Sample values are required for all variables: ${detectedVariables
            .map((v) => `{{${v}}}`)
            .join(", ")}`,
        });
      }
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

        // 👈 NEW
        bodyExamples: Array.isArray(bodyExamples) ? bodyExamples : undefined,

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
    // CONFIRM COMPANY HAS A CONNECTED WHATSAPP ACCOUNT
    // ----------------------------------------------------------

    const whatsappAccount = await prisma.whatsAppAccount.findFirst({
      where: {
        companyId: req.user.companyId,
        status: "CONNECTED",
      },
    });

    if (!whatsappAccount) {
      return res.status(400).json({
        success: false,
        message:
          "No connected WhatsApp Business Account found for your company.",
      });
    }

    if (!template.metaTemplateId) {
      return res.status(400).json({
        success: false,
        message:
          "This template has not been submitted to Meta yet, so it has no approved Meta template name to send.",
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
        // GET / CREATE CONVERSATION (scoped to this company)
        // ------------------------------------------------------

        const conversation = await getOrCreateSaaSConversation(
          req.user.companyId,
          whatsappAccount.id,
          customer.phone
        );

        // ------------------------------------------------------
        // SEND META TEMPLATE (using this company's own WABA/token)
        // ------------------------------------------------------
      

        const metaTemplateName = template.name;

        // 👈 FIXED: use the same permissive regex as extractVariables()
        // so this always agrees with what was validated at template
        // creation/approval time.
        const variableCount = (
          template.content.match(/\{\{\s*\d+\s*\}\}/g) || []
        ).length;

        const variables =
          variableCount > 0 ? [customer.name] : [];

        const result = await sendTemplateMessage(
          req.user.companyId,
          customer.phone,
          metaTemplateName,
          template.language,
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
// SUBMIT TEMPLATE FOR APPROVAL  (now actually calls Meta)
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

    if (template.status !== "DRAFT" && template.status !== "REJECTED") {
      return res.status(400).json({
        success: false,
        message: `Template cannot be submitted from ${template.status} status.`,
      });
    }

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!template.name?.trim()) {
      return res.status(400).json({ success: false, message: "Template name is required." });
    }
    if (!template.category) {
      return res.status(400).json({ success: false, message: "Template category is required." });
    }
    if (!template.language) {
      return res.status(400).json({ success: false, message: "Template language is required." });
    }
    if (!template.content?.trim()) {
      return res.status(400).json({ success: false, message: "Template body is required." });
    }

    // ----------------------------------------------------------
    // BODY VARIABLE / EXAMPLE VALIDATION  👈 NEW
    // ----------------------------------------------------------
    // Belt-and-braces: even though createTemplate/updateTemplate
    // already require this, re-check here too, since submit can
    // fire on a REJECTED template that might have been edited by
    // some other path.

    const detectedVariables = extractVariables(template.content);

    if (detectedVariables.length > 0) {
      const examples = Array.isArray(template.bodyExamples)
        ? template.bodyExamples
        : [];

      if (examples.length < detectedVariables.length) {
        return res.status(400).json({
          success: false,
          message: `Sample values are required for all variables: ${detectedVariables
            .map((v) => `{{${v}}}`)
            .join(", ")} before submitting to Meta.`,
        });
      }
    }

    // ----------------------------------------------------------
    // CONFIRM COMPANY HAS A CONNECTED WHATSAPP ACCOUNT
    // ----------------------------------------------------------

    const whatsappAccount = await prisma.whatsAppAccount.findFirst({
      where: {
        companyId: req.user.companyId,
        status: "CONNECTED",
      },
    });

        if (!whatsappAccount || !whatsappAccount.wabaId) {
      return res.status(400).json({
        success: false,
        message:
          "No connected WhatsApp Business Account found for your company. Please connect WhatsApp before submitting templates.",
      });
    }

    if (!process.env.META_SYSTEM_USER_TOKEN) {
      return res.status(500).json({
        success: false,
        message:
          "Server is not configured with a WhatsApp system token. Contact support.",
      });
    }

    // ----------------------------------------------------------
    // 👈 NEW: UPLOAD HEADER SAMPLE MEDIA (IMAGE / VIDEO / DOCUMENT ONLY)
    // ----------------------------------------------------------
    // Meta requires a sample file uploaded through its Resumable Upload
    // API for any non-text header, returning a "handle" that must be
    // included as example.header_handle on the HEADER component.
    // Without this, Meta rejects the submission with:
    // "component of type HEADER is missing expected field(s) (example)".
    // headerContent is expected to be a public URL to the sample file.

    let headerHandle = null;

    if (
      template.headerType &&
      template.headerType !== "NONE" &&
      template.headerType !== "TEXT"
    ) {
      if (!template.headerContent?.trim()) {
        return res.status(400).json({
          success: false,
          message: `A public ${template.headerType.toLowerCase()} URL is required in the header content before submitting for approval.`,
        });
      }

      const mediaUploadResult = await uploadHeaderMediaToMeta(
        template.headerContent
      );

      if (!mediaUploadResult.success) {
        return res.status(400).json({
          success: false,
          message: `Failed to prepare header media for Meta: ${mediaUploadResult.error}`,
        });
      }

      headerHandle = mediaUploadResult.handle;
    }

    // ----------------------------------------------------------
    // CALL META'S GRAPH API (using this company's own WABA + token)
    // ----------------------------------------------------------

    const metaResult = await createMetaTemplate(req.user.companyId, {
      name: template.name,
      category: template.category,
      language: template.language,
      headerType: template.headerType,
      headerContent: template.headerContent,
      headerHandle, // 👈 NEW
      bodyText: template.content,
      bodyExamples: template.bodyExamples, // 👈 NEW
      footerContent: template.footerContent,
    });

    if (!metaResult.success) {
      const metaErrorMessage =
        typeof metaResult.error === "string"
          ? metaResult.error
          : metaResult.error?.message || "Unknown error";

      return res.status(400).json({
        success: false,
        message: `Meta rejected this template: ${metaErrorMessage}`,
      });
    }

    // ----------------------------------------------------------
    // UPDATE LOCAL RECORD WITH META'S RESPONSE
    // ----------------------------------------------------------
    // Meta's create-template response includes: { id, status, category }
    // status here is usually "PENDING" immediately after creation.

    const updatedTemplate = await prisma.template.update({
      where: { id: template.id },
      data: {
        status: "PENDING",
        metaTemplateId: metaResult.data.id,
        rejectionReason: null,
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
        before: { status: template.status },
        after: { status: updatedTemplate.status, metaTemplateId: metaResult.data.id },
      },
    });

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Template submitted to Meta for approval.",
      data: updatedTemplate,
    });
  } catch (error) {
    console.error("Submit Template For Approval Error:", error);

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
 