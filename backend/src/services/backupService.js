const prisma = require("../config/prisma");
const fs = require("fs");
const path = require("path");
const { buildBackupExcelBuffer } = require("./backupExcelService");

/**
 * Create a manual CRM backup for one company.
 *
 * IMPORTANT:
 * - companyId always comes from the authenticated user.
 * - Never accept companyId from the frontend.
 * - Sensitive credentials/tokens are intentionally excluded.
 */
const createManualBackup = async (companyId, createdById) => {
    const startedAt = new Date();

    // =====================================================
    // CREATE BACKUP RECORD
    // =====================================================

    const backup = await prisma.backup.create({
        data: {
            companyId,
            createdById,
            backupType: "MANUAL",
            status: "IN_PROGRESS",
            startedAt,
        },
    });

    // Declared here (not inside try) so the catch block can delete
    // a half-written file if the backup fails.
    let excelPath = null;

    try {
        // =====================================================
        // 1. COMPANY
        // =====================================================

        const company = await prisma.company.findUnique({
            where: {
                id: companyId,
            },

            select: {
                id: true,
                companyId: true,
                companyName: true,
                ownerName: true,
                email: true,
                phone: true,
                address: true,
                plan: true,
                status: true,
                expiryDate: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!company) {
            throw new Error("Company not found");
        }

        // =====================================================
        // 2. USERS
        // =====================================================

        // Password, resetToken and resetTokenExpiry
        // are intentionally NOT included.

        const users = await prisma.user.findMany({
            where: {
                companyId,
            },

            select: {
                id: true,
                companyId: true,
                name: true,
                email: true,
                role: true,
                isFirstLogin: true,
                address: true,
                department: true,
                designation: true,
                phone: true,
                profileImage: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // =====================================================
        // 3. WHATSAPP ACCOUNTS
        // =====================================================

        // WhatsApp accessToken is intentionally NOT included.

        const whatsappAccounts =
            await prisma.whatsAppAccount.findMany({
                where: {
                    companyId,
                },

                select: {
                    id: true,
                    companyId: true,
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

        // =====================================================
        // 4. CUSTOMERS
        // =====================================================

        const customers = await prisma.customer.findMany({
            where: {
                companyId,
            },

            select: {
                id: true,
                companyId: true,
                name: true,
                phone: true,
                email: true,
                companyName: true,
                status: true,
                userId: true,
                requirements: true,
                source: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // =====================================================
        // 5. CONVERSATIONS
        // =====================================================

        const conversations =
            await prisma.conversation.findMany({
                where: {
                    companyId,
                },

                select: {
                    id: true,
                    companyId: true,
                    customerId: true,
                    whatsappAccountId: true,
                    phone: true,
                    contactName: true,
                    status: true,
                    channel: true,
                    lastMessage: true,
                    unreadCount: true,
                    welcomeSent: true,
                    botEnabled: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        // =====================================================
        // 6. MESSAGES
        // =====================================================

        // Message does not have companyId directly.
        // Scope it through conversation.companyId.

        const messages = await prisma.message.findMany({
            where: {
                conversation: {
                    companyId,
                },
            },

            select: {
                id: true,
                conversationId: true,
                content: true,
                sender: true,
                messageType: true,
                status: true,
                imageUrl: true,
                metaMessageId: true,
                failureReason: true,
                isEdited: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // =====================================================
        // 7. CAMPAIGNS
        // =====================================================

        const campaigns = await prisma.campaign.findMany({
            where: {
                companyId,
            },

            select: {
                id: true,
                companyId: true,
                whatsappAccountId: true,
                name: true,
                type: true,
                templateId: true,
                messageContent: true,
                status: true,
                audienceCount: true,
                scheduledAt: true,
                startedAt: true,
                completedAt: true,
                totalRecipients: true,
                sentCount: true,
                deliveredCount: true,
                readCount: true,
                failedCount: true,
                imageUrl: true,
                createdById: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // =====================================================
        // 8. CAMPAIGN RECIPIENTS
        // =====================================================

        const campaignRecipients =
            await prisma.campaignRecipient.findMany({
                where: {
                    campaign: {
                        companyId,
                    },
                },

                select: {
                    id: true,
                    campaignId: true,
                    customerId: true,
                    status: true,
                    whatsappMessageId: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                    failedAt: true,
                    failureReason: true,
                    createdAt: true,
                },
            });

        // =====================================================
        // 9. TEMPLATES
        // =====================================================

        const templates = await prisma.template.findMany({
            where: {
                companyId,
            },

            select: {
                id: true,
                companyId: true,
                whatsappAccountId: true,
                name: true,
                language: true,
                category: true,
                messageType: true,
                content: true,
                headerType: true,
                headerContent: true,
                footerContent: true,
                status: true,
                purpose: true,
                autoSend: true,
                metaTemplateId: true,
                rejectionReason: true,
                createdById: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // =====================================================
        // 10. TEMPLATE RECIPIENTS
        // =====================================================

        const templateRecipients =
            await prisma.templateRecipient.findMany({
                where: {
                    template: {
                        companyId,
                    },
                },

                select: {
                    id: true,
                    templateId: true,
                    customerId: true,
                    status: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                    metaMessageId: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        // =====================================================
        // 11. LEADS
        // =====================================================

        const leads = await prisma.lead.findMany({
            where: {
                companyId,
            },

            select: {
                id: true,
                companyId: true,
                name: true,
                phone: true,
                email: true,
                companyName: true,
                source: true,
                requirements: true,
                status: true,
                isConverted: true,
                assignedToId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // =====================================================
        // 12. LEAD WORK NOTES
        // =====================================================

        const leadWorkNotes =
            await prisma.leadWorkNote.findMany({
                where: {
                    lead: {
                        companyId,
                    },
                },

                select: {
                    id: true,
                    leadId: true,
                    employeeId: true,
                    note: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        // =====================================================
        // 13. DEALS
        // =====================================================

        const deals = await prisma.deal.findMany({
            where: {
                companyId,
            },

            select: {
                id: true,
                companyId: true,
                title: true,
                description: true,
                value: true,
                stage: true,
                customerId: true,
                createdById: true,
                assignedToId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // =====================================================
        // 14. DEAL ACTIVITIES
        // =====================================================

        const dealActivities =
            await prisma.dealActivity.findMany({
                where: {
                    deal: {
                        companyId,
                    },
                },

                select: {
                    id: true,
                    dealId: true,
                    type: true,
                    note: true,
                    createdById: true,
                    createdAt: true,
                },
            });

        // =====================================================
        // 15. TASKS
        // =====================================================

        const tasks = await prisma.task.findMany({
            where: {
                companyId,
            },

            select: {
                id: true,
                companyId: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
                createdById: true,
                assignedToId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // =====================================================
        // 16. TASK WORK NOTES
        // =====================================================

        const taskWorkNotes =
            await prisma.taskWorkNote.findMany({
                where: {
                    task: {
                        companyId,
                    },
                },

                select: {
                    id: true,
                    taskId: true,
                    employeeId: true,
                    note: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        // =====================================================
        // 17. TICKETS
        // =====================================================

        const tickets = await prisma.ticket.findMany({
            where: {
                companyId,
            },

            select: {
                id: true,
                companyId: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                customerId: true,
                createdById: true,
                assignedToId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // =====================================================
        // 18. TICKET WORK NOTES
        // =====================================================

        const ticketWorkNotes =
            await prisma.ticketWorkNote.findMany({
                where: {
                    ticket: {
                        companyId,
                    },
                },

                select: {
                    id: true,
                    ticketId: true,
                    employeeId: true,
                    note: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        // =====================================================
        // 19. USER NOTIFICATIONS
        // =====================================================

        const userNotifications =
            await prisma.userNotification.findMany({
                where: {
                    user: {
                        companyId,
                    },
                },

                select: {
                    id: true,
                    userId: true,
                    title: true,
                    message: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                },
            });

        // =====================================================
        // 20. CRM AUDIT LOGS
        // =====================================================

        const crmAuditLogs =
            await prisma.crmAuditLog.findMany({
                where: {
                    companyId,
                },

                select: {
                    id: true,
                    companyId: true,
                    userId: true,
                    userName: true,
                    userRole: true,
                    action: true,
                    module: true,
                    entityId: true,
                    entityName: true,
                    changes: true,
                    ipAddress: true,
                    userAgent: true,
                    createdAt: true,
                },
            });

        // =====================================================
        // 21. BUILD EXCEL FILE
        // =====================================================
        // The backup is saved ONLY as a readable Excel (.xlsx) file.
        // No ZIP and no JSON files are created.

        const excelBuffer = buildBackupExcelBuffer({
            company,
            users,
            whatsappAccounts,
            customers,
            conversations,
            messages,
            campaigns,
            campaignRecipients,
            templates,
            templateRecipients,
            leads,
            leadWorkNotes,
            deals,
            dealActivities,
            tasks,
            taskWorkNotes,
            tickets,
            ticketWorkNotes,
            userNotifications,
            crmAuditLogs,
            backupCreatedAt: new Date().toISOString(),
        });

        // =====================================================
        // 22. SAVE EXCEL FILE
        // =====================================================

        const backupDirectory = path.join(
            process.cwd(),
            "backups"
        );

        if (!fs.existsSync(backupDirectory)) {
            fs.mkdirSync(backupDirectory, {
                recursive: true,
            });
        }

        const fileName =
            `vatup-backup-${company.companyId}-${Date.now()}.xlsx`;

        excelPath = path.join(
            backupDirectory,
            fileName
        );

        fs.writeFileSync(excelPath, excelBuffer);

        // =====================================================
        // 23. CHECK EXCEL FILE
        // =====================================================

        if (!fs.existsSync(excelPath)) {
            throw new Error(
                "Backup Excel file was not created"
            );
        }

        const stats = fs.statSync(excelPath);

        if (stats.size === 0) {
            throw new Error(
                "Backup Excel file is empty"
            );
        }

        // =====================================================
        // 25. UPDATE BACKUP RECORD
        // =====================================================

        const completedAt = new Date();

        const completedBackup =
            await prisma.backup.update({
                where: {
                    id: backup.id,
                },

                data: {
                    status: "COMPLETED",
                    fileName,
                    storagePath: excelPath,
                    fileSize: BigInt(stats.size),
                    completedAt,
                },
            });

        // =====================================================
        // 26. SUCCESS LOG
        // =====================================================

        console.log(
            "=========================================="
        );

        console.log(
            "CRM BACKUP COMPLETED"
        );

        console.log(
            `Company: ${company.companyId}`
        );

        console.log(
            `File: ${fileName}`
        );

        console.log(
            `Size: ${stats.size} bytes`
        );

        console.log(
            `Path: ${excelPath}`
        );

        console.log(
            "=========================================="
        );

        // =====================================================
        // RETURN
        // =====================================================

        return {
            backup: completedBackup,
            filePath: excelPath,
            fileName,
            size: stats.size,
        };
    } catch (error) {
        // =====================================================
        // BACKUP FAILED
        // =====================================================

        console.error(
            "CRM Backup Failed:",
            error
        );

        // ---------------------------------------------
        // Remove partially-created Excel file if it exists
        // ---------------------------------------------

        try {
            if (excelPath && fs.existsSync(excelPath)) {
                fs.unlinkSync(excelPath);
            }
        } catch (fileError) {
            console.error(
                "Failed to remove incomplete backup file:",
                fileError
            );
        }

        // ---------------------------------------------
        // Update database status
        // ---------------------------------------------

        try {
            await prisma.backup.update({
                where: {
                    id: backup.id,
                },

                data: {
                    status: "FAILED",
                    errorMessage: error.message,
                    completedAt: new Date(),
                },
            });
        } catch (updateError) {
            console.error(
                "Failed to update backup status:",
                updateError
            );
        }

        throw error;
    }
};

module.exports = {
    createManualBackup,
};