
// const prisma = require("../config/prisma");

// const {
//   sendTemplateMessage,
//   sendCampaignImageTemplate,
// } = require("../services/whatsappService");

// const { generateCampaign } = require("../services/geminiService");

// const { notifyAdmins } = require("../services/notificationService");

// const {
//   uploadCampaignImage,
// } = require("../services/cloudinaryService");

// const {
//   getOrCreateSaaSConversation,
// } = require("../helpers/saasConversationHelper");

// const { logAction } = require("../services/auditLogService");


// // =====================================================
// // CREATE CAMPAIGN
// // =====================================================

// exports.createCampaign = async (req, res) => {
//   try {
//     let {
//       name,
//       type,
//       templateId,
//       messageContent,
//       scheduledAt,
//       customerIds,
//     } = req.body;

//     const companyId = req.user.companyId;
//     const createdById = req.user.userId;

//     // =====================================================
//     // NORMALIZE CUSTOMER IDS
//     // =====================================================

//     if (!customerIds) {
//       customerIds = [];
//     } else if (!Array.isArray(customerIds)) {
//       customerIds = [customerIds];
//     }

//     customerIds = customerIds
//       .filter(Boolean)
//       .map((id) => String(id));

//     // Remove duplicates
//     customerIds = [...new Set(customerIds)];

//     // =====================================================
//     // BASIC VALIDATION
//     // =====================================================

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Campaign name is required.",
//       });
//     }

//     if (!type) {
//       return res.status(400).json({
//         success: false,
//         message: "Campaign type is required.",
//       });
//     }

//     // =====================================================
//     // TEMPLATE VALIDATION
//     // =====================================================

//     let template = null;

//     if (templateId) {
//       template = await prisma.template.findFirst({
//         where: {
//           id: String(templateId),
//           companyId,
//         },
//       });

//       if (!template) {
//         return res.status(404).json({
//           success: false,
//           message: "Selected template was not found.",
//         });
//       }

//       // Campaigns are business initiated WhatsApp messages.
//       // Only approved templates should be used for sending.
//       if (template.status !== "APPROVED") {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Only approved WhatsApp templates can be used for campaigns.",
//         });
//       }
//     }

//     // =====================================================
//     // CUSTOMER VALIDATION
//     // =====================================================

//     let validCustomerIds = [];

//     if (customerIds.length > 0) {
//       const customers = await prisma.customer.findMany({
//         where: {
//           id: {
//             in: customerIds,
//           },
//           companyId,
//         },
//         select: {
//           id: true,
//         },
//       });

//       validCustomerIds = customers.map((customer) =>
//         String(customer.id)
//       );

//       const invalidCustomerIds = customerIds.filter(
//         (id) => !validCustomerIds.includes(id)
//       );

//       if (invalidCustomerIds.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "One or more selected customers do not belong to your company.",
//           invalidCustomerIds,
//         });
//       }
//     }

//     // =====================================================
//     // UPLOAD CAMPAIGN IMAGE
//     // =====================================================

//     let imageUrl = null;

//     if (req.file) {
//       const uploadResult = await uploadCampaignImage(req.file);

//       imageUrl = uploadResult?.imageUrl || null;
//     }

//     // =====================================================
//     // DETERMINE STATUS
//     // =====================================================

//     let campaignStatus = "DRAFT";

//     if (scheduledAt) {
//       const scheduleDate = new Date(scheduledAt);

//       if (isNaN(scheduleDate.getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid scheduled date.",
//         });
//       }

//       if (scheduleDate <= new Date()) {
//         return res.status(400).json({
//           success: false,
//           message: "Scheduled time must be in the future.",
//         });
//       }

//       campaignStatus = "SCHEDULED";
//     }

//     // =====================================================
//     // CREATE CAMPAIGN
//     // =====================================================

//     const campaign = await prisma.campaign.create({
//       data: {
//         companyId,

//         name: name.trim(),

//         type,

//         templateId: template
//           ? template.id
//           : null,

//         messageContent:
//           messageContent?.trim() || null,

//         status: campaignStatus,

//         scheduledAt: scheduledAt
//           ? new Date(scheduledAt)
//           : null,

//         audienceCount: validCustomerIds.length,

