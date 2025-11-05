const mongoose = require("mongoose");
const { Donor } = require("../model/donor");

// Create a new donor profile
async function createDonor(req, res) {
  try {
    const {
      fullName,
      phone,
      bloodGroup,
      dateOfBirth,
      gender,
      address,
      lastDonationDate,
      isAvailable,
      medicalHistory,
    } = req.body;

    // Basic validation
    if (!fullName || !phone || !bloodGroup || !dateOfBirth || !gender) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Create new donor (no userId check needed)
    const newDonor = await Donor.create({
      fullName,
      phone,
      bloodGroup,
      dateOfBirth,
      gender,
      address,
      lastDonationDate,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      medicalHistory,
    });

    // Redirect to home with success message
    return res.redirect("/?message=Donor profile created successfully");
  } catch (err) {
    console.error("Error creating donor profile:", err);
    return res.redirect("/?error=Error creating profile. Please try again.");
  }
}

// update profile
async function updateDonorProfile(req, res) {
  try {
    const donor = await Donor.findByIdAndUpdate(
      req.params.id, // the MongoDB _id from URL params
      req.body,
      { new: true, runValidators: true }
    );

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// get all donors
async function getAllDonors(req, res) {
  try {
    const donor = await Donor.find();
    if (!donor) {
      return res.status(404).json({ message: "Donor profile not found" });
    }
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getAllDonors, updateDonorProfile, createDonor };
