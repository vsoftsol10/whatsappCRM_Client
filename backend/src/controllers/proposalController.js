// ======================================================
// backend/src/controllers/proposalController.js   (NEW FILE)
//
//   GET    /api/proposals                    list
//   GET    /api/proposals/:id                one proposal
//   POST   /api/proposals                    create
//   PUT    /api/proposals/:id                update
//   DELETE /api/proposals/:id                delete
//   GET    /api/proposals/:id/pdf            download PDF
//   POST   /api/proposals/:id/send-whatsapp  send PDF to the customer
// ======================================================
const prisma = require("../config/prisma");
const { buildProposalPdf } = require("../services/proposalPdfService");
const {
  sendTextMessage,
  uploadMediaToMeta,
  sendMediaMessage: sendWhatsAppMedia,
} = require("../services/whatsappService");
const { uploadBufferToCloudinary } = require("../services/cloudinaryService");
const { classifyMedia } = require("../middleware/mediaUploadMiddleware");
const { getDefaultBotEnabled } = require("../utils/botDefault");
const { normalizeIndianPhone } = require("../utils/phoneUtils");

const ALLOWED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];
const MAX_ITEMS = 50;
const MAX_TITLE = 150;
const MAX_TEXT = 5000;

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// WhatsApp needs the number as digits with the country code.
//   9876543210       -> 919876543210   (Indian mobile, 91 added)
//   +1 415 555 0100  -> 14155550100    (other countries kept as typed)
// Returns null when the number does not look valid.
const normalizePhone = (value) => {
  const raw = cleanText(value);
  if (!raw) return "";

  const indian = normalizeIndianPhone(raw);
  if (indian) return indian;

  const digits = raw.replace(/\D/g, "");
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ------------------------------------------------------
// Clean the items sent by the browser and calculate every
// total on the server (the browser's totals are never trusted).
// ------------------------------------------------------
const normalizeItems = (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "Add at least one item" };
  }

  if (rawItems.length > MAX_ITEMS) {
    return { error: `A proposal can have at most ${MAX_ITEMS} items` };
  }

  const items = [];

  for (let i = 0; i < rawItems.length; i++) {
    const raw = rawItems[i] || {};
    const name = cleanText(raw.name);
    const description = cleanText(raw.description);
    const quantity = Number(raw.quantity);
    const unitPrice = Number(raw.unitPrice);
    const discountPercent = Number(raw.discountPercent || 0);
    const taxPercent = Number(raw.taxPercent || 0);

    if (!name) return { error: `Item ${i + 1}: name is required` };
    if (name.length > 200) return { error: `Item ${i + 1}: name is too long` };
    if (description.length > 1000) {
      return { error: `Item ${i + 1}: description is too long` };
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { error: `Item ${i + 1}: quantity must be more than 0` };
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return { error: `Item ${i + 1}: price cannot be negative` };
    }
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      return { error: `Item ${i + 1}: discount must be between 0 and 100` };
    }
    if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
      return { error: `Item ${i + 1}: tax must be between 0 and 100` };
    }

    const base = quantity * unitPrice;
    const discountAmount = base * (discountPercent / 100);
    const taxable = base - discountAmount;
    const taxAmount = taxable * (taxPercent / 100);

    items.push({
      name,
      description,
      quantity,
      unitPrice: round2(unitPrice),
      discountPercent,
      taxPercent,
      lineTotal: round2(taxable + taxAmount),
      _base: base,
      _discount: discountAmount,
      _tax: taxAmount,
    });
  }

  const subtotal = round2(items.reduce((s, it) => s + it._base, 0));
  const discountTotal = round2(items.reduce((s, it) => s + it._discount, 0));
  const taxTotal = round2(items.reduce((s, it) => s + it._tax, 0));
  const total = round2(subtotal - discountTotal + taxTotal);

  return {
    items: items.map(({ _base, _discount, _tax, ...keep }) => keep),
    subtotal,
    discountTotal,
    taxTotal,
    total,
  };
};

