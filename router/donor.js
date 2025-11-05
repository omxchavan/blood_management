const express = require("express");
const router = express.Router();
const {
  getAllDonors,
  updateDonorProfile,
  createDonor,
} = require("../controllers/donor");
const authenticate = require("../middleware/auth");

router.post("/createProfile", authenticate, createDonor);
router.put("/updateProfile/:id", authenticate, updateDonorProfile);
router.get("/allDonors", getAllDonors);

module.exports = router;
