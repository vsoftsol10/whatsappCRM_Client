const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendPasswordResetEmail = require("../services/passwordResetEmail");
const { logAction, logDirect } = require("../services/auditLogService");

// ========================
// REGISTER USER
// ========================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ========================
// LOGIN USER
// ========================
const loginUser = async (req, res) => {
  try {

    console.log("LOGIN API CALLED");
    console.log(req.body);

    const { email, password, companyId } = req.body;

    const users = await prisma.user.findMany({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        company: true,
      },
    });

    console.log("USERS FOUND:", users.length);

    if (users.length === 0) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    let user = null;

    for (const candidate of users) {
      const isPasswordValid = await bcrypt.compare(
        password,
        candidate.password
      );

      if (isPasswordValid) {
        user = candidate;
        break;
      }
    }

    console.log("MATCHED USER:", user);

    if (!user) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    console.log("LOGIN COMPANY:", {
      id: user.company?.id,
      companyId: user.company?.companyId,
      companyName: user.company?.companyName,
    });

    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // First login check
    if (user.isFirstLogin) {
      logDirect({
        req,
        companyId: user.companyId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_CHANGE",
        module: "USER",
        entityId: user.id,
        entityName: user.name,
        changes: { after: { event: "LOGIN", firstLogin: true } },
      });

      return res.status(200).json({
        message: "First login detected",
        forcePasswordChange: true,
        token,
        companyStatus: user.company.status,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          companyStatus: user.company?.status,
          expiryDate: user.company?.expiryDate,
        },
      });
    }

    logDirect({
      req,
      companyId: user.companyId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "STATUS_CHANGE",
      module: "USER",
      entityId: user.id,
      entityName: user.name,
      changes: { after: { event: "LOGIN" } },
    });

    return res.status(200).json({
      message: "Login successful",
      forcePasswordChange: false,
      token,
      companyStatus: user.company.status,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyStatus: user.company?.status,
        expiryDate: user.company?.expiryDate,
      },
    });
  } catch (error) {

    console.error("LOGIN ERROR:");
    console.error(error);
    console.error(error.stack);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// ========================
// GET CURRENT USER
// ========================
const getMe = async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    console.log("========== ALL USERS ==========");
    console.table(
      users.map((u) => ({
        email: u.email,
        role: u.role,
      }))
    );

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
    });

    console.log("FOUND USER:", user);
    console.log("FOUND USER:", user);


    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }



    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ========================
// CHANGE PASSWORD
// ========================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log("========== CHANGE PASSWORD ==========");
    console.log("User ID:", req.user.userId);
    console.log("Current password received:", !!currentPassword);
    console.log("New password received:", !!newPassword);

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    // Optional but recommended
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    // Get logged-in user
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    console.log("Password Match:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // Update password
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        isFirstLogin: false,
      },
    });

    console.log("Password updated successfully");

    logAction({
      req,
      action: "UPDATE",
      module: "USER",
      entityId: user.id,
      entityName: user.name,
      changes: { after: { event: "PASSWORD_CHANGED" } },
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:");
    console.error(error);
    console.error(error.stack);

    return res.status(500).json({
      message: "Failed to change password",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find all users with this email
    const users = await prisma.user.findMany({
      where: {
        email: normalizedEmail,
      },
      include: {
        company: true,
      },
    });

    console.log("FORGOT PASSWORD EMAIL:", normalizedEmail);
    console.log(
      "USERS FOUND:",
      users.map((u) => ({
        id: u.id,
        email: u.email,
        companyId: u.companyId,
        companyCode: u.company?.companyId,
        companyName: u.company?.companyName,
      }))
    );

    // No account found
    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Same email exists in multiple companies
    if (users.length > 1) {
      return res.status(400).json({
        message:
          "Multiple accounts are registered with this email. Please contact your company administrator.",
      });
    }

    // Exactly one user
    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenExpiry = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const resetLink =
      `http://localhost:5173/reset-password/${resetToken}`;

    await sendPasswordResetEmail(
      normalizedEmail,
      resetLink
    );

    return res.status(200).json({
      message: "Password reset email sent successfully",
    });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:");
    console.error(error);
    console.error(error.stack);

    return res.status(500).json({
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        isFirstLogin: false,
      },
    });

    return res.status(200).json({
      message: "Password reset successful",
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ========================
// EXPORTS
// ========================
module.exports = {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};