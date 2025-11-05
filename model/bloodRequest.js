const { default: mongoose } = require("mongoose");


// models/BloodRequest.js
const bloodRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "hospital",
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    unitsRequired: {
      type: Number,
      required: true,
      min: 1,
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    requiredBy: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "fulfilled", "rejected", "cancelled"],
      default: "pending",
    },
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodBank",
    },
    fulfilledAt: Date,
    notes: String,
    recommendedDonors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "donors", // ensure this matches your Donor model's name
      },
    ],
  },
  { timestamps: true }
);

const BloodRequest = mongoose.model("requests", bloodRequestSchema);

module.exports = { BloodRequest };
