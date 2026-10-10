const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 2. Format: "Bearer token"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // 3. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    if (!decoded.userId || !decoded.companyId) {
      return res.status(401).json({
        message: "Invalid user token"
      });
    }

    // 4. Make sure the user still exists and is still allowed in.
    //    (A valid token alone is not enough: the employee may have been
    //    deleted or set to INACTIVE after the token was issued.)
    //
    //    NOTE: company status (ACTIVE / INACTIVE / EXPIRED) is NOT checked
    //    here on purpose. Expired companies can still log in and VIEW their
    //    data; writes are blocked separately by allowWriteAccess.
    let dbUser;

    try {
      dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          companyId: true,
          role: true,
          status: true,
        },
      });
    } catch (dbError) {
      // Database problem - do NOT answer 401, otherwise every user would be
      // logged out by the frontend during a short database outage.
      console.error("authMiddleware user lookup failed:", dbError);

      return res.status(503).json({
        message: "Service temporarily unavailable. Please try again.",
      });
    }

    if (!dbUser || Number(dbUser.companyId) !== Number(decoded.companyId)) {
      return res.status(401).json({
        message: "Account no longer exists",
      });
    }

    if (dbUser.status === "INACTIVE") {
      return res.status(401).json({
        message: "Your account is inactive. Please contact your administrator.",
      });
    }

    // Attach user to request.
    // Role comes from the database so a demoted admin loses admin rights
    // immediately instead of keeping them until the token expires.
    req.user = { ...decoded, role: dbUser.role };

    next();

  } catch (error) {
    console.log(error);

    return res.status(401).json({
      message: error.message,
    });
  }
};

module.exports = authMiddleware;