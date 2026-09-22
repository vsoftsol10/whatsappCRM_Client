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
// // 👈 NEW: build the text that was ACTUALLY sent, for local display
// // =====================================================
// // templateParams is the same array already sent to Meta
// // ([customer.name, campaign.messageContent].slice(0, variableCount)).
// // This replaces {{1}}, {{2}}, etc. in the raw template body with
// // those same values, so the CRM conversation shows exactly what the
// // recipient received — instead of the raw unfilled template text,
// // and instead of campaign.messageContent alone (which is only ever
// // a value for {{2}}, not the whole message).
// const buildSentMessageContent = (templateContent, templateParams) => {
//   let result = templateContent || "";

//   templateParams.forEach((value, index) => {
//     const variableNumber = index + 1;
//     const pattern = new RegExp(`\\{\\{\\s*${variableNumber}\\s*\\}\\}`, "g");
//     result = result.replace(pattern, value || "");
//   });

//   return result;
// };

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

//               // 👈 CHANGED: show the template body with {{1}}, {{2}}
//               // etc. actually filled in with templateParams — the
//               // same values just sent to Meta — instead of the raw
//               // messageContent field (which only ever supplies {{2}}
//               // when present, not the whole message).
//               content: buildSentMessageContent(
//                 campaign.template.content,
//                 templateParams
//               ),

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
//               // 👈 CHANGED: same fix as the message content above.
//               lastMessage: buildSentMessageContent(
//                 campaign.template.content,
//                 templateParams
//               ),
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
// build the text that was ACTUALLY sent, for local display
// =====================================================
// templateParams is the same array already sent to Meta
// ([customer.name, campaign.messageContent].slice(0, variableCount)).
// This replaces {{1}}, {{2}}, etc. in the raw template body with
// those same values, so the CRM conversation shows exactly what the
// recipient received — instead of the raw unfilled template text,
// and instead of campaign.messageContent alone (which is only ever
// a value for {{2}}, not the whole message).
const buildSentMessageContent = (templateContent, templateParams) => {
  let result = templateContent || "";

  templateParams.forEach((value, index) => {
    const variableNumber = index + 1;
    const pattern = new RegExp(`\\{\\{\\s*${variableNumber}\\s*\\}\\}`, "g");
    result = result.replace(pattern, value || "");
  });

  return result;
};

// =====================================================
// CORE SEND LOOP (shared by sendCampaign & resendCampaign)
// =====================================================
// Sends the template to exactly the recipients passed in
// (`recipientsToSend`), and returns how many succeeded/failed.
// Does NOT touch campaign.status or counts — the caller decides
// how to persist that, since a full send vs. a partial/targeted
// send need different bookkeeping (reset vs. increment).
const sendToRecipients = async (
  campaign,
  recipientsToSend,
  whatsappAccount,
  companyId
) => {
  let sentCount = 0;
  let failedCount = 0;

  const variableCount = (
    campaign.template.content.match(/\{\{\d+\}\}/g) || []
  ).length;

  for (const recipient of recipientsToSend) {
    const customer = recipient.customer;

    if (!customer || !customer.phone) {
      failedCount++;

      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status: "FAILED" },
      });

      continue;
    }

    try {
      // =====================================================
      // CONVERSATION
      // =====================================================

      let conversation = await getOrCreateSaaSConversation(
        companyId,
        whatsappAccount.id,
        customer.phone
      );

      // =====================================================
      // SEND TEMPLATE
      // =====================================================

      let result;

      const allPossibleParams = [
        customer.name,
        campaign.messageContent || "",
      ];

      const templateParams = allPossibleParams.slice(0, variableCount);

      if (campaign.imageUrl) {
        result = await sendCampaignImageTemplate(
          customer.phone,
          campaign.template.name,
          campaign.imageUrl,
          templateParams,
          campaign.template.language || "en_US",
          whatsappAccount
        );
      } else {
        result = await sendTemplateMessage(
          customer.phone,
          campaign.template.name,
          templateParams,
          whatsappAccount
        );
      }

      console.log("WhatsApp Result:", result);

      // =====================================================
      // SUCCESS
      // =====================================================

      if (result?.success) {
        const metaMessageId = result.data?.messages?.[0]?.id || null;

        sentCount++;

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        });

        // Show the template body with {{1}}, {{2}} etc. actually
        // filled in with templateParams — the same values just sent
        // to Meta — instead of the raw messageContent field.
        const sentContent = buildSentMessageContent(
          campaign.template.content,
          templateParams
        );

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            sender: "AGENT",
            content: sentContent,
            imageUrl: campaign.imageUrl,
            messageType: campaign.imageUrl ? "IMAGE" : "TEXT",
            status: "SENT",
            metaMessageId,
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessage: sentContent },
        });
      } else {
        failedCount++;

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "FAILED" },
        });
      }
    } catch (error) {
      console.error(`Campaign send failed for ${customer.phone}:`, error);

      failedCount++;

      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status: "FAILED" },
      });
    }
  }

  return { sentCount, failedCount };
};