//         totalRecipients: validCustomerIds.length,

//         imageUrl,

//         createdById,

//         recipients: {
//           create: validCustomerIds.map((customerId) => ({
//             customerId,
//           })),
//         },
//       },

//       include: {
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },

//         template: {
//           select: {
//             id: true,
//             name: true,
//             language: true,
//             category: true,
//             messageType: true,
//             content: true,
//             status: true,
//           },
//         },

//         recipients: {
//           include: {
//             customer: true,
//           },
//         },
//       },
//     });

//     // =====================================================
//     // NOTIFICATION
//     // =====================================================

//     notifyAdmins({
//       title: "New Campaign",
//       message: `${campaign.name} has been created.`,
//       type: "CAMPAIGN",
//     }).catch(console.error);

//     // =====================================================
//     // AUDIT LOG
//     // =====================================================

//     logAction({
//       req,
//       action: "CREATE",
//       module: "CAMPAIGN",
//       entityId: campaign.id,
//       entityName: campaign.name,
//     });

//     // =====================================================
//     // RESPONSE
//     // =====================================================

//     return res.status(201).json({
//       success: true,
//       message: scheduledAt
//         ? "Campaign scheduled successfully."
//         : "Campaign created successfully.",
//       data: campaign,
//     });

//   } catch (error) {
//     console.error("Create Campaign Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create campaign.",
//       error: error.message,
//     });
//   }
// };


// // =====================================================
// // GET ALL CAMPAIGNS
// // =====================================================

// exports.getCampaigns = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;

//     const campaigns = await prisma.campaign.findMany({
//       where: {
//         companyId,
//       },

//       include: {
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },

//         template: {
//           select: {
//             id: true,
//             name: true,
//             language: true,
//             category: true,
//             messageType: true,
//             content: true,
//             status: true,
//           },
//         },

//         // Don't load every customer for the campaign list.
//         // SaaS CRM campaign tables should use statistics instead.
//         _count: {
//           select: {
//             recipients: true,
//           },
//         },
//       },

//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       count: campaigns.length,
//       data: campaigns,
//     });

//   } catch (error) {
//     console.error("Get Campaigns Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch campaigns.",
//       error: error.message,
//     });
//   }
// };


// // =====================================================
// // GET CAMPAIGN BY ID
// // =====================================================

// exports.getCampaignById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const companyId = req.user.companyId;

//     const campaign = await prisma.campaign.findFirst({
//       where: {
//         id,
//         companyId,
//       },

//       include: {
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },

//         template: {
//           select: {
//             id: true,
//             name: true,
//             language: true,
//             category: true,
//             messageType: true,
//             content: true,
//             status: true,
//           },
//         },

//         recipients: {
//           include: {
//             customer: true,
//           },
//           orderBy: {
//             createdAt: "desc",
//           },
//         },
//       },
//     });

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: "Campaign not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: campaign,
//     });

//   } catch (error) {
//     console.error("Get Campaign Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch campaign.",
//       error: error.message,
//     });
//   }
// };


// // =====================================================
// // UPDATE CAMPAIGN
// // =====================================================

// exports.updateCampaign = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const companyId = req.user.companyId;

//     const {
//       name,
//       type,
//       templateId,
//       messageContent,
//       status,
//       scheduledAt,
//     } = req.body;

//     // =====================================================
//     // FIND CAMPAIGN
//     // =====================================================

//     const existingCampaign =
//       await prisma.campaign.findFirst({
//         where: {
//           id,
//           companyId,
//         },
//       });

//     if (!existingCampaign) {
//       return res.status(404).json({
//         success: false,
//         message: "Campaign not found.",
//       });
//     }

//     // =====================================================
//     // DON'T MODIFY COMPLETED CAMPAIGNS
//     // =====================================================

//     if (
//       existingCampaign.status === "COMPLETED" ||
//       existingCampaign.status === "SENDING"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Completed or currently sending campaigns cannot be edited.",
//       });
//     }

//     // =====================================================
//     // TEMPLATE VALIDATION
//     // =====================================================

//     let validatedTemplateId =
//       existingCampaign.templateId;

//     if (templateId !== undefined) {
//       if (!templateId) {
//         validatedTemplateId = null;
//       } else {
//         const template =
//           await prisma.template.findFirst({
//             where: {
//               id: String(templateId),
//               companyId,
//             },
//           });

