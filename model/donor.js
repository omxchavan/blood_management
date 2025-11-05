// model/donor.js
const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
    },
    email: {
      type: String,
      sparse: true, // Allows null/undefined values while maintaining uniqueness for non-null values
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: [true, "Blood group is required"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    medicalHistory: {
      diseases: [String],
      medications: [String],
      allergies: [String],
    },
    lastDonationDate: {
      type: Date,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    donationCount: {
      type: Number,
      default: 0,
    },
  },
  { 
    timestamps: true 
  }
);

// Check if model already exists before creating it
const Donor = mongoose.models.donors || mongoose.model("donors", donorSchema);

module.exports = { Donor };