// =====================================================
// CREATE CAMPAIGN
// =====================================================

exports.createCampaign = async (req, res) => {
  try {
    let { name, type, templateId, messageContent, scheduledAt, customerIds } =
      req.body;

    const companyId = req.user.companyId;
    const createdById = req.user.userId;

    if (!customerIds) {
      customerIds = [];
    } else if (!Array.isArray(customerIds)) {
      customerIds = [customerIds];
    }

    customerIds = customerIds.filter(Boolean).map((id) => String(id));
    customerIds = [...new Set(customerIds)];

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

    let template = null;

    if (templateId) {
      template = await prisma.template.findFirst({
        where: { id: String(templateId), companyId },
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
          message: "Only approved WhatsApp templates can be used for campaigns.",
        });
      }
    }

    let validCustomerIds = [];

    if (customerIds.length > 0) {
      const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds }, companyId },
        select: { id: true },
      });

      validCustomerIds = customers.map((customer) => String(customer.id));

      const invalidCustomerIds = customerIds.filter(
        (id) => !validCustomerIds.includes(id)
      );

      if (invalidCustomerIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: "One or more selected customers do not belong to your company.",
          invalidCustomerIds,
        });
      }
    }

    let imageUrl = null;

    if (req.file) {
      const uploadResult = await uploadCampaignImage(req.file);
      imageUrl = uploadResult?.imageUrl || null;
    }

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

    const campaign = await prisma.campaign.create({
      data: {
        companyId,
        name: name.trim(),
        type,
        templateId: template ? template.id : null,
        messageContent: messageContent?.trim() || null,
        status: campaignStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        audienceCount: validCustomerIds.length,
        totalRecipients: validCustomerIds.length,
        imageUrl,
        createdById,
        recipients: {
          create: validCustomerIds.map((customerId) => ({ customerId })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
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
        recipients: { include: { customer: true } },
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
      where: { companyId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
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
        _count: { select: { recipients: true } },
      },
      orderBy: { createdAt: "desc" },
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
      where: { id, companyId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
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
          include: { customer: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    return res.status(200).json({ success: true, data: campaign });
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

    const { name, type, templateId, messageContent, status, scheduledAt } =
      req.body;

    const existingCampaign = await prisma.campaign.findFirst({
      where: { id, companyId },
    });

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    if (
      existingCampaign.status === "COMPLETED" ||
      existingCampaign.status === "SENDING"
    ) {
      return res.status(400).json({
        success: false,
        message: "Completed or currently sending campaigns cannot be edited.",
      });
    }

    let validatedTemplateId = existingCampaign.templateId;

    if (templateId !== undefined) {
      if (!templateId) {
        validatedTemplateId = null;
      } else {
        const template = await prisma.template.findFirst({
          where: { id: String(templateId), companyId },
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
            message: "Only approved templates can be used for campaigns.",
          });
        }

        validatedTemplateId = template.id;
      }
    }

    let imageUrl = existingCampaign.imageUrl;

    if (req.file) {
      const uploadResult = await uploadCampaignImage(req.file);
      imageUrl = uploadResult?.imageUrl || existingCampaign.imageUrl;
    }

    let finalScheduledAt = existingCampaign.scheduledAt;
    let finalStatus = status || existingCampaign.status;

    if (scheduledAt !== undefined) {
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

        finalScheduledAt = scheduleDate;
        finalStatus = "SCHEDULED";
      } else {
        finalScheduledAt = null;

        if (finalStatus === "SCHEDULED") {
          finalStatus = "DRAFT";
        }
      }
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(type !== undefined && { type }),
        templateId: validatedTemplateId,
        ...(messageContent !== undefined && {
          messageContent: messageContent?.trim() || null,
        }),
        status: finalStatus,
        scheduledAt: finalScheduledAt,
        imageUrl,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
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
        _count: { select: { recipients: true } },
      },
    });

    logAction({
      req,
      action: "UPDATE",
      module: "CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,
      changes: {
        before: {
          status: existingCampaign.status,
          templateId: existingCampaign.templateId,
          scheduledAt: existingCampaign.scheduledAt,
        },
        after: {
          status: campaign.status,
          templateId: campaign.templateId,
          scheduledAt: campaign.scheduledAt,
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

    const campaign = await prisma.campaign.findFirst({
      where: { id, companyId },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    if (campaign.status === "SENDING") {
      return res.status(400).json({
        success: false,
        message: "A campaign that is currently sending cannot be deleted.",
      });
    }

    await prisma.campaign.delete({ where: { id } });

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
      message: "Failed to generate campaign.",
      error: error.message,
    });
  }
};

// =====================================================
// SEND CAMPAIGN  (unrestricted — any campaign, any time,
// optionally targeted at specific recipients)
// =====================================================
//
// Body:
//   campaignId   (required)
//   recipientIds (optional array of customerIds) — if provided,
//                only those recipients on this campaign are sent
//                to this run. If omitted, every recipient attached
//                to the campaign is sent to.
//
// There is NO status check here anymore. DRAFT, SCHEDULED,
// COMPLETED, FAILED, or even mid-SENDING — this will always run.
// That also means nothing stops you from firing two sends for the
// same campaign back-to-back; if that ever becomes a problem later,
// a lightweight lock can be added, but per your request nothing is
// blocked today.
//

exports.sendCampaign = async (req, res) => {
  try {
    console.log("========== SEND CAMPAIGN ==========");

    const { campaignId } = req.body;
    const recipientIds = req.body.recipientIds || req.body.customerIds || null;

    const companyId = req.user.companyId;

    const whatsappAccount = await prisma.whatsAppAccount.findFirst({
      where: { companyId, status: "CONNECTED" },
    });

    if (!whatsappAccount) {
      return res.status(400).json({
        success: false,
        message: "No connected WhatsApp account found for this company.",
      });
    }

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required.",
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: String(campaignId), companyId },
      include: {
        template: true,
        recipients: { include: { customer: true } },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    if (!campaign.templateId) {
      return res.status(400).json({
        success: false,
        message: "This campaign does not have a WhatsApp template selected.",
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
        message: "The selected WhatsApp template is not approved.",
      });
    }

    if (!campaign.recipients || campaign.recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one customer.",
      });
    }

    // =====================================================
    // TARGET RECIPIENTS
    // =====================================================
    // No filter => everyone already on the campaign (a "full" send).
    // Filter given => only those customerIds (a "targeted" send).
    //
    // Important: a targeted customerId does NOT have to already be a
    // campaign recipient. If it isn't yet, we attach it now — this is
    // what lets SendCampaignModal pick from ALL customers, not just
    // ones originally added when the campaign was created.

    const isTargeted = Array.isArray(recipientIds) && recipientIds.length > 0;

    let targetRecipients;

    if (isTargeted) {
      const requestedIds = [...new Set(recipientIds.map(String))];

      const existingRecipients = campaign.recipients.filter((r) =>
        requestedIds.includes(String(r.customerId))
      );

      const existingCustomerIds = existingRecipients.map((r) =>
        String(r.customerId)
      );

      const newCustomerIds = requestedIds.filter(
        (id) => !existingCustomerIds.includes(id)
      );

      let newlyAttachedRecipients = [];

      if (newCustomerIds.length > 0) {
        // Make sure these customers actually belong to this company
        // before attaching them to the campaign.
        const validCustomers = await prisma.customer.findMany({
          where: { id: { in: newCustomerIds }, companyId },
        });

        if (validCustomers.length > 0) {
          await prisma.campaignRecipient.createMany({
            data: validCustomers.map((customer) => ({
              campaignId: campaign.id,
              customerId: customer.id,
            })),
            skipDuplicates: true,
          });

          newlyAttachedRecipients = await prisma.campaignRecipient.findMany({
            where: {
              campaignId: campaign.id,
              customerId: { in: validCustomers.map((c) => c.id) },
            },
            include: { customer: true },
          });
        }
      }

      targetRecipients = [...existingRecipients, ...newlyAttachedRecipients];
    } else {
      targetRecipients = campaign.recipients;
    }

    if (targetRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "None of the given recipients could be found for your company.",
      });
    }

    // =====================================================
    // MARK CAMPAIGN AS SENDING
    // =====================================================
    // Full send: reset counters, this run's numbers are the whole story.
    // Targeted send: leave existing counters alone, we'll increment after.

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: isTargeted
        ? { status: "SENDING" }
        : {
            status: "SENDING",
            startedAt: new Date(),
            totalRecipients: campaign.recipients.length,
            audienceCount: campaign.recipients.length,
            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            failedCount: 0,
          },
    });

    // =====================================================
    // SEND
    // =====================================================

    const { sentCount, failedCount } = await sendToRecipients(
      campaign,
      targetRecipients,
      whatsappAccount,
      companyId
    );

    // =====================================================
    // FINAL CAMPAIGN STATUS / COUNTS
    // =====================================================

    // In case new customers were attached to the campaign above,
    // recount from the DB so totals stay accurate either way.
    const currentRecipientCount = await prisma.campaignRecipient.count({
      where: { campaignId: campaign.id },
    });

    const completedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: isTargeted
        ? {
            // targeted: add this run's results on top of whatever was there
            sentCount: { increment: sentCount },
            failedCount: { increment: failedCount },
            totalRecipients: currentRecipientCount,
            audienceCount: currentRecipientCount,
            status: "COMPLETED",
            completedAt: new Date(),
          }
        : {
            // full send: this run's numbers are the whole campaign's numbers
            status: sentCount === 0 && failedCount > 0 ? "FAILED" : "COMPLETED",
            completedAt: new Date(),
            sentCount,
            failedCount,
            totalRecipients: campaign.recipients.length,
            audienceCount: campaign.recipients.length,
          },
    });

    logAction({
      req,
      action: "UPDATE",
      module: "CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,
      changes: {
        after: {
          status: completedCampaign.status,
          targeted: isTargeted,
          recipientsThisRun: targetRecipients.length,
          sentCount,
          failedCount,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message:
        failedCount > 0 && sentCount === 0
          ? "Campaign sending failed."
          : "Campaign sent successfully.",
      data: {
        campaignId: completedCampaign.id,
        status: completedCampaign.status,
        recipientsThisRun: targetRecipients.length,
        sentCount,
        failedCount,
      },
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
// RESEND CAMPAIGN
// =====================================================
// Kept for your existing frontend button/API call. Now it's just
// a full send (every recipient again) with no status restriction —
// there's nothing left for it to guard against, since sendCampaign
// itself no longer blocks. It resets counters the same way a full
// sendCampaign run does.
//

exports.resendCampaign = async (req, res) => {
  try {
    console.log("========== RESEND CAMPAIGN ==========");

    const { campaignId } = req.body;
    const companyId = req.user.companyId;

    const whatsappAccount = await prisma.whatsAppAccount.findFirst({
      where: { companyId, status: "CONNECTED" },
    });

    if (!whatsappAccount) {
      return res.status(400).json({
        success: false,
        message: "No connected WhatsApp account found for this company.",
      });
    }

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required.",
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: String(campaignId), companyId },
      include: {
        template: true,
        recipients: { include: { customer: true } },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    if (!campaign.templateId || !campaign.template) {
      return res.status(400).json({
        success: false,
        message: "This campaign does not have a WhatsApp template selected.",
      });
    }

    if (campaign.template.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "The selected WhatsApp template is not approved.",
      });
    }

    if (!campaign.recipients || campaign.recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one customer.",
      });
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENDING",
        startedAt: new Date(),
        totalRecipients: campaign.recipients.length,
        audienceCount: campaign.recipients.length,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
      },
    });

    const { sentCount, failedCount } = await sendToRecipients(
      campaign,
      campaign.recipients,
      whatsappAccount,
      companyId
    );

    const finalStatus = sentCount === 0 && failedCount > 0 ? "FAILED" : "COMPLETED";

    const completedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        sentCount,
        failedCount,
        totalRecipients: campaign.recipients.length,
        audienceCount: campaign.recipients.length,
      },
    });

    logAction({
      req,
      action: "UPDATE",
      module: "CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,
      changes: {
        after: {
          status: finalStatus,
          totalRecipients: campaign.recipients.length,
          sentCount,
          failedCount,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message:
        finalStatus === "COMPLETED"
          ? "Campaign resent successfully."
          : "Campaign resend failed.",
      data: {
        campaignId: completedCampaign.id,
        status: completedCampaign.status,
        totalRecipients: campaign.recipients.length,
        sentCount,
        failedCount,
      },
    });
  } catch (error) {
    console.error("Resend Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resend campaign.",
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
    const companyId = req.user.companyId;

    const campaign = await prisma.campaign.findFirst({
      where: { id, companyId },
      select: { id: true },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId: id },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: recipients.length,
      data: recipients,
    });
  } catch (error) {
    console.error("Get Campaign Recipients Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaign recipients.",
      error: error.message,
    });
  }
};