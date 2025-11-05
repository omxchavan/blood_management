// routes/donation.js
const express = require("express");
const router = express.Router();
const {
  scheduleDonation,
  getDonations,
  updateDonationStatus,
  getDonationDetails,
} = require("../controllers/bloodDonation");
const authenticate = require("../middleware/auth");

// Optional auth middleware - doesn't redirect, just attaches user if present
const optionalAuth = async (req, res, next) => {
  try {
    const jwt = require("jsonwebtoken");
    const { User } = require("../model/user");
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key-change-this"
      );
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
        };
      }
    }
  } catch (err) {
    // Ignore auth errors for optional auth
  }
  next();
};


router.post("/schedule", optionalAuth, scheduleDonation);
router.get("/donation", authenticate, getDonations);
router.get("/:id", authenticate, getDonationDetails);
router.put("/:id/status", authenticate, updateDonationStatus);
router.post("/:id/status", authenticate, updateDonationStatus); // Support form submissions

module.exports = router;
