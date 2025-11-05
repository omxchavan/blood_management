const express = require("express");
const authenticate = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const { User } = require("../model/user");
const {
  getHospitalDashboard,
  getBloodBankDashboard,
} = require("../controllers/dashboard");
const router = express.Router();

// Optional auth middleware - doesn't redirect, just attaches user if present
const optionalAuth = async (req, res, next) => {
  try {
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

// Public pages with optional authentication
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { bloodBank } = require("../model/bloodBank");
    // Fetch all blood banks for the donation form
    const bloodBanks = await bloodBank.find().sort({ name: 1 });
    
    const message = req.query.message || null;
    const error = req.query.error || null;
    res.render("home", {
      user: req.user || null,
      message: message,
      error: error,
      bloodBanks: bloodBanks,
    }); // home.ejs - shows role-based content with donation form
  } catch (err) {
    console.error("Error loading home page:", err);
    const error = req.query.error || null;
    res.render("home", {
      user: req.user || null,
      message: null,
      error: error || "Unable to load some data",
      bloodBanks: [],
    });
  }
});

router.get("/login", (req, res) => {
  // Get error from query parameter if exists
  const error = req.query.error || null;
  res.render("login", { error }); // login.ejs
});

router.get("/register", (req, res) => {
  // Get error from query parameter if exists
  const error = req.query.error || null;
  res.render("register-new", { error }); // register-new.ejs with comprehensive forms
});

// Hospital Dashboard (protected, ideally requires auth middleware)
router.get("/hospital-dashboard", authenticate, getHospitalDashboard);

// Blood Bank Dashboard (protected, ideally requires auth middleware)
router.get("/bloodbank-dashboard", authenticate, getBloodBankDashboard);


// Profile Page (role-based)
router.get("/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "bloodbank") {
      const { bloodBank } = require("../model/bloodBank");
      const bank = await bloodBank.findById(userId);

      if (!bank) {
        return res.redirect("/?error=Blood bank profile not found");
      }

      return res.render("profile-bloodbank", {
        user: req.user,
        bank: bank,
      });
    } else if (role === "hospital") {
      const { Hospital } = require("../model/hospital");
      const hospital = await Hospital.findById(userId);

      if (!hospital) {
        return res.redirect("/?error=Hospital profile not found");
      }

      return res.render("profile-hospital", {
        user: req.user,
        hospital: hospital,
      });
    } else if (role === "donor") {
      const { Donor } = require("../model/donor");
      const donor = await Donor.findOne({ _id: userId });

      return res.render("profile-donor", {
        user: req.user,
        donor: donor, // Can be null if not created yet
      });
    } else {
      return res.redirect("/?error=Invalid user role");
    }
  } catch (err) {
    console.error("Error loading profile:", err);
    res.redirect("/?error=Unable to load profile");
  }
});


module.exports = router;
