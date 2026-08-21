const prisma = require("../config/prisma");

const allowWriteAccess = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: {
        id: req.user.companyId
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Allow only ACTIVE and TRIAL companies
    if (
      company.status !== "ACTIVE" &&
      company.status !== "TRIAL"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your subscription is inactive or expired. You can view your data, but you cannot create, update, or delete records."
      });
    }

    // Extra safety
    if (company.expiryDate < new Date()) {
      return res.status(403).json({
        success: false,
        message:
          "Your subscription has expired. Please renew your subscription."
      });
    }

    next();
  } catch (error) {
  console.error("allowWriteAccess Error:", error);

  return res.status(500).json({
    success: false,
    message: error.message
  });
}
};

module.exports = allowWriteAccess;