// ------------------------------------------------------
// Validate the form fields shared by create + update
// ------------------------------------------------------
const parseProposalBody = async (body, companyId) => {
  const title = cleanText(body.title);
  const customerId = cleanText(body.customerId);
  const clientName = cleanText(body.clientName);
  const clientCompany = cleanText(body.clientCompany);
  const clientEmail = cleanText(body.clientEmail);
  const currency = cleanText(body.currency).toUpperCase() || "INR";

  if (!title) return { error: "Proposal title is required" };
  if (title.length > MAX_TITLE) {
    return { error: `Title must be ${MAX_TITLE} characters or less` };
  }
  if (!clientName) return { error: "Client name is required" };
  if (clientName.length > 150) return { error: "Client name is too long" };
  if (clientCompany.length > 150) return { error: "Client company is too long" };

  if (clientEmail && (clientEmail.length > 150 || !EMAIL_REGEX.test(clientEmail))) {
    return { error: "Client email is not valid" };
  }

  const clientPhone = normalizePhone(body.clientPhone);
  if (clientPhone === null) {
    return { error: "Client phone number is not valid (include the country code for non-Indian numbers)" };
  }
  if (!ALLOWED_CURRENCIES.includes(currency)) {
    return { error: "Unsupported currency" };
  }

  const texts = {};
  for (const field of ["introMessage", "scope", "terms", "paymentDetails"]) {
    const value = cleanText(body[field]);
    if (value.length > MAX_TEXT) {
      return { error: `${field} must be ${MAX_TEXT} characters or less` };
    }
    texts[field] = value || null;
  }

  let validUntil = null;
  if (body.validUntil) {
    validUntil = new Date(body.validUntil);
    if (Number.isNaN(validUntil.getTime())) {
      return { error: "Valid-until date is not valid" };
    }
  }

  // The customer link is optional. When given, it must belong to the
  // same company.
  if (customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId },
      select: { id: true },
    });

    if (!customer) return { error: "Customer not found" };
  }

  const calc = normalizeItems(body.items);
  if (calc.error) return { error: calc.error };

  return {
    data: {
      title,
      customerId: customerId || null,
      clientName,
      clientPhone: clientPhone || null,
      clientEmail: clientEmail || null,
      clientCompany: clientCompany || null,
      currency,
      validUntil,
      ...texts,
      items: calc.items,
      subtotal: calc.subtotal,
      discountTotal: calc.discountTotal,
      taxTotal: calc.taxTotal,
      total: calc.total,
    },
  };
};

// PROP-2026-0001, PROP-2026-0002 ... (numbering restarts every year,
// separately for every company)
const nextProposalNumber = async (companyId) => {
  const prefix = `PROP-${new Date().getFullYear()}-`;

  const last = await prisma.proposal.findFirst({
    where: { companyId, proposalNumber: { startsWith: prefix } },
    orderBy: { proposalNumber: "desc" },
    select: { proposalNumber: true },
  });

  const lastSeq = last ? parseInt(last.proposalNumber.slice(prefix.length), 10) : 0;

  return `${prefix}${String((lastSeq || 0) + 1).padStart(4, "0")}`;
};

const listInclude = {
  customer: { select: { id: true, name: true, phone: true, companyName: true } },
  createdBy: { select: { id: true, name: true } },
};

