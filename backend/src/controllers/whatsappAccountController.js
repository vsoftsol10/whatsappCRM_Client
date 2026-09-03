const prisma = require("../config/prisma");
const axios = require("axios");

const GRAPH_API_VERSION = "v23.0";


// ============================================
// GET COMPANY WHATSAPP ACCOUNTS
// ============================================
const getWhatsAppAccounts = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        const accounts = await prisma.whatsAppAccount.findMany({
            where: {
                companyId,
            },
            select: {
                id: true,
                wabaId: true,
                phoneNumberId: true,
                whatsappBusinessName: true,
                displayPhoneNumber: true,
                status: true,
                connectedAt: true,
                disconnectedAt: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            accounts,
        });
    } catch (error) {
        console.error("GET WHATSAPP ACCOUNTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch WhatsApp accounts",
        });
    }
};

// ============================================
// GET SINGLE WHATSAPP ACCOUNT
// ============================================
const getWhatsAppAccountById = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const accountId = Number(req.params.id);

        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: "Invalid WhatsApp account ID",
            });
        }

        const account = await prisma.whatsAppAccount.findFirst({
            where: {
                id: accountId,
                companyId,
            },
            select: {
                id: true,
                wabaId: true,
                phoneNumberId: true,
                whatsappBusinessName: true,
                displayPhoneNumber: true,
                status: true,
                connectedAt: true,
                disconnectedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "WhatsApp account not found",
            });
        }

        return res.status(200).json({
            success: true,
            account,
        });
    } catch (error) {
        console.error("GET WHATSAPP ACCOUNT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch WhatsApp account",
        });
    }
};

// ============================================
// CREATE WHATSAPP ACCOUNT
// ============================================
// Temporary/manual connection endpoint.
// Later Embedded Signup will call the same
// persistence logic instead of exposing tokens
// from the frontend.
// ============================================
const createWhatsAppAccount = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        const {
            wabaId,
            phoneNumberId,
            whatsappBusinessName,
            displayPhoneNumber,
            whatsappAccessToken,
        } = req.body;

        if (!phoneNumberId) {
            return res.status(400).json({
                success: false,
                message: "Phone number ID is required",
            });
        }

        if (!whatsappAccessToken) {
            return res.status(400).json({
                success: false,
                message: "WhatsApp access token is required",
            });
        }

        // Make sure this phone number isn't already
        // connected to another account.
        const existingAccount = await prisma.whatsAppAccount.findUnique({
            where: {
                phoneNumberId,
            },
        });

        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: "This WhatsApp phone number is already connected",
            });
        }

        const account = await prisma.whatsAppAccount.create({
            data: {
                companyId,
                wabaId: wabaId || null,
                phoneNumberId,
                whatsappBusinessName:
                    whatsappBusinessName || null,
                displayPhoneNumber:
                    displayPhoneNumber || null,
                whatsappAccessToken,
                status: "CONNECTED",
                connectedAt: new Date(),
            },
            select: {
                id: true,
                wabaId: true,
                phoneNumberId: true,
                whatsappBusinessName: true,
                displayPhoneNumber: true,
                status: true,
                connectedAt: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "WhatsApp account connected successfully",
            account,
        });
    } catch (error) {
        console.error("CREATE WHATSAPP ACCOUNT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to connect WhatsApp account",
        });
    }
};

// ============================================
// DISCONNECT WHATSAPP ACCOUNT
// ============================================
const disconnectWhatsAppAccount = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const accountId = Number(req.params.id);

        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: "Invalid WhatsApp account ID",
            });
        }

        const account = await prisma.whatsAppAccount.findFirst({
            where: {
                id: accountId,
                companyId,
            },
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "WhatsApp account not found",
            });
        }

        const updatedAccount =
            await prisma.whatsAppAccount.update({
                where: {
                    id: accountId,
                },
                data: {
                    status: "DISCONNECTED",
                    disconnectedAt: new Date(),
                },
                select: {
                    id: true,
                    wabaId: true,
                    phoneNumberId: true,
                    whatsappBusinessName: true,
                    displayPhoneNumber: true,
                    status: true,
                    connectedAt: true,
                    disconnectedAt: true,
                },
            });

        return res.status(200).json({
            success: true,
            message: "WhatsApp account disconnected successfully",
            account: updatedAccount,
        });
    } catch (error) {
        console.error(
            "DISCONNECT WHATSAPP ACCOUNT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to disconnect WhatsApp account",
        });
    }
};