//         if (!template) {
//           return res.status(404).json({
//             success: false,
//             message: "Selected template was not found.",
//           });
//         }

//         if (template.status !== "APPROVED") {
//           return res.status(400).json({
//             success: false,
//             message:
//               "Only approved templates can be used for campaigns.",
//           });
//         }

//         validatedTemplateId = template.id;
//       }
//     }

//     // =====================================================
//     // IMAGE
//     // =====================================================

//     let imageUrl = existingCampaign.imageUrl;

//     if (req.file) {
//       const uploadResult =
//         await uploadCampaignImage(req.file);

//       imageUrl =
//         uploadResult?.imageUrl ||
//         existingCampaign.imageUrl;
//     }

//     // =====================================================
//     // SCHEDULE
//     // =====================================================

//     let finalScheduledAt =
//       existingCampaign.scheduledAt;

//     let finalStatus =
//       status || existingCampaign.status;

//     if (scheduledAt !== undefined) {
//       if (scheduledAt) {
//         const scheduleDate =
//           new Date(scheduledAt);

//         if (isNaN(scheduleDate.getTime())) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid scheduled date.",
//           });
//         }

//         if (scheduleDate <= new Date()) {
//           return res.status(400).json({
//             success: false,
//             message:
//               "Scheduled time must be in the future.",
//           });
//         }

//         finalScheduledAt = scheduleDate;
//         finalStatus = "SCHEDULED";
//       } else {
//         finalScheduledAt = null;

//         if (finalStatus === "SCHEDULED") {
//           finalStatus = "DRAFT";
//         }
//       }
//     }

//     // =====================================================
//     // UPDATE
//     // =====================================================

//     const campaign =
//       await prisma.campaign.update({
//         where: {
//           id,
//         },

//         data: {
//           ...(name !== undefined && {
//             name: name.trim(),
//           }),

//           ...(type !== undefined && {
//             type,
//           }),

//           templateId: validatedTemplateId,

//           ...(messageContent !== undefined && {
//             messageContent:
//               messageContent?.trim() || null,
//           }),

//           status: finalStatus,

//           scheduledAt:
//             finalScheduledAt,

//           imageUrl,
//         },

//         include: {
//           createdBy: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },

//           template: {
//             select: {
//               id: true,
//               name: true,
//               language: true,
//               category: true,
//               messageType: true,
//               content: true,
//               status: true,
//             },
//           },

//           _count: {
//             select: {
//               recipients: true,
//             },
//           },
//         },
//       });

//     // =====================================================
//     // AUDIT
//     // =====================================================

//     logAction({
//       req,
//       action: "UPDATE",
//       module: "CAMPAIGN",
//       entityId: campaign.id,
//       entityName: campaign.name,

//       changes: {
//         before: {
//           status: existingCampaign.status,
//           templateId:
//             existingCampaign.templateId,
//           scheduledAt:
//             existingCampaign.scheduledAt,
//         },

//         after: {
//           status: campaign.status,
//           templateId:
//             campaign.templateId,
//           scheduledAt:
//             campaign.scheduledAt,
//         },
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Campaign updated successfully.",
//       data: campaign,
//     });

//   } catch (error) {
//     console.error("Update Campaign Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update campaign.",
//       error: error.message,
//     });
//   }
// };


// // =====================================================
// // DELETE CAMPAIGN
// // =====================================================

// exports.deleteCampaign = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const companyId = req.user.companyId;

//     const campaign =
//       await prisma.campaign.findFirst({
//         where: {
//           id,
//           companyId,
//         },
//       });

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: "Campaign not found.",
//       });
//     }

//     // Don't delete campaigns that are currently sending
//     if (campaign.status === "SENDING") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "A campaign that is currently sending cannot be deleted.",
//       });
//     }

//     await prisma.campaign.delete({
//       where: {
//         id,
//       },
//     });

//     logAction({
//       req,
//       action: "DELETE",
//       module: "CAMPAIGN",
//       entityId: campaign.id,
//       entityName: campaign.name,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Campaign deleted successfully.",
//     });