// ===============================
// LIST
// ===============================
const getProposals = async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = { companyId: req.user.companyId };

    if (status) where.status = String(status);

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { proposalNumber: { contains: String(search), mode: "insensitive" } },
        { clientName: { contains: String(search), mode: "insensitive" } },
        { customer: { name: { contains: String(search), mode: "insensitive" } } },
      ];
    }

    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: listInclude,
    });

    return res.status(200).json({ success: true, proposals });
  } catch (error) {
    console.error("Get proposals error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ===============================
// GET ONE
// ===============================
const getProposalById = async (req, res) => {
  try {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: {
        ...listInclude,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            companyName: true,
          },
        },
      },
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }

    return res.status(200).json({ success: true, proposal });
  } catch (error) {
    console.error("Get proposal error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ===============================
// CREATE
// ===============================
const createProposal = async (req, res) => {
  try {
    const { companyId, userId } = req.user;

    const parsed = await parseProposalBody(req.body, companyId);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    // Two people saving at the same moment could get the same number:
    // the database refuses the duplicate, so just try the next number.
    let proposal = null;

    for (let attempt = 0; attempt < 5 && !proposal; attempt++) {
      const proposalNumber = await nextProposalNumber(companyId);

      try {
        proposal = await prisma.proposal.create({
          data: {
            ...parsed.data,
            companyId,
            createdById: userId,
            proposalNumber,
            status: "DRAFT",
          },
          include: listInclude,
        });
      } catch (error) {
        if (error.code !== "P2002") throw error;
      }
    }

    if (!proposal) {
      return res.status(500).json({
        success: false,
        message: "Could not create the proposal number. Please try again.",
      });
    }

    return res.status(201).json({ success: true, proposal });
  } catch (error) {
    console.error("Create proposal error:", error);
    return res.status(500).json({ success: false, message: "Failed to create proposal" });
  }
};

// ===============================
// UPDATE
// ===============================
const updateProposal = async (req, res) => {
  try {
    const { companyId } = req.user;

    const existing = await prisma.proposal.findFirst({
      where: { id: req.params.id, companyId },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }

    const parsed = await parseProposalBody(req.body, companyId);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const proposal = await prisma.proposal.update({
      where: { id: existing.id },
      data: parsed.data,
      include: listInclude,
    });

    return res.status(200).json({ success: true, proposal });
  } catch (error) {
    console.error("Update proposal error:", error);
    return res.status(500).json({ success: false, message: "Failed to update proposal" });
  }
};

// ===============================
// DELETE  (admin, or the person who created it)
// ===============================
const deleteProposal = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;

    const existing = await prisma.proposal.findFirst({
      where: { id: req.params.id, companyId },
      select: { id: true, createdById: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }

    if (role !== "ADMIN" && existing.createdById !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only an admin or the creator can delete this proposal",
      });
    }

    await prisma.proposal.delete({ where: { id: existing.id } });

    return res.status(200).json({ success: true, message: "Proposal deleted" });
  } catch (error) {
    console.error("Delete proposal error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete proposal" });
  }
};

// Loads everything the PDF needs (company + customer + proposal)
const loadForPdf = async (id, companyId) => {
  const proposal = await prisma.proposal.findFirst({
    where: { id, companyId },
    include: { customer: true, company: true },
  });

  return proposal;
};

const pdfFileName = (proposal) => `${proposal.proposalNumber}.pdf`;

// Who the proposal is addressed to. Older proposals (made before the
// client fields existed) fall back to the linked customer.
const getRecipient = (proposal) => ({
  name: proposal.clientName || proposal.customer?.name || "",
  phone: proposal.clientPhone || proposal.customer?.phone || "",
  email: proposal.clientEmail || proposal.customer?.email || "",
  companyName: proposal.clientCompany || proposal.customer?.companyName || "",
});

// ===============================
// DOWNLOAD PDF
// ===============================
const downloadProposalPdf = async (req, res) => {
  try {
    const proposal = await loadForPdf(req.params.id, req.user.companyId);

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }

    const buffer = await buildProposalPdf(
      proposal,
      proposal.company,
      getRecipient(proposal)
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName(proposal)}"`);
    res.setHeader("Content-Length", buffer.length);

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Proposal PDF error:", error);
    return res.status(500).json({ success: false, message: "Failed to create PDF" });
  }
};

