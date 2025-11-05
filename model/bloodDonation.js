// model/bloodDonation.js
const { default: mongoose } = require("mongoose");

// ONLY define the Donation schema - don't redefine Donor schema here
const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "donors", // Reference the existing donors collection
      required: true,
    },
    bloodBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodBank",
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    donationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "rejected"],
      default: "scheduled",
    },
    completedDate: {
      type: Date,
    },
    testResults: {
      hivStatus: String,
      hepatitisStatus: String,
      otherTests: String,
      approved: {
        type: Boolean,
        default: false,
      },
    },
    notes: String,
  },
  { timestamps: true }
);

// Check if model already exists before creating it
const Donation = mongoose.models.donation || mongoose.model("donation", donationSchema);

module.exports = { Donation };