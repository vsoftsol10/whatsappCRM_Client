const prisma = require("../config/prisma");

// ======================================================
// RECEIVE INTEGRATION WEBHOOK
// ======================================================
//
// External systems call:
//
// POST /api/integrations/webhook/:webhookKey
//
// Example:
//
// POST /api/integrations/webhook/8f7c2a1b9e...
//
// The webhookKey identifies the Integration.
//
// IMPORTANT:
// We do NOT trust companyId from the webhook payload.
// The companyId always comes from the Integration record.
// ======================================================

const receiveIntegrationWebhook = async (req, res) => {
    let integrationEventId = null;

    try {
        console.log("========================================");
        console.log("INTEGRATION WEBHOOK RECEIVED");
        console.log("========================================");

        // --------------------------------------------------
        // 1. READ WEBHOOK KEY FROM URL
        // --------------------------------------------------

        const { webhookKey } = req.params;

        console.log("Webhook Key received:", webhookKey);

        if (!webhookKey) {
            return res.status(401).json({
                success: false,
                message: "Webhook key is required",
            });
        }

        // --------------------------------------------------
        // 2. FIND INTEGRATION USING WEBHOOK KEY
        // --------------------------------------------------
        //
        // This identifies:
        //
        // webhookKey
        //      ↓
        // Integration
        //      ↓
        // companyId
        //
        // We do NOT take companyId from the external system.
        // --------------------------------------------------

        const integration = await prisma.integration.findUnique({
            where: {
                webhookKey,
            },
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: "Integration not found",
            });
        }

        console.log("Integration ID:", integration.id);
        console.log("Integration Name:", integration.name);
        console.log("Provider:", integration.provider);
        console.log("Company ID:", integration.companyId);

        // --------------------------------------------------
        // 3. CHECK INTEGRATION STATUS
        // --------------------------------------------------

        if (integration.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Integration is inactive",
            });
        }

        // --------------------------------------------------
        // 4. READ WEBHOOK PAYLOAD
        // --------------------------------------------------

        const payload = req.body;

        console.log("Webhook payload:", payload);

        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid webhook payload",
            });
        }

        // --------------------------------------------------
        // 5. READ COMMON EVENT INFORMATION
        // --------------------------------------------------
        //
        // For our generic/custom webhook we expect:
        //
        // {
        //   eventId: "...",
        //   eventType: "...",
        //   customer: {...},
        //   order: {...}
        // }
        //
        // Later, provider adapters will convert
        // Square / Shopify / other payloads into this
        // common format.
        // --------------------------------------------------

        const {
            eventId,
            eventType,
            customer,
            order,
        } = payload;

        // --------------------------------------------------
        // 6. VALIDATE EVENT
        // --------------------------------------------------

        if (!eventId || !eventType) {
            return res.status(400).json({
                success: false,
                message: "eventId and eventType are required",
            });
        }

        // Convert eventId to string so different providers
        // can safely send numeric/string IDs.
        const normalizedEventId = String(eventId);

        const normalizedEventType = String(eventType);

        // --------------------------------------------------
        // 7. CHECK DUPLICATE EVENT
        // --------------------------------------------------
        //
        // Duplicate protection is scoped to the Integration.
        //
        // Integration 1 + EVENT-001
        //
        // is different from:
        //
        // Integration 2 + EVENT-001
        // --------------------------------------------------

        const existingEvent =
            await prisma.integrationEvent.findUnique({
                where: {
                    integrationId_eventId: {
                        integrationId: integration.id,
                        eventId: normalizedEventId,
                    },
                },
            });

        if (existingEvent) {
            console.log(
                "Duplicate webhook event:",
                normalizedEventId
            );

            return res.status(200).json({
                success: true,
                message: "Webhook already processed",
                duplicate: true,
                eventId: normalizedEventId,
                integrationEventId: existingEvent.id,
            });
        }

        // --------------------------------------------------
        // 8. SAVE INTEGRATION EVENT
        // --------------------------------------------------

        const integrationEvent =
            await prisma.integrationEvent.create({
                data: {
                    integrationId: integration.id,
                    eventId: normalizedEventId,
                    eventType: normalizedEventType,
                    payload,
                    status: "RECEIVED",
                },
            });

        integrationEventId = integrationEvent.id;

        console.log(
            "Integration event saved:",
            integrationEvent.id
        );

        // --------------------------------------------------
        // 9. VALIDATE CUSTOMER DATA
        // --------------------------------------------------

        if (!customer || !customer.phone) {
            await prisma.integrationEvent.update({
                where: {
                    id: integrationEvent.id,
                },
                data: {
                    status: "FAILED",
                    errorMessage:
                        "Customer phone is required",
                },
            });

            return res.status(400).json({
                success: false,
                message: "Customer phone is required",
                integrationEventId:
                    integrationEvent.id,
            });
        }

        // --------------------------------------------------
        // 10. NORMALIZE CUSTOMER DATA
        // --------------------------------------------------

        const phone = String(customer.phone).trim();

        if (!phone) {
            await prisma.integrationEvent.update({
                where: {
                    id: integrationEvent.id,
                },
                data: {
                    status: "FAILED",
                    errorMessage:
                        "Customer phone cannot be empty",
                },
            });

            return res.status(400).json({
                success: false,
                message:
                    "Customer phone cannot be empty",
                integrationEventId:
                    integrationEvent.id,
            });
        }

        // --------------------------------------------------
        // 11. FIND ADMIN USER FOR THIS COMPANY
        // --------------------------------------------------

        const adminUser = await prisma.user.findFirst({
            where: {
                companyId: integration.companyId,
                role: "ADMIN",
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (!adminUser) {
            await prisma.integrationEvent.update({
                where: {
                    id: integrationEvent.id,
                },
                data: {
                    status: "FAILED",
                    errorMessage:
                        "No ADMIN user found for this company",
                },
            });

            return res.status(400).json({
                success: false,
                message:
                    "No ADMIN user found for this company",
                integrationEventId:
                    integrationEvent.id,
            });
        }

        console.log(
            "Admin user:",
            adminUser.id,
            adminUser.email
        );

        // --------------------------------------------------
        // 12. FIND EXISTING CUSTOMER
        // --------------------------------------------------
        //
        // IMPORTANT:
        // Customer search is always restricted to the
        // integration's company.
        //
        // This prevents one company from accessing another
        // company's customers.
        // --------------------------------------------------

        let existingCustomer =
            await prisma.customer.findFirst({
                where: {
                    companyId: integration.companyId,
                    phone,
                },
            });

        let crmCustomer;

        // --------------------------------------------------
        // 13. UPDATE EXISTING CUSTOMER
        // --------------------------------------------------

        if (existingCustomer) {
            console.log(
                "Existing customer found:",
                existingCustomer.id
            );

            crmCustomer =
                await prisma.customer.update({
                    where: {
                        id: existingCustomer.id,
                    },
                    data: {
                        name:
                            customer.name ||
                            existingCustomer.name,

                        email:
                            customer.email ||
                            existingCustomer.email,

                        source:
                            existingCustomer.source ||
                            integration.name,
                    },
                });

            console.log(
                "Existing customer updated:",
                crmCustomer.id
            );
        }

        // --------------------------------------------------
        // 14. CREATE NEW CUSTOMER
        // --------------------------------------------------

        else {
            console.log(
                "Customer not found. Creating new customer..."
            );

            crmCustomer =
                await prisma.customer.create({
                    data: {
                        companyId: integration.companyId,
                        userId: adminUser.id,

                        name:
                            customer.name ||
                            "Unknown Customer",

                        phone,

                        email:
                            customer.email || null,

                        source: integration.name,

                        status: "ACTIVE",
                    },
                });

            console.log(
                "New customer created:",
                crmCustomer.id
            );
        }

        // --------------------------------------------------
        // 15. CREATE PURCHASE
        // --------------------------------------------------

        let purchase = null;

        if (order && order.orderId) {
            console.log("Creating purchase...");

            purchase =
                await prisma.purchase.create({
                    data: {
                        companyId:
                            integration.companyId,

                        customerId:
                            crmCustomer.id,

                        integrationId:
                            integration.id,

                        externalOrderId:
                            String(order.orderId),

                        amount:
                            Number(order.amount) || 0,

                        currency:
                            order.currency || "INR",

                        status: "PAID",

                        purchaseDate:
                            order.purchaseDate
                                ? new Date(
                                    order.purchaseDate
                                )
                                : new Date(),

                        source:
                            integration.name,
                    },
                });

            console.log(
                "Purchase created:",
                purchase.id
            );
        } else {
            console.log(
                "No order information. Purchase not created."
            );
        }

        // --------------------------------------------------
        // 16. UPDATE INTEGRATION EVENT
        // --------------------------------------------------

        await prisma.integrationEvent.update({
            where: {
                id: integrationEvent.id,
            },
            data: {
                status: "PROCESSED",
                processedAt: new Date(),
            },
        });

        // --------------------------------------------------
        // 17. UPDATE INTEGRATION LAST EVENT TIME
        // --------------------------------------------------

        await prisma.integration.update({
            where: {
                id: integration.id,
            },
            data: {
                lastEventAt: new Date(),
            },
        });

        console.log(
            "Webhook processing completed"
        );

        console.log(
            "Customer ID:",
            crmCustomer.id
        );

        console.log("========================================");

        // --------------------------------------------------
        // 18. SUCCESS RESPONSE
        // --------------------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Webhook processed successfully",

            eventId:
                normalizedEventId,

            integrationId:
                integration.id,

            integrationEventId:
                integrationEvent.id,

            customer: {
                id: crmCustomer.id,
                name: crmCustomer.name,
                phone: crmCustomer.phone,
                email: crmCustomer.email,
            },

            purchase: purchase
                ? {
                    id: purchase.id,
                    orderId:
                        purchase.externalOrderId,
                    amount:
                        purchase.amount,
                    currency:
                        purchase.currency,
                    status:
                        purchase.status,
                }
                : null,
        });
    } catch (error) {
        console.error(
            "Integration webhook error:",
            error
        );

        // --------------------------------------------------
        // MARK SAVED EVENT AS FAILED
        // --------------------------------------------------

        if (integrationEventId) {
            try {
                await prisma.integrationEvent.update({
                    where: {
                        id: integrationEventId,
                    },
                    data: {
                        status: "FAILED",
                        errorMessage:
                            error.message ||
                            "Unknown webhook processing error",
                    },
                });
            } catch (updateError) {
                console.error(
                    "Failed to update integration event:",
                    updateError
                );
            }
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to process integration webhook",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

module.exports = {
    receiveIntegrationWebhook,
};