//   } catch (error) {
//     console.error("Delete Campaign Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete campaign.",
//       error: error.message,
//     });
//   }
// };


// // =====================================================
// // GENERATE AI CAMPAIGN
// // =====================================================

// exports.generateAICampaign = async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     if (!prompt || prompt.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Prompt is required.",
//       });
//     }

//     const campaign =
//       await generateCampaign(prompt);

//     return res.status(200).json({
//       success: true,
//       message:
//         "AI campaign generated successfully.",
//       data: campaign,
//     });

//   } catch (error) {
//     console.error(
//       "Generate AI Campaign Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to generate campaign.",
//       error: error.message,
//     });
//   }
// };


// // =====================================================
// // SEND CAMPAIGN
// // =====================================================

// exports.sendCampaign = async (req, res) => {
//   try {
//     console.log(
//       "========== SEND CAMPAIGN =========="
//     );

//     const { campaignId } = req.body;

//     const companyId = req.user.companyId;

//     // 👈 NEW: fetch this company's own WhatsApp account ONCE,
//     // before the loop, so every recipient sends through the
//     // right phoneNumberId.
//     const whatsappAccount = await prisma.whatsAppAccount.findFirst({
//       where: {
//         companyId,
//         status: "CONNECTED",
//       },
//     });

//     if (!whatsappAccount) {
//       return res.status(400).json({
//         success: false,
//         message: "No connected WhatsApp account found for this company.",
//       });
//     }

//     // =====================================================
//     // VALIDATION
//     // =====================================================

//     if (!campaignId) {
//       return res.status(400).json({
//         success: false,
//         message: "Campaign ID is required.",
//       });
//     }

//     // =====================================================
//     // GET CAMPAIGN
//     // =====================================================

//     const campaign =
//       await prisma.campaign.findFirst({
//         where: {
//           id: String(campaignId),
//           companyId,
//         },

//         include: {
//           template: true,

//           recipients: {
//             include: {
//               customer: true,
//             },
//           },
//         },
//       });

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: "Campaign not found.",
//       });
//     }

//     // =====================================================
//     // VALIDATE TEMPLATE
//     // =====================================================

//     if (!campaign.templateId) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "This campaign does not have a WhatsApp template selected.",
//       });
//     }

//     if (!campaign.template) {
//       return res.status(400).json({
//         success: false,
//         message: "Campaign template not found.",
//       });
//     }

//     if (campaign.template.status !== "APPROVED") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "The selected WhatsApp template is not approved.",
//       });
//     }

//     // =====================================================
//     // VALIDATE STATUS
//     // =====================================================

//     if (
//       campaign.status === "COMPLETED"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "This campaign has already been completed.",
//       });
//     }

//     if (
//       campaign.status === "SENDING"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "This campaign is already being sent.",
//       });
//     }

//     // =====================================================
//     // CHECK RECIPIENTS
//     // =====================================================

//     if (
//       !campaign.recipients ||
//       campaign.recipients.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please select at least one customer.",
//       });
//     }

//     // =====================================================
//     // MARK CAMPAIGN AS SENDING
//     // =====================================================

//     await prisma.campaign.update({
//       where: {
//         id: campaign.id,
//       },

//       data: {
//         status: "SENDING",
//         startedAt: new Date(),
//         totalRecipients:
//           campaign.recipients.length,
//         audienceCount:
//           campaign.recipients.length,
//         sentCount: 0,
//         deliveredCount: 0,
//         readCount: 0,
//         failedCount: 0,
//       },
//     });

//     // =====================================================
//     // SEND TO RECIPIENTS
//     // =====================================================

//     let sentCount = 0;
//     let failedCount = 0;

//     for (const recipient of campaign.recipients) {
//       const customer = recipient.customer;

//       if (!customer) {
//         failedCount++;

//         await prisma.campaignRecipient.update({
//           where: {
//             id: recipient.id,
//           },

//           data: {
//             status: "FAILED",
//           },
//         });

//         continue;
//       }

//       if (!customer.phone) {
//         failedCount++;

//         await prisma.campaignRecipient.update({
//           where: {
//             id: recipient.id,
//           },

//           data: {
//             status: "FAILED",
//           },
//         });

//         continue;
//       }

//       try {
//         // =====================================================
//         // CONVERSATION
//         // =====================================================

