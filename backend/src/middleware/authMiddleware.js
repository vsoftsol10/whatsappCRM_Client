
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
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


    // Attach user to request
    req.user = decoded;

    next();

  } catch (error) {
    console.log(error);

    return res.status(401).json({
      message: error.message,
    });
  }
};

module.exports = authMiddleware;