// ===============================
// SEND ON WHATSAPP
// Sends an optional text message, then the PDF, into the customer's
// WhatsApp chat. Both messages are saved in that chat.
// ===============================
const sendProposalOnWhatsApp = async (req, res) => {
  try {
    const { companyId } = req.user;

    const proposal = await loadForPdf(req.params.id, companyId);

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }

    const recipient = getRecipient(proposal);

    if (!recipient.phone) {
      return res.status(400).json({
        success: false,
        message:
          "This proposal has no phone number. Edit the proposal and add the client's phone number.",
      });
    }

    const customMessage = cleanText(req.body?.message);
    const message =
      customMessage ||
      `Hi ${recipient.name}, please find our proposal "${proposal.title}" attached.`;

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message must be 1000 characters or less",
      });
    }

    // 1. The client's WhatsApp chat (create it if this is the first time).
    //    The client may be a saved customer or just a typed-in contact.
    let conversation = await prisma.conversation.findFirst({
      where: { companyId, phone: recipient.phone, channel: "WHATSAPP" },
      include: { whatsappAccount: true },
    });

    // The linked customer, when the number is still that customer's number
    const linkedCustomer =
      proposal.customer &&
      normalizePhone(proposal.customer.phone) === recipient.phone
        ? proposal.customer
        : null;

    if (!conversation && linkedCustomer) {
      conversation = await prisma.conversation.findFirst({
        where: { companyId, customerId: linkedCustomer.id },
        include: { whatsappAccount: true },
      });
    }

    let whatsappAccount = conversation?.whatsappAccount || null;

    if (!whatsappAccount || whatsappAccount.status !== "CONNECTED") {
      whatsappAccount = await prisma.whatsAppAccount.findFirst({
        where: { companyId, status: "CONNECTED" },
      });
    }

    if (!whatsappAccount) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp is not connected. Connect WhatsApp first.",
      });
    }

    if (!conversation) {
      // A customer can only have ONE chat, so only link it when it has none
      let linkCustomerId = null;

      if (linkedCustomer) {
        const taken = await prisma.conversation.findFirst({
          where: { customerId: linkedCustomer.id },
          select: { id: true },
        });

        if (!taken) linkCustomerId = linkedCustomer.id;
      }

      conversation = await prisma.conversation.create({
        data: {
          companyId,
          ...(linkCustomerId && { customerId: linkCustomerId }),
          phone: recipient.phone,
          channel: "WHATSAPP",
          whatsappAccountId: whatsappAccount.id,
          contactName: recipient.name || undefined,
          botEnabled: await getDefaultBotEnabled(companyId),
        },
        include: { whatsappAccount: true },
      });
    }

    // 2. Make the PDF
    const pdfBuffer = await buildProposalPdf(proposal, proposal.company, recipient);
    const fileName = pdfFileName(proposal);
    const media = classifyMedia("application/pdf");

    if (!media) {
      return res.status(500).json({
        success: false,
        message: "PDF documents are not enabled for WhatsApp sending",
      });
    }

    const explain24h = (error) =>
      error?.error?.code === 131047 || error?.code === 131047
        ? "WhatsApp only allows this within 24 hours of the customer's last message. Ask the customer to message you first, then send again."
        : null;

    // 3. Text message first (if this fails nothing else is sent)
    const textResult = await sendTextMessage(recipient.phone, message, whatsappAccount);

    if (!textResult.success) {
      const reason = explain24h(textResult.error);

      return res.status(reason ? 400 : 500).json({
        success: false,
        message: reason || "Failed to send WhatsApp message",
        error: reason ? undefined : textResult.error,
      });
    }

    const textMetaId = textResult.data?.messages?.[0]?.id || undefined;

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        sender: "AGENT",
        messageType: "TEXT",
        status: "SENT",
        ...(textMetaId && { metaMessageId: textMetaId }),
      },
    });

    // 4. Keep a copy of the PDF so the chat can show / open it later
    let stored = null;

    try {
      stored = await uploadBufferToCloudinary(pdfBuffer, {
        folder: "crm-sent-media",
        resourceType: media.cloudinaryResourceType,
        publicId: `${Date.now()}-${fileName}`,
      });
    } catch (uploadError) {
      console.error("Proposal PDF storage upload failed:", uploadError);
    }

    // 5. Send the PDF to WhatsApp
    const uploaded = await uploadMediaToMeta(
      pdfBuffer,
      media.mime,
      fileName,
      whatsappAccount
    );

    if (!uploaded.success) {
      return res.status(500).json({
        success: false,
        message: "Message sent, but the PDF could not be uploaded to WhatsApp",
        error: uploaded.error,
      });
    }

    const docResult = await sendWhatsAppMedia(
      recipient.phone,
      { type: "document", mediaId: uploaded.mediaId, fileName },
      whatsappAccount
    );

    if (!docResult.success) {
      return res.status(500).json({
        success: false,
        message: "Message sent, but the PDF could not be sent on WhatsApp",
        error: docResult.error,
      });
    }

    const docMetaId = docResult.data?.messages?.[0]?.id || undefined;

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: fileName,
        sender: "AGENT",
        messageType: "DOCUMENT",
        status: "SENT",
        ...(stored?.imageUrl && { imageUrl: stored.imageUrl }),
        ...(docMetaId && { metaMessageId: docMetaId }),
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: `📄 ${fileName}`,
        // An agent replied by hand, so pause the AI auto-reply (same as
        // every other manual send in the CRM).
        botEnabled: false,
      },
    });

    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "SENT", sentAt: new Date() },
      include: listInclude,
    });

    return res.status(200).json({
      success: true,
      message: "Proposal sent on WhatsApp",
      proposal: updated,
    });
  } catch (error) {
    console.error("Send proposal error:", error);
    return res.status(500).json({ success: false, message: "Failed to send proposal" });
  }
};

module.exports = {
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  downloadProposalPdf,
  sendProposalOnWhatsApp,
};