//         let conversation =
//           await getOrCreateSaaSConversation(
//             companyId,
//             whatsappAccount.id,
//             customer.phone
//           );

//         // =====================================================
//         // SEND TEMPLATE
//         // =====================================================

//              let result;

//         // 👈 NEW: build the params array to match the template's
//         // ACTUAL number of {{n}} variables instead of always
//         // sending 2. Meta rejects the send outright if the count
//         // doesn't match exactly.
//         const variableCount = (
//           campaign.template.content.match(/\{\{\d+\}\}/g) || []
//         ).length;

//         const allPossibleParams = [
//           customer.name,
//           campaign.messageContent || "",
//         ];

//         const templateParams = allPossibleParams.slice(
//           0,
//           variableCount
//         );

//         if (campaign.imageUrl) {
//           result =
//             await sendCampaignImageTemplate(
//               customer.phone,

//               campaign.template.name,

//               campaign.imageUrl,

//               templateParams, // 👈 CHANGED

//               campaign.template.language ||
//               "en_US",

//               whatsappAccount
//             );
//         } else {
//           result =
//             await sendTemplateMessage(
//               customer.phone,

//               campaign.template.name,

//               templateParams, // 👈 CHANGED

//               whatsappAccount
//             );
//         }

//         console.log(
//           "WhatsApp Result:",
//           result
//         );

//         // =====================================================
//         // SUCCESS
//         // =====================================================

//         if (result?.success) {
//           const metaMessageId =
//             result.data?.messages?.[0]?.id ||
//             null;

//           sentCount++;

//           await prisma.campaignRecipient.update({
//             where: {
//               id: recipient.id,
//             },

//             data: {
//               status: "SENT",
//               sentAt: new Date(),
//             },
//           });

//           // =====================================================
//           // SAVE MESSAGE
//           // =====================================================

//           await prisma.message.create({
//             data: {
//               conversationId:
//                 conversation.id,

//               sender: "AGENT",

//               content:
//                 campaign.messageContent ||
//                 campaign.template.content,

//               imageUrl:
//                 campaign.imageUrl,

//               messageType:
//                 campaign.imageUrl
//                   ? "IMAGE"
//                   : "TEXT",

//               status: "SENT",

//               metaMessageId,
//             },
//           });

//           // =====================================================
//           // UPDATE CONVERSATION
//           // =====================================================

//           await prisma.conversation.update({
//             where: {
//               id: conversation.id,
//             },

//             data: {
//               lastMessage:
//                 campaign.messageContent ||
//                 campaign.template.content,
//             },
//           });

//         } else {
//           failedCount++;

//           await prisma.campaignRecipient.update({
//             where: {
//               id: recipient.id,
//             },

//             data: {
//               status: "FAILED",
//             },
//           });
//         }

//       } catch (error) {
//         console.error(
//           `Campaign send failed for ${customer.phone}:`,
//           error
//         );

//         failedCount++;

//         await prisma.campaignRecipient.update({
//           where: {
//             id: recipient.id,
//           },

//           data: {
//             status: "FAILED",
//           },
//         });
//       }
//     }

//     // =====================================================
//     // FINAL CAMPAIGN STATUS
//     // =====================================================

//     let finalStatus = "COMPLETED";

//     if (
//       sentCount === 0 &&
//       failedCount > 0
//     ) {
//       finalStatus = "FAILED";
//     }

//     const completedCampaign =
//       await prisma.campaign.update({
//         where: {
//           id: campaign.id,
//         },

//         data: {
//           status: finalStatus,

//           completedAt:
//             new Date(),

//           sentCount,

//           failedCount,

//           totalRecipients:
//             campaign.recipients.length,

//           audienceCount:
//             campaign.recipients.length,
//         },
//       });

//     // =====================================================
//     // AUDIT
//     // =====================================================

//     logAction({
//       req,
//       action: "UPDATE",
//       module: "CAMPAIGN",
//       entityId: campaign.id,
//       entityName: campaign.name,

//       changes: {
//         after: {
//           status: finalStatus,
//           totalRecipients:
//             campaign.recipients.length,
//           sentCount,
//           failedCount,
//         },
//       },
//     });

//     // =====================================================
//     // RESPONSE
//     // =====================================================