// ============================================
// TEST WHATSAPP CONNECTION
// ============================================
const testWhatsAppConnection = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        const account = await prisma.whatsAppAccount.findFirst({
            where: {
                companyId,
                status: "CONNECTED",
            },
            select: {
                id: true,
                wabaId: true,
                phoneNumberId: true,
                whatsappBusinessName: true,
                displayPhoneNumber: true,
                status: true,
                connectedAt: true,
            },
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "No connected WhatsApp account found for this company",
            });
        }

        return res.status(200).json({
            success: true,
            message: "WhatsApp account is connected",
            account,
        });
    } catch (error) {
        console.error("TEST WHATSAPP CONNECTION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to test WhatsApp connection",
        });
    }
};

// ============================================
// META WHATSAPP EMBEDDED SIGNUP
// ============================================
const embeddedSignup = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { code, wabaId, phoneNumberId } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Company ID is required" });
        }
        if (!code || !wabaId || !phoneNumberId) {
            return res.status(400).json({
                success: false,
                message: "Missing code, WABA ID, or Phone Number ID from Meta",
            });
        }

        // 1. Exchange the authorization code for an access token
        const tokenRes = await axios.get(
            `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`,
            {
                params: {
                    client_id: process.env.META_APP_ID,
                    client_secret: process.env.META_APP_SECRET,
                    code,
                },
            }
        );
        const accessToken = tokenRes.data.access_token;

        // 2. Subscribe your app to this WABA so Meta sends webhooks to it
        await axios.post(
            `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`,
            {},
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        // 3. Fetch phone number details for display purposes
        const phoneRes = await axios.get(
            `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}`,
            {
                params: { fields: "display_phone_number,verified_name" },
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        const { display_phone_number, verified_name } = phoneRes.data;

        // 4. Save or update this WhatsApp account for the company
        const existing = await prisma.whatsAppAccount.findUnique({ where: { phoneNumberId } });

        const account = existing
            ? await prisma.whatsAppAccount.update({
                  where: { phoneNumberId },
                  data: {
                      companyId,
                      wabaId,
                      whatsappAccessToken: accessToken,
                      whatsappBusinessName: verified_name || null,
                      displayPhoneNumber: display_phone_number || null,
                      status: "CONNECTED",
                      connectedAt: new Date(),
                      disconnectedAt: null,
                  },
              })
            : await prisma.whatsAppAccount.create({
                  data: {
                      companyId,
                      wabaId,
                      phoneNumberId,
                      whatsappAccessToken: accessToken,
                      whatsappBusinessName: verified_name || null,
                      displayPhoneNumber: display_phone_number || null,
                      status: "CONNECTED",
                      connectedAt: new Date(),
                  },
              });

        return res.status(200).json({
            success: true,
            message: "WhatsApp account connected successfully",
            account: {
                id: account.id,
                wabaId: account.wabaId,
                phoneNumberId: account.phoneNumberId,
                whatsappBusinessName: account.whatsappBusinessName,
                displayPhoneNumber: account.displayPhoneNumber,
                status: account.status,
            },
        });
    } catch (error) {
        console.error("EMBEDDED SIGNUP ERROR:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to process WhatsApp Embedded Signup",
        });
    }
};

module.exports = {
    getWhatsAppAccounts,
    getWhatsAppAccountById,
    createWhatsAppAccount,
    disconnectWhatsAppAccount,
    testWhatsAppConnection,
    embeddedSignup,
};