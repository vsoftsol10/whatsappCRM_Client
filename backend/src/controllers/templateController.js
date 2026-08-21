// const prisma = require("../config/prisma");
// const { generateTemplate } = require("../services/geminiService");
// const { sendTextMessage, sendTemplateMessage } = require("../services/whatsappService");
// const {
//   getOrCreateConversation,
// } = require("../helpers/conversationHelper");
// // ================= CREATE TEMPLATE =================
// const createTemplate = async (req, res) => {
//   try {
//     const {
//       name,
//       category,
//       messageType,
//       content,
//     } = req.body;

//     if (!name || !content) {
//       return res.status(400).json({
//         success: false,
//         message: "Name and content are required",
//       });
//     }

//     const template = await prisma.template.create({
//       data: {
//         name,
//         category,
//         messageType,
//         content,
//         createdById: req.user.userId,
//         companyId: req.user.companyId,
//       },
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Template created successfully",
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

// // ================= GET ALL TEMPLATES =================
// const getTemplates = async (req, res) => {
//   try {
//     const { search, category, status } = req.query;

//     const where = {
//       companyId: req.user.companyId,
//     };

//     if (search) {
//       where.name = {
//         contains: search,
//         mode: "insensitive",
//       };
//     }

//     if (category) {
//       where.category = category;
//     }

//     if (status) {
//       where.status = status;
//     }

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

// // ================= GET SINGLE TEMPLATE =================
// const getTemplateById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     //console.log("GET TEMPLATE API HIT");

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

//     //console.log("Template Object:", template);
//     //console.log("Recipients:", template.recipients);

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

// // ================= UPDATE TEMPLATE =================
// const updateTemplate = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       name,
//       category,
//       messageType,
//       content,
//       status,
//     } = req.body;

//     const existingTemplate = await prisma.template.findFirst({
//       where: {
//         id,
//         companyId: req.user.companyId
//       }
//     });

//     if (!existingTemplate) {
//       return res.status(404).json({
//         success: false,
//         message: "Template not found",
//       });
//     }

//     const template = await prisma.template.update({
//       where: {
//         id,
//       },
//       data: {
//         name,
//         category,
//         messageType,
//         content,
//         status,
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

// // ================= DELETE TEMPLATE =================
// const deleteTemplate = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const existingTemplate =
//       await prisma.template.findFirst({
//         where: {
//           id,
//           companyId: req.user.companyId
//         }
//       });

//     if (!existingTemplate) {
//       return res.status(404).json({
//         success: false,
//         message: "Template not found",
//       });
//     }

//     await prisma.template.delete({
//       where: {
//         id,
//       },
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

// // ================= SEND TEMPLATE =================
// const sendTemplate = async (req, res) => {
//   try {

//     const {
//       templateId,
//       customerIds
//     } = req.body;


//     // Validation
//     if (
//       !templateId ||
//       !customerIds ||
//       !Array.isArray(customerIds) ||
//       customerIds.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Template ID and customers are required.",
//       });
//     }



//     // Find Template
//     const template =
//       await prisma.template.findFirst({
//         where: {
//           id: templateId,
//           companyId: req.user.companyId,
//         }
//       });



//     if (!template) {

//       return res.status(404).json({

//         success: false,

//         message: "Template not found.",

//       });

//     }




//     // Send template to each customer

//     for (const customerId of customerIds) {


//       // Find Customer

//       const customer =
//         await prisma.customer.findFirst({
//           where: {
//             id: customerId,
//             companyId: req.user.companyId,
//           }
//         });



//       // If customer not found skip

//       if (!customer) {
//         continue;
//       }




//       // Find or create conversation (by phone — avoids duplicate
//       // conversations / unique constraint crashes when a
//       // Conversation already exists for this phone but isn't
//       // linked to this customerId yet)

//       let conversation = await getOrCreateConversation(customer.phone);

