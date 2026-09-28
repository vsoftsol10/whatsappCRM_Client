const prisma = require("../config/prisma");
const uploadToCloudinary = require("../utils/cloudinaryUplode");
const { logAction } = require("../services/auditLogService");

// Builds a readable reason from any thrown error (Prisma, Cloudinary, etc.)
// so it can be logged in the backend terminal AND shown in the UI toast.
const getErrorReason = (error) => {
  if (!error) return "Unknown error";

  // Cloudinary errors are often plain objects: { message, http_code }
  const message = error.message || error.error?.message || String(error);

  // Prisma errors carry a code (e.g. P2022 = column does not exist)
  return error.code ? `[${error.code}] ${message}` : message;
};

// ========================
// GET COMPANY BRANDING
// (Any authenticated CRM user — admin or employee — can read
//  this. Used to render the company name/logo in the sidebar.)
// ========================
const getCompanySettings = async (req, res) => {
  console.log("GET /api/company/settings called by:", {
    userId: req.user?.userId,
    companyId: req.user?.companyId,
    role: req.user?.role,
  });

  try {
    const company = await prisma.company.findUnique({
      where: {
        id: req.user.companyId,
      },
      select: {
        id: true,
        companyId: true,
        companyName: true,
        logo: true,
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("GET COMPANY SETTINGS ERROR:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: `Failed to fetch company settings: ${getErrorReason(error)}`,
    });
  }
};

// ========================
// UPDATE COMPANY BRANDING
// (Admin only — updates the company display name and/or logo.
//  Employees are blocked here; the route itself is open to any
//  authenticated user so the frontend can surface a clean 403
//  instead of a generic auth failure.)
// ========================
const updateCompanySettings = async (req, res) => {
  console.log("PUT /api/company/settings called by:", {
    userId: req.user?.userId,
    companyId: req.user?.companyId,
    role: req.user?.role,
    body: req.body,
    hasFile: !!req.file,
    fileType: req.file?.mimetype,
    fileSize: req.file?.size,
  });

  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only the company admin can update company branding",
      });
    }

    const { companyName } = req.body;

    const existingCompany = await prisma.company.findUnique({
      where: {
        id: req.user.companyId,
      },
    });

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const data = {};

    if (companyName !== undefined) {
      if (!String(companyName).trim()) {
        return res.status(400).json({
          success: false,
          message: "Company name is required",
        });
      }

      data.companyName = String(companyName).trim();
    }

    // Optional logo upload
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "company-logos"
      );

      data.logo = result.secure_url;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const updatedCompany = await prisma.company.update({
      where: {
        id: existingCompany.id,
      },
      data,
      select: {
        id: true,
        companyId: true,
        companyName: true,
        logo: true,
      },
    });

    logAction({
      req,
      action: "UPDATE",
      module: "COMPANY",
      entityId: updatedCompany.id,
      entityName: updatedCompany.companyName,
      changes: {
        before: {
          companyName: existingCompany.companyName,
          logo: existingCompany.logo,
        },
        after: {
          companyName: updatedCompany.companyName,
          logo: updatedCompany.logo,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Company branding updated successfully",
      company: updatedCompany,
    });
  } catch (error) {
    console.error("UPDATE COMPANY SETTINGS ERROR:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: `Failed to update company branding: ${getErrorReason(error)}`,
    });
  }
};

module.exports = {
  getCompanySettings,
  updateCompanySettings,
};