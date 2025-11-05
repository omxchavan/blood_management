// routes/user.js
const express = require("express");
const router = express.Router();
const { getUsers, addUser } = require("../controllers/user");
const { register, login, logout } = require("../controllers/auth");
const authenticate = require("../middleware/auth");

// Auth routes (public - no authentication)
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

// Protected routes (authentication required)
router.get("/allUsers", authenticate, getUsers);
router.post("/addUsers", authenticate, addUser);

module.exports = router;
