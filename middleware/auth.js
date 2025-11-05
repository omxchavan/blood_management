// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const { User } = require("../model/user"); // Adjust path as needed

// Secret key - MOVE THIS TO .env file in production
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Authentication middleware - verifies JWT token from cookie
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      // If the request is trying to access a page (not API), redirect to login
      if (req.path.startsWith("/api") || req.accepts("json")) {
        return res.status(401).json({
          success: false,
          message: "No token provided. Authentication required.",
        });
      }
      return res.redirect("/login");
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      if (req.path.startsWith("/api") || req.accepts("json")) {
        return res.status(401).json({
          success: false,
          message: "User not found.",
        });
      }
      return res.redirect("/login");
    }

    if (!user.isActive) {
      if (req.path.startsWith("/api") || req.accepts("json")) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated.",
        });
      }
      return res.redirect("/login?error=Account is deactivated");
    }

    // Attach user to request object
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      if (req.path.startsWith("/api") || req.accepts("json")) {
        return res.status(401).json({
          success: false,
          message: "Invalid token.",
        });
      }
      return res.redirect("/login?error=Invalid session");
    }
    if (error.name === "TokenExpiredError") {
      if (req.path.startsWith("/api") || req.accepts("json")) {
        return res.status(401).json({
          success: false,
          message: "Token expired.",
        });
      }
      return res.redirect("/login?error=Session expired");
    }

    if (req.path.startsWith("/api") || req.accepts("json")) {
      return res.status(500).json({
        success: false,
        message: "Authentication error.",
      });
    }
    return res.redirect("/login?error=Authentication error");
  }
};

module.exports = authenticate;
