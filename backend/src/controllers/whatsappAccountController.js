// const prisma = require("../config/prisma");
// const axios = require("axios");

// const GRAPH_API_VERSION = "v23.0";


// // ============================================
// // GET COMPANY WHATSAPP ACCOUNTS
// // ============================================
// const getWhatsAppAccounts = async (req, res) => {
//     try {
//         const companyId = req.user.companyId;

//         const accounts = await prisma.whatsAppAccount.findMany({
//             where: {
//                 companyId,
//             },
//             select: {
//                 id: true,
//                 wabaId: true,
//                 phoneNumberId: true,
//                 whatsappBusinessName: true,
//                 displayPhoneNumber: true,
//                 status: true,
//                 connectedAt: true,
//                 disconnectedAt: true,
//                 createdAt: true,
//                 updatedAt: true,
//             },
//             orderBy: {
//                 createdAt: "desc",
//             },
//         });

//         return res.status(200).json({
//             success: true,
//             accounts,
//         });
//     } catch (error) {
//         console.error("GET WHATSAPP ACCOUNTS ERROR:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch WhatsApp accounts",
//         });
//     }
// };

// // ============================================
// // GET SINGLE WHATSAPP ACCOUNT
// // ============================================
// const getWhatsAppAccountById = async (req, res) => {
//     try {
//         const companyId = req.user.companyId;
//         const accountId = Number(req.params.id);

//         if (!accountId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid WhatsApp account ID",
//             });
//         }

//         const account = await prisma.whatsAppAccount.findFirst({
//             where: {
//                 id: accountId,
//                 companyId,
//             },
//             select: {
//                 id: true,
//                 wabaId: true,
//                 phoneNumberId: true,
//                 whatsappBusinessName: true,
//                 displayPhoneNumber: true,
//                 status: true,
//                 connectedAt: true,
//                 disconnectedAt: true,
//                 createdAt: true,
//                 updatedAt: true,
//             },
//         });

//         if (!account) {
//             return res.status(404).json({
//                 success: false,
//                 message: "WhatsApp account not found",
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             account,
//         });
//     } catch (error) {
//         console.error("GET WHATSAPP ACCOUNT ERROR:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch WhatsApp account",
//         });
//     }
// };

// // ============================================
// // CREATE WHATSAPP ACCOUNT
// // ============================================
// // Temporary/manual connection endpoint.
// // Later Embedded Signup will call the same
// // persistence logic instead of exposing tokens
// // from the frontend.
// // ============================================
// const createWhatsAppAccount = async (req, res) => {
//     try {
//         const companyId = req.user.companyId;

//         const {
//             wabaId,
//             phoneNumberId,
//             whatsappBusinessName,
//             displayPhoneNumber,
//             whatsappAccessToken,
//         } = req.body;

//         if (!phoneNumberId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Phone number ID is required",
//             });
//         }

//         if (!whatsappAccessToken) {
//             return res.status(400).json({
//                 success: false,
//                 message: "WhatsApp access token is required",
//             });
//         }

//         // Make sure this phone number isn't already
//         // connected to another account.
//         const existingAccount = await prisma.whatsAppAccount.findUnique({
//             where: {
//                 phoneNumberId,
//             },
//         });

//         if (existingAccount) {
//             return res.status(409).json({
//                 success: false,
//                 message: "This WhatsApp phone number is already connected",
//             });
//         }

//         const account = await prisma.whatsAppAccount.create({
//             data: {
//                 companyId,
//                 wabaId: wabaId || null,
//                 phoneNumberId,
//                 whatsappBusinessName:
//                     whatsappBusinessName || null,
//                 displayPhoneNumber:
//                     displayPhoneNumber || null,
//                 whatsappAccessToken,
//                 status: "CONNECTED",
//                 connectedAt: new Date(),
//             },
//             select: {
//                 id: true,
//                 wabaId: true,
//                 phoneNumberId: true,
//                 whatsappBusinessName: true,
//                 displayPhoneNumber: true,
//                 status: true,
//                 connectedAt: true,
//                 createdAt: true,
//             },
//         });

//         return res.status(201).json({
//             success: true,
//             message: "WhatsApp account connected successfully",
//             account,
//         });
//     } catch (error) {
//         console.error("CREATE WHATSAPP ACCOUNT ERROR:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to connect WhatsApp account",
//         });
//     }
// };

