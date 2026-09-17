const prisma = require("../config/prisma");

// ======================================================
// RECEIVE INTEGRATION WEBHOOK
// ======================================================

const receiveIntegrationWebhook = async (req, res) => {
    try {
        console.log("========================================");
        console.log("INTEGRATION WEBHOOK RECEIVED");
        console.log("========================================");

        // --------------------------------------------------
        // 1. READ INTEGRATION DETAILS
        // --------------------------------------------------

        const integrationId = Number(req.headers["x-integration-id"]);
        const webhookSecret = req.headers["x-webhook-secret"];

        console.log("Integration ID:", integrationId);

        if (!integrationId || !webhookSecret) {
            return res.status(401).json({
                success: false,
                message: "Integration ID and webhook secret are required",
            });
        }

        // --------------------------------------------------
        // 2. FIND INTEGRATION
        // --------------------------------------------------

        const integration = await prisma.integration.findUnique({
            where: {
                id: integrationId,
            },
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: "Integration not found",
            });
        }

        // --------------------------------------------------
        // 3. CHECK STATUS
        // --------------------------------------------------

        if (integration.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Integration is inactive",
            });
        }

        // --------------------------------------------------
        // 4. VERIFY WEBHOOK SECRET
        // --------------------------------------------------

        if (integration.webhookSecret !== webhookSecret) {
            return res.status(401).json({
                success: false,
                message: "Invalid webhook secret",
            });
        }

        console.log("Company ID:", integration.companyId);

        // --------------------------------------------------
        // 5. READ PAYLOAD
        // --------------------------------------------------

        const payload = req.body;

        console.log("Webhook payload:", payload);

        if (!payload || typeof payload !== "object") {
            return res.status(400).json({
                success: false,
                message: "Invalid webhook payload",
            });
        }

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

        // --------------------------------------------------
        // 7. CHECK DUPLICATE EVENT
        // --------------------------------------------------

        const existingEvent = await prisma.integrationEvent.findUnique({
            where: {
                integrationId_eventId: {
                    integrationId,
                    eventId,
                },
            },
        });

        if (existingEvent) {
            return res.status(200).json({
                success: true,
                message: "Webhook already processed",
                duplicate: true,
                eventId,
            });
        }

        // --------------------------------------------------
        // 8. SAVE INTEGRATION EVENT
        // --------------------------------------------------

        const integrationEvent =
            await prisma.integrationEvent.create({
                data: {
                    integrationId,
                    eventId,
                    eventType,
                    payload,
                    status: "RECEIVED",
                },
            });

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
            });
        }

        // --------------------------------------------------
        // 10. FIND ADMIN USER FOR THIS COMPANY
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
            });
        }

        console.log(
            "Admin user:",
            adminUser.id,
            adminUser.email
        );

        // --------------------------------------------------
        // 11. FIND EXISTING CUSTOMER
        // --------------------------------------------------

        const phone = String(customer.phone).trim();

        let existingCustomer =
            await prisma.customer.findFirst({
                where: {
                    companyId: integration.companyId,
                    phone,
                },
            });

        let crmCustomer;

        // --------------------------------------------------
        // 12. UPDATE EXISTING CUSTOMER
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
        // 13. CREATE NEW CUSTOMER
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
                            customer.name || "Unknown Customer",

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
        // 14. CREATE PURCHASE
        // --------------------------------------------------

        let purchase = null;

        if (order && order.orderId) {
            console.log("Creating purchase...");

            purchase = await prisma.purchase.create({
                data: {
                    companyId: integration.companyId,
                    customerId: crmCustomer.id,
                    integrationId: integration.id,

                    externalOrderId: String(order.orderId),

                    amount: Number(order.amount) || 0,

                    currency: order.currency || "INR",

                    status: "PAID",

                    purchaseDate: new Date(),

                    source: integration.name,
                },
            });

            console.log(
                "Purchase created:",
                purchase.id
            );
        }

        // --------------------------------------------------
        // 14. UPDATE INTEGRATION EVENT
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
        // 15. UPDATE INTEGRATION
        // --------------------------------------------------

        await prisma.integration.update({
            where: {
                id: integrationId,
            },
            data: {
                lastEventAt: new Date(),
            },
        });

        console.log("Webhook processing completed");
        console.log("Customer ID:", crmCustomer.id);
        console.log("========================================");

        return res.status(200).json({
            success: true,
            message:
                "Webhook processed successfully",

            eventId,

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
                    orderId: purchase.externalOrderId,
                    amount: purchase.amount,
                    currency: purchase.currency,
                    status: purchase.status,
                }
                : null,
        });
    } catch (error) {
        console.error(
            "Integration webhook error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to process integration webhook",
            error: error.message,
        });
    }
};

module.exports = {
    receiveIntegrationWebhook,
};