//     return res.status(200).json({
//       success: true,

//       message:
//         finalStatus === "COMPLETED"
//           ? "Campaign sent successfully."
//           : "Campaign sending failed.",

//       data: {
//         campaignId:
//           completedCampaign.id,

//         status:
//           completedCampaign.status,

//         totalRecipients:
//           campaign.recipients.length,

//         sentCount,

//         failedCount,
//       },
//     });

//   } catch (error) {
//     console.error(
//       "Send Campaign Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to send campaign.",
//       error: error.message,
//     });
//   }
// };


// // =====================================================
// // GET CAMPAIGN RECIPIENTS
// // =====================================================

// exports.getCampaignRecipients = async (
//   req,
//   res
// ) => {
//   try {
//     const { id } = req.params;

//     const companyId =
//       req.user.companyId;

//     // =====================================================
//     // MAKE SURE CAMPAIGN BELONGS TO COMPANY
//     // =====================================================

//     const campaign =
//       await prisma.campaign.findFirst({
//         where: {
//           id,
//           companyId,
//         },

//         select: {
//           id: true,
//         },
//       });

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Campaign not found.",
//       });
//     }

//     // =====================================================
//     // GET RECIPIENTS
//     // =====================================================

//     const recipients =
//       await prisma.campaignRecipient.findMany({
//         where: {
//           campaignId: id,
//         },

//         include: {
//           customer: true,
//         },

//         orderBy: {
//           createdAt: "desc",
//         },
//       });

//     return res.status(200).json({
//       success: true,
//       count: recipients.length,
//       data: recipients,
//     });