// // ============================================
// // DISCONNECT WHATSAPP ACCOUNT
// // ============================================
// const disconnectWhatsAppAccount = async (req, res) => {
//     try {
//         const companyId = req.user.companyId;
//         const accountId = Number(req.params.id);

//         if (!accountId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid WhatsApp account ID",
//             });
//         }

//         const account = await prisma.whatsAppAccount.findFirst({
//             where: {
//                 id: accountId,
//                 companyId,
//             },
//         });

//         if (!account) {
//             return res.status(404).json({
//                 success: false,
//                 message: "WhatsApp account not found",
//             });
//         }

//         const updatedAccount =
//             await prisma.whatsAppAccount.update({
//                 where: {
//                     id: accountId,
//                 },
//                 data: {
//                     status: "DISCONNECTED",
//                     disconnectedAt: new Date(),
//                 },
//                 select: {
//                     id: true,
//                     wabaId: true,
//                     phoneNumberId: true,
//                     whatsappBusinessName: true,
//                     displayPhoneNumber: true,
//                     status: true,
//                     connectedAt: true,
//                     disconnectedAt: true,
//                 },
//             });

//         return res.status(200).json({
//             success: true,
//             message: "WhatsApp account disconnected successfully",
//             account: updatedAccount,
//         });
//     } catch (error) {
//         console.error(
//             "DISCONNECT WHATSAPP ACCOUNT ERROR:",
//             error
//         );

//         return res.status(500).json({
//             success: false,
//             message: "Failed to disconnect WhatsApp account",
//         });
//     }
// };

// // ============================================
// // TEST WHATSAPP CONNECTION
// // ============================================
// const testWhatsAppConnection = async (req, res) => {
//     try {
//         const companyId = req.user.companyId;

//         const account = await prisma.whatsAppAccount.findFirst({
//             where: {
//                 companyId,
//                 status: "CONNECTED",
//             },
//             select: {
//                 id: true,
//                 wabaId: true,
//                 phoneNumberId: true,
//                 whatsappBusinessName: true,
//                 displayPhoneNumber: true,
//                 status: true,
//                 connectedAt: true,
//             },
//         });

//         if (!account) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No connected WhatsApp account found for this company",
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: "WhatsApp account is connected",
//             account,
//         });
//     } catch (error) {
//         console.error("TEST WHATSAPP CONNECTION ERROR:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to test WhatsApp connection",
//         });
//     }
// };

// // ============================================
// // META WHATSAPP EMBEDDED SIGNUP
// // ============================================
// const embeddedSignup = async (req, res) => {
//     try {
//         const companyId = req.user.companyId;
//         const { code, wabaId, phoneNumberId } = req.body;

//         if (!companyId) {
//             return res.status(400).json({ success: false, message: "Company ID is required" });
//         }
//         if (!code || !wabaId || !phoneNumberId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing code, WABA ID, or Phone Number ID from Meta",
//             });
//         }

//         // 1. Exchange the authorization code for an access token
//         const tokenRes = await axios.get(
//             `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`,
//             {
//                 params: {
//                     client_id: process.env.META_APP_ID,
//                     client_secret: process.env.META_APP_SECRET,
//                     code,
//                 },
//             }
//         );
//         const accessToken = tokenRes.data.access_token;

//         // 2. Subscribe your app to this WABA so Meta sends webhooks to it
//         await axios.post(
//             `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`,
//             {},
//             { headers: { Authorization: `Bearer ${accessToken}` } }
//         );

//         // 3. Fetch phone number details for display purposes
//         const phoneRes = await axios.get(
//             `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}`,
//             {
//                 params: { fields: "display_phone_number,verified_name" },
//                 headers: { Authorization: `Bearer ${accessToken}` },
//             }
//         );
//         const { display_phone_number, verified_name } = phoneRes.data;

//         // 4. Save or update this WhatsApp account for the company
//         const existing = await prisma.whatsAppAccount.findUnique({ where: { phoneNumberId } });

//         if (existing && existing.companyId !== companyId) {
//             return res.status(409).json({
//                 success: false,
//                 message: "This WhatsApp number is already connected to another account",
//             });
//         }

