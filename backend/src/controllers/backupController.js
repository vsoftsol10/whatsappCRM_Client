const fs = require("fs");
const prisma = require("../config/prisma");
const { createManualBackup } = require("../services/backupService");

//////////////////////////////////////////////////////
// CREATE MANUAL BACKUP
//////////////////////////////////////////////////////

const createBackup = async (req, res) => {
  try {
    // companyId MUST come from JWT
    const companyId = req.user.companyId;
    const createdById = req.user.userId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found",
      });
    }

    const result = await createManualBackup(
      companyId,
      createdById
    );

    return res.status(201).json({
      success: true,
      message: "CRM backup created successfully",
      backup: {
        id: result.backup.id,
        fileName: result.fileName,
        fileSize: result.size,
        status: result.backup.status,
        createdAt: result.backup.createdAt,
        completedAt: result.backup.completedAt,
      },
    });
  } catch (error) {
    console.error("Create backup error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create CRM backup",
      error: error.message,
    });
  }
};

//////////////////////////////////////////////////////
// LIST COMPANY BACKUPS
//////////////////////////////////////////////////////

const getBackups = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found",
      });
    }

    const backups = await prisma.backup.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        backupType: true,
        status: true,
        fileName: true,
        fileSize: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      backups: backups.map((backup) => ({
        ...backup,
        fileSize: backup.fileSize
          ? Number(backup.fileSize)
          : null,
      })),
    });
  } catch (error) {
    console.error("Get backups error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch backups",
    });
  }
};

//////////////////////////////////////////////////////
// DOWNLOAD BACKUP
//////////////////////////////////////////////////////

const downloadBackup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found",
      });
    }

    const backup = await prisma.backup.findFirst({
      where: {
        id,
        companyId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        fileName: true,
        storagePath: true,
        fileSize: true,
      },
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    if (!backup.storagePath) {
      return res.status(404).json({
        success: false,
        message: "Backup file is not available",
      });
    }

    if (!fs.existsSync(backup.storagePath)) {
      return res.status(404).json({
        success: false,
        message: "Backup file no longer exists",
      });
    }

    res.download(
      backup.storagePath,
      backup.fileName,
      (error) => {
        if (error) {
          console.error("Backup download error:", error);
        }
      }
    );
  } catch (error) {
    console.error("Download backup error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to download backup",
    });
  }
};

//////////////////////////////////////////////////////
// GET BACKUP DETAILS
//////////////////////////////////////////////////////

const getBackupById = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    const backup = await prisma.backup.findFirst({
      where: {
        id,
        companyId,
      },
      select: {
        id: true,
        companyId: true,
        createdById: true,
        backupType: true,
        status: true,
        fileName: true,
        fileSize: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    return res.json({
      success: true,
      backup: {
        ...backup,
        fileSize: backup.fileSize
          ? Number(backup.fileSize)
          : null,
      },
    });
  } catch (error) {
    console.error("Get backup error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch backup",
    });
  }
};

module.exports = {
  createBackup,
  getBackups,
  getBackupById,
  downloadBackup,
};