//       if (conversation.customerId !== customerId) {
//         conversation = await prisma.conversation.update({
//           where: { id: conversation.id },
//           data: { customerId },
//         });
//       }

//       // =============================
//       // Send WhatsApp Template
//       // =============================

//       let sendStatus = "FAILED";
//       let metaMessageId = null;

//       try {

//         // Uses the same Meta-approved generic template as campaigns
//         // ("custom_campaign_message") so this is a real WhatsApp Template
//         // send — works even outside the 24-hour window — instead of a
//         // free-form text message that only worked when the window was open.
//         const result = await sendTemplateMessage(
//           customer.phone,
//           "custom_campaign_message", // your approved template name
//           [customer.name, template.content] // fills {{1}} and {{2}}
//         );

//         console.log("WhatsApp Result:", result);

//         if (result.success) {
//           sendStatus = "SENT";
//           metaMessageId = result.data?.messages?.[0]?.id || null;
//         }

//       } catch (err) {

//         console.error("WhatsApp Send Error:", err);

//       }

//       // =============================
//       // Save Message
//       // =============================

//       await prisma.message.create({

//         data: {

//           conversationId: conversation.id,

//           sender: "AGENT",

//           content: template.content,

//           messageType: "TEXT",

//           status: sendStatus,

//           metaMessageId,

//         },

//       });

//       // Create or update template recipient history

//       await prisma.templateRecipient.upsert({
//         where: {
//           templateId_customerId: {
//             templateId,
//             customerId,
//           },
//         },
//         update: {
//           status: "SENT",
//           sentAt: new Date(),
//         },
//         create: {
//           templateId,
//           customerId,
//           status: "SENT",
//           sentAt: new Date(),
//         },
//       });

//       // Update conversation

//       await prisma.conversation.update({

//         where: {

//           id: conversation.id,

//         },


//         data: {

//           lastMessage: template.content,

//           updatedAt: new Date(),

//         },


//       });



//     }




//     return res.status(200).json({

//       success: true,

//       message: "Template sent successfully.",

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

// // ================= GENERATE TEMPLATE WITH AI =================
// const generateTemplateWithAI = async (req, res) => {
//   try {
//     const {
//       topic,
//       tone = "Professional",
//     } = req.body;

//     if (!topic) {
//       return res.status(400).json({
//         success: false,
//         message: "Topic is required.",
//       });
//     }

//     const content =
//       await generateTemplate(
//         topic,
//         tone
//       );

//     return res.status(200).json({
//       success: true,
//       message: "Template generated successfully.",
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

// // ================= GET TEMPLATE RECIPIENTS =================
// const getTemplateRecipients = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const template = await prisma.template.findFirst({
//       where: {
//         id,
//         companyId: req.user.companyId,
//       }
//     });

//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         message: "Template not found",
//       });
//     }

//     const recipients =
//       await prisma.templateRecipient.findMany({
//         where: {
//           templateId: id,
//         },
//         select: {
//           customerId: true,
//         },
//       });

//     return res.status(200).json({
//       success: true,
//       data: recipients.map(
//         (recipient) => recipient.customerId
//       ),
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

// module.exports = {
//   createTemplate,
//   getTemplates,
//   getTemplateById,
//   updateTemplate,
//   deleteTemplate,
//   sendTemplate,
//   generateTemplateWithAI,
//   getTemplateRecipients,
// };

const prisma = require("../config/prisma");
const { generateTemplate } = require("../services/geminiService");
const { sendTextMessage, sendTemplateMessage } = require("../services/whatsappService");
const {
  getOrCreateConversation,
} = require("../helpers/conversationHelper");
// ================= CREATE TEMPLATE =================
const createTemplate = async (req, res) => {
  try {
    const {
      name,
      category,
      messageType,
      content,
    } = req.body;

    if (!name || !content) {
      return res.status(400).json({
        success: false,
        message: "Name and content are required",
      });
    }

    const template = await prisma.template.create({
      data: {
        name,
        category,
        messageType,
        content,
        createdById: req.user.userId,
        companyId: req.user.companyId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Template created successfully",
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

// ================= GET ALL TEMPLATES =================
const getTemplates = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    const where = {
      companyId: req.user.companyId,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

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

// ================= GET SINGLE TEMPLATE =================
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    //console.log("GET TEMPLATE API HIT");

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

    //console.log("Template Object:", template);
    //console.log("Recipients:", template.recipients);

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

// ================= UPDATE TEMPLATE =================
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      category,
      messageType,
      content,
      status,
    } = req.body;

    const existingTemplate = await prisma.template.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    const template = await prisma.template.update({
      where: {
        id,
      },
      data: {
        name,
        category,
        messageType,
        content,
        status,
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

// ================= DELETE TEMPLATE =================
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTemplate =
      await prisma.template.findFirst({
        where: {
          id,
          companyId: req.user.companyId
        }
      });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    await prisma.template.delete({
      where: {
        id,
      },
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

// ================= SEND TEMPLATE =================
const sendTemplate = async (req, res) => {
  try {

    const {
      templateId,
      customerIds
    } = req.body;


    // Validation
    if (
      !templateId ||
      !customerIds ||
      !Array.isArray(customerIds) ||
      customerIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Template ID and customers are required.",
      });
    }



    // Find Template
    const template =
      await prisma.template.findFirst({
        where: {
          id: templateId,
          companyId: req.user.companyId,
        }
      });



    if (!template) {

      return res.status(404).json({

        success: false,

        message: "Template not found.",

      });

    }




    // Send template to each customer

    for (const customerId of customerIds) {


      // Find Customer

      const customer =
        await prisma.customer.findFirst({
          where: {
            id: customerId,
            companyId: req.user.companyId,
          }
        });



      // If customer not found skip

      if (!customer) {
        continue;
      }




      // Find or create conversation (by phone — avoids duplicate
      // conversations / unique constraint crashes when a
      // Conversation already exists for this phone but isn't
      // linked to this customerId yet)

      let conversation = await getOrCreateConversation(customer.phone);

      if (conversation.customerId !== customerId) {
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: { customerId },
        });
      }

      // =============================
      // Send WhatsApp Template
      // =============================

      let sendStatus = "FAILED";
      let metaMessageId = null;

      try {

        // Uses the same Meta-approved generic template as campaigns
        // ("custom_campaign_message") so this is a real WhatsApp Template
        // send — works even outside the 24-hour window — instead of a
        // free-form text message that only worked when the window was open.
        const result = await sendTemplateMessage(
          customer.phone,
          "custom_campaign_message", // your approved template name
          [customer.name, template.content] // fills {{1}} and {{2}}
        );

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

          content: template.content,

          messageType: "TEXT",

          status: sendStatus,

          metaMessageId,

        },

      });

      // Create or update template recipient history

      await prisma.templateRecipient.upsert({
        where: {
          templateId_customerId: {
            templateId,
            customerId,
          },
        },
        update: {
          status: "SENT",
          sentAt: new Date(),
        },
        create: {
          templateId,
          customerId,
          status: "SENT",
          sentAt: new Date(),
        },
      });

      // Update conversation

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




    return res.status(200).json({

      success: true,

      message: "Template sent successfully.",

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

// ================= GENERATE TEMPLATE WITH AI =================
const generateTemplateWithAI = async (req, res) => {
  try {
    const {
      topic,
      tone = "Professional",
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Topic is required.",
      });
    }

    const content =
      await generateTemplate(
        topic,
        tone
      );

    return res.status(200).json({
      success: true,
      message: "Template generated successfully.",
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

// ================= GET TEMPLATE RECIPIENTS =================
const getTemplateRecipients = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    const recipients =
      await prisma.templateRecipient.findMany({
        where: {
          templateId: id,
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

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  sendTemplate,
  generateTemplateWithAI,
  getTemplateRecipients,
};