//         const account = existing
//             ? await prisma.whatsAppAccount.update({
//                 where: { phoneNumberId },
//                 data: {
//                     companyId,
//                     wabaId,
//                     whatsappAccessToken: accessToken,
//                     whatsappBusinessName: verified_name || null,
//                     displayPhoneNumber: display_phone_number || null,
//                     status: "CONNECTED",
//                     connectedAt: new Date(),
//                     disconnectedAt: null,
//                 },
//             })
//             : await prisma.whatsAppAccount.create({
//                 data: {
//                     companyId,
//                     wabaId,
//                     phoneNumberId,
//                     whatsappAccessToken: accessToken,
//                     whatsappBusinessName: verified_name || null,
//                     displayPhoneNumber: display_phone_number || null,
//                     status: "CONNECTED",
//                     connectedAt: new Date(),
//                 },
//             });

//         return res.status(200).json({
//             success: true,
//             message: "WhatsApp account connected successfully",
//             account: {
//                 id: account.id,
//                 wabaId: account.wabaId,
//                 phoneNumberId: account.phoneNumberId,
//                 whatsappBusinessName: account.whatsappBusinessName,
//                 displayPhoneNumber: account.displayPhoneNumber,
//                 status: account.status,
//             },
//         });
//     } catch (error) {
//         console.error("EMBEDDED SIGNUP ERROR:", error.response?.data || error.message);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to process WhatsApp Embedded Signup",
//         });
//     }
// };

// module.exports = {
//     getWhatsAppAccounts,
//     getWhatsAppAccountById,
//     createWhatsAppAccount,
//     disconnectWhatsAppAccount,
//     testWhatsAppConnection,
//     embeddedSignup,
// };

const prisma = require("../config/prisma");
const axios = require("axios");

const {
    subscribeAppToWaba,
    getPhoneNumbersForWaba,
    getPhoneNumberStatus,
    runPostOnboardingSync,
} = require("../services/coexistenceService");

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
                isCoexistence: true,
                isOnBizApp: true,
                platformType: true,
                contactsSyncStatus: true,
                historySyncStatus: true,
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
                isCoexistence: true,
                isOnBizApp: true,
                platformType: true,
                contactsSyncStatus: true,
                historySyncStatus: true,
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
// (handles BOTH standard API-only signup AND Coexistence)
// ============================================
const embeddedSignup = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { code, wabaId, phoneNumberId, isCoexistence } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Company ID is required" });
        }
        if (!code || !wabaId) {
            return res.status(400).json({
                success: false,
                message: "Missing code or WABA ID from Meta",
            });
        }

        // Standard (API-only) signup still needs a phoneNumberId up front.
        // Coexistence's FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING event never
        // sends one, so we don't require it on that path — we look it up
        // ourselves below instead.
        if (!isCoexistence && !phoneNumberId) {
            return res.status(400).json({
                success: false,
                message: "Missing Phone Number ID from Meta",
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
        //    (messages, and — for Coexistence — history, smb_app_state_sync,
        //    smb_message_echoes, account_update once those fields are also
        //    subscribed in the App Dashboard).
        await subscribeAppToWaba(wabaId, accessToken);

        // 3. Resolve the phone number + its details.
        let resolvedPhoneNumberId = phoneNumberId;
        let display_phone_number = null;
        let verified_name = null;
        let isOnBizApp = false;
        let platformType = null;

        if (isCoexistence && !resolvedPhoneNumberId) {
            // Coexistence didn't give us a phone_number_id — look it up
            // from the WABA the business just connected.
            const numbers = await getPhoneNumbersForWaba(wabaId, accessToken);

            if (!numbers.length) {
                return res.status(422).json({
                    success: false,
                    message: "No phone number found on this WhatsApp Business Account yet",
                });
            }

            const phoneNumber = numbers[0];
            resolvedPhoneNumberId = phoneNumber.id;
            display_phone_number = phoneNumber.display_phone_number || null;
            verified_name = phoneNumber.verified_name || null;
            isOnBizApp = !!phoneNumber.is_on_biz_app;
            platformType = phoneNumber.platform_type || null;
        } else {
            const phoneStatus = await getPhoneNumberStatus(resolvedPhoneNumberId, accessToken);
            display_phone_number = phoneStatus.display_phone_number || null;
            verified_name = phoneStatus.verified_name || null;
            isOnBizApp = !!phoneStatus.is_on_biz_app;
            platformType = phoneStatus.platform_type || null;
        }

        // 4. Save or update this WhatsApp account for the company
        const existing = await prisma.whatsAppAccount.findUnique({
            where: { phoneNumberId: resolvedPhoneNumberId },
        });

        if (existing && existing.companyId !== companyId) {
            return res.status(409).json({
                success: false,
                message: "This WhatsApp number is already connected to another account",
            });
        }

        const accountData = {
            companyId,
            wabaId,
            whatsappAccessToken: accessToken,
            whatsappBusinessName: verified_name || null,
            displayPhoneNumber: display_phone_number || null,
            status: "CONNECTED",
            connectedAt: new Date(),
            disconnectedAt: null,
            isCoexistence: !!isCoexistence,
            isOnBizApp,
            platformType,
            ...(isCoexistence && {
                contactsSyncStatus: "NOT_STARTED",
                historySyncStatus: "NOT_STARTED",
                syncDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }),
        };

        const account = existing
            ? await prisma.whatsAppAccount.update({
                where: { phoneNumberId: resolvedPhoneNumberId },
                data: accountData,
            })
            : await prisma.whatsAppAccount.create({
                data: { ...accountData, phoneNumberId: resolvedPhoneNumberId },
            });

        // 5. Coexistence: kick off the 24h contacts + chat history sync.
        // Fire-and-forget — Meta says this can take several minutes, and
        // it must never block the HTTP response back to the frontend.
        if (isCoexistence) {
            runPostOnboardingSync(account.id, resolvedPhoneNumberId, accessToken).catch((err) => {
                console.error("COEXISTENCE SYNC PIPELINE FAILED:", err);
            });
        }

        return res.status(200).json({
            success: true,
            message: isCoexistence
                ? "WhatsApp Business App connected — syncing contacts and chat history now"
                : "WhatsApp account connected successfully",
            account: {
                id: account.id,
                wabaId: account.wabaId,
                phoneNumberId: account.phoneNumberId,
                whatsappBusinessName: account.whatsappBusinessName,
                displayPhoneNumber: account.displayPhoneNumber,
                status: account.status,
                isCoexistence: account.isCoexistence,
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

// ============================================
// GET COEXISTENCE SYNC STATUS
// ============================================
// Lets the frontend poll onboarding/sync progress after connecting
// (contacts + history sync can take several minutes).
const getCoexistenceStatus = async (req, res) => {
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
            where: { id: accountId, companyId },
            select: {
                id: true,
                isCoexistence: true,
                isOnBizApp: true,
                platformType: true,
                contactsSyncStatus: true,
                historySyncStatus: true,
                syncDeadline: true,
                status: true,
            },
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "WhatsApp account not found",
            });
        }

        // Meta never sends an explicit "contacts sync finished" signal
        // for smb_app_state_sync the way it does for history sync
        // (progress: 100) — it can just go quiet once it's actually
        // done, so contactsSyncStatus can sit at IN_PROGRESS forever.
        // Rather than have the frontend wait on a COMPLETED that may
        // never arrive, treat the sync as settled once history sync
        // reaches a terminal state, or once the 24h sync window
        // (syncDeadline) has passed.
        const deadlinePassed =
            !!account.syncDeadline && new Date(account.syncDeadline) < new Date();

        const historyIsTerminal = ["COMPLETED", "DECLINED", "FAILED"].includes(
            account.historySyncStatus
        );

        const contactsEffectivelyDone =
            account.contactsSyncStatus === "COMPLETED" ||
            account.contactsSyncStatus === "FAILED" ||
            historyIsTerminal ||
            deadlinePassed;

        // The single flag the frontend should actually poll on — true
        // once there is nothing left worth waiting for.
        const syncFinished =
            contactsEffectivelyDone && (historyIsTerminal || deadlinePassed);

        return res.status(200).json({
            success: true,
            account: {
                ...account,
                contactsEffectivelyDone,
                syncFinished,
                deadlinePassed,
            },
        });
    } catch (error) {
        console.error("GET COEXISTENCE STATUS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch sync status",
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
    getCoexistenceStatus,
};