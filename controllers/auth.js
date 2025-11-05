// controllers/auth.js
const { User } = require("../model/user");
const { bloodBank } = require("../model/bloodBank");
const { Hospital } = require("../model/hospital");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role: role }, JWT_SECRET, { expiresIn: "7d" });
};

// Register/Sign up
async function register(req, res) {
  try {
    const { 
      email, 
      password, 
      role,
      name,
      registrationNumber,
      phone,
      contactEmail,
      street,
      city,
      state,
      pincode,
      openTime,
      closeTime,
      emergencyContact
    } = req.body;

    // Basic validation
    if (!email || !password || !role) {
      return res.render("register-new", {
        error: "Please provide email, password, and role",
      });
    }

    // Check if role is valid
    const validRoles = ["donor", "bloodbank", "hospital", "admin"];
    if (!validRoles.includes(role)) {
      return res.render("register-new", { error: "Invalid role selected" });
    }

    // Role-specific validation
    if (role === "bloodbank" && (!name || !registrationNumber || !phone || !street || !city || !state || !pincode)) {
      return res.render("register-new", {
        error: "Please fill all required blood bank information",
      });
    }

    if (role === "hospital" && (!name || !registrationNumber || !phone || !emergencyContact || !street || !city || !state || !pincode)) {
      return res.render("register-new", {
        error: "Please fill all required hospital information",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register-new", {
        error: "User with this email already exists",
      });
    }

    // Check if registration number already exists for blood banks and hospitals
    if (role === "bloodbank" && registrationNumber) {
      const existingBank = await bloodBank.findOne({ registrationNumber });
      if (existingBank) {
        return res.render("register-new", {
          error: "Blood bank with this registration number already exists",
        });
      }
    }

    if (role === "hospital" && registrationNumber) {
      const existingHospital = await Hospital.findOne({ registrationNumber });
      if (existingHospital) {
        return res.render("register-new", {
          error: "Hospital with this registration number already exists",
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role,
    });

    // Create role-specific profile
    if (role === "bloodbank") {
      // Create blood bank profile
      const initialInventory = [
        { bloodGroup: "A+", quantity: 0 },
        { bloodGroup: "A-", quantity: 0 },
        { bloodGroup: "B+", quantity: 0 },
        { bloodGroup: "B-", quantity: 0 },
        { bloodGroup: "O+", quantity: 0 },
        { bloodGroup: "O-", quantity: 0 },
        { bloodGroup: "AB+", quantity: 0 },
        { bloodGroup: "AB-", quantity: 0 },
      ];

      await bloodBank.create({
        _id: newUser._id, // Use same ID as user for easy linking
        name,
        registrationNumber,
        phone,
        email: contactEmail || email,
        address: {
          street,
          city,
          state,
          pincode,
        },
        inventory: initialInventory,
        operatingHours: {
          open: openTime || "09:00",
          close: closeTime || "17:00",
        },
        isVerified: false, // Admin needs to verify
      });
    } else if (role === "hospital") {
      // Create hospital profile
      await Hospital.create({
        _id: newUser._id, // Use same ID as user for easy linking
        email: email,
        password: hashedPassword,
        name,
        registrationNumber,
        phone,
        address: {
          street,
          city,
          state,
          pincode,
        },
        emergencyContact,
        isVerified: false, // Admin needs to verify
        role: "hospital",
        isActive: true,
      });
    }

    // Generate token
    const token = generateToken(newUser._id, newUser.role);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect based on role
    if (role === "bloodbank") {
      return res.redirect("/bloodbank-dashboard?success=Registration successful! Your account is pending verification.");
    } else if (role === "hospital") {
      return res.redirect("/hospital-dashboard?success=Registration successful! Your account is pending verification.");
    } else {
      return res.redirect("/?message=Registration successful! You can now donate blood.");
    }
  } catch (err) {
    console.error("Error during registration:", err);
    return res.render("register-new", {
      error: "Server error. Please try again later. " + err.message,
    });
  }
}

// Login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.render("login", {
        error: "Please provide email and password",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "Invalid email or password" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.render("login", {
        error: "Account is deactivated. Please contact support.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.render("login", { error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect all users to home page (role-based display is on home)
    return res.redirect("/");
  } catch (err) {
    console.error("Error during login:", err);
    return res.render("login", {
      error: "Server error. Please try again later.",
    });
  }
}

// Logout
async function logout(req, res) {
  try {
    // Clear the cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Redirect to login page
    return res.redirect("/login");
  } catch (err) {
    console.error("Error during logout:", err);
    return res.redirect("/login");
  }
}

module.exports = {
  register,
  login,
  logout,
};