//   } catch (error) {
//     console.error(
//       "Get Campaign Recipients Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to fetch campaign recipients.",
//       error: error.message,
//     });
//   }
// };


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
  getOrCreateSaaSConversation,
} = require("../helpers/saasConversationHelper");

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
    // TEMPLATE <-> IMAGE CONSISTENCY CHECK
    // =====================================================
    // 👈 NEW: the template module and the campaign module were out of
    // sync — this modal let you attach an image to ANY template, even
    // one that was never approved with an IMAGE header on Meta (and vice
    // versa). Sending that mismatch is what made image campaigns fail
    // outright. Catch it here, at creation time, with a clear message.

    if (template) {
      if (req.file && template.headerType !== "IMAGE") {
        return res.status(400).json({
          success: false,
          message:
            "This template does not have an approved IMAGE header, so it can't be sent with a campaign image. Choose a template that was approved with an IMAGE header, or remove the image.",
        });
      }

      if (!req.file && template.headerType === "IMAGE") {
        return res.status(400).json({
          success: false,
          message:
            "This template requires an IMAGE header. Please upload a campaign image before saving.",
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
                        headerType: true,
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
                        headerType: true,
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
                        headerType: true,
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
    // TEMPLATE <-> IMAGE CONSISTENCY CHECK
    // =====================================================
    // 👈 NEW: same check as createCampaign — keep the template's approved
    // header format and the campaign's image in sync so a send can't go
    // out with a mismatched header component.

    if (validatedTemplateId) {
      const effectiveTemplate = await prisma.template.findFirst({
        where: { id: validatedTemplateId, companyId },
        select: { headerType: true },
      });

      if (effectiveTemplate) {
        if (imageUrl && effectiveTemplate.headerType !== "IMAGE") {
          return res.status(400).json({
            success: false,
            message:
              "This template does not have an approved IMAGE header, so it can't be sent with a campaign image. Choose a template that was approved with an IMAGE header, or remove the image.",
          });
        }

        if (!imageUrl && effectiveTemplate.headerType === "IMAGE") {
          return res.status(400).json({
            success: false,
            message:
              "This template requires an IMAGE header. Please upload a campaign image before saving.",
          });
        }
      }
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
                          headerType: true,
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

    // 👈 NEW: fetch this company's own WhatsApp account ONCE,
    // before the loop, so every recipient sends through the
    // right phoneNumberId.
    const whatsappAccount = await prisma.whatsAppAccount.findFirst({
      where: {
        companyId,
        status: "CONNECTED",
      },
    });

    if (!whatsappAccount) {
      return res.status(400).json({
        success: false,
        message: "No connected WhatsApp account found for this company.",
      });
    }

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
          await getOrCreateSaaSConversation(
            companyId,
            whatsappAccount.id,
            customer.phone
          );

        // =====================================================
        // SEND TEMPLATE
        // =====================================================

             let result;

        // 👈 NEW: build the params array to match the template's
        // ACTUAL number of {{n}} variables instead of always
        // sending 2. Meta rejects the send outright if the count
        // doesn't match exactly.
        // 👈 FIXED: this regex now allows optional whitespace inside the
        // braces ("{{ 1 }}"), matching templateController.js's
        // extractVariables(). Previously this regex was stricter than the
        // one used in the campaign builder UI, so a template body with
        // spaced-out braces was counted as having 0 variables here even
        // though the UI showed the variable correctly mapped — the send
        // then went out with an empty parameters array, which is why the
        // customer could receive the raw "{{1}}" placeholder instead of
        // their name.
        const variableCount = (
          campaign.template.content.match(/\{\{\s*\d+\s*\}\}/g) || []
        ).length;

        const allPossibleParams = [
          customer.name,
          campaign.messageContent || "",
        ];

        const templateParams = allPossibleParams.slice(
          0,
          variableCount
        );

        // 👈 NEW: never send a template call with a blank/whitespace-only
        // parameter — Meta either rejects it or (worse) delivers the
        // message with the placeholder left unresolved for the customer
        // to see. Fail this recipient clearly instead, so it shows up as
        // FAILED with a real reason rather than a silently broken send.
        const hasEmptyParam = templateParams
          .slice(0, variableCount)
          .some((p) => !p || !String(p).trim());

        if (
          templateParams.length < variableCount ||
          hasEmptyParam
        ) {
          failedCount++;

          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              failureReason: `Template requires ${variableCount} variable(s) but only ${templateParams.filter(
                (p) => p && String(p).trim()
              ).length} usable value(s) were available (check customer.name and campaign message).`,
            },
          });

          continue;
        }

        // 👈 NEW: a template can only carry an IMAGE header component if
        // it was actually approved with an IMAGE header on Meta. Before
        // this, the campaign module attached an image header to ANY
        // template that happened to have a campaign image uploaded,
        // regardless of the template's real headerType — Meta then
        // rejects the whole send because the template has no header
        // component to fill. This is the "template module and campaign
        // module are not in sync" issue.
        if (campaign.imageUrl && campaign.template.headerType !== "IMAGE") {
          failedCount++;

          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              failureReason:
                "Campaign has an image attached, but the selected template was not approved with an IMAGE header. Select a template with an IMAGE header, or remove the campaign image.",
            },
          });

          continue;
        }

        if (
          !campaign.imageUrl &&
          campaign.template.headerType === "IMAGE"
        ) {
          failedCount++;

          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              failureReason:
                "The selected template requires an IMAGE header, but no campaign image was uploaded.",
            },
          });

          continue;
        }

        if (campaign.imageUrl) {
          result =
            await sendCampaignImageTemplate(
              customer.phone,

              campaign.template.name,

              campaign.imageUrl,

              templateParams, // 👈 CHANGED

              campaign.template.language ||
              "en_US",

              whatsappAccount
            );
        } else {
          result =
            await sendTemplateMessage(
              customer.phone,

              campaign.template.name,

              templateParams, // 👈 CHANGED

              whatsappAccount
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

          // 👈 NEW: persist Meta's actual error instead of just "FAILED"
          // with no detail. The schema already has failureReason — it was
          // just never being written to, which is why failed sends (like
          // the image campaigns) gave no clue as to why.
          const metaError = result?.error;
          const failureReason =
            (typeof metaError === "string" && metaError) ||
            metaError?.error?.error_user_msg ||
            metaError?.error?.message ||
            metaError?.message ||
            (metaError ? JSON.stringify(metaError) : "Unknown send failure");

          console.error(
            `Campaign send failed for ${customer.phone}:`,
            metaError
          );

          await prisma.campaignRecipient.update({
            where: {
              id: recipient.id,
            },

            data: {
              status: "FAILED",
              failureReason: String(failureReason).slice(0, 500),
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
            failureReason: String(error.message || error).slice(0, 500),
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