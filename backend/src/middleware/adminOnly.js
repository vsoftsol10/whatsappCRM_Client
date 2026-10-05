// Allows only users whose JWT role is ADMIN.
// Must be used AFTER authMiddleware (it relies on req.user).
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only an admin can perform this action",
    });
  }

  next();
};

module.exports = adminOnly;