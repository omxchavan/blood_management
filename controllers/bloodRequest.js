const { BloodRequest } = require("../model/bloodRequest");
const { Hospital } = require("../model/hospital");
const { Donor } = require("../model/donor")
const { bloodBank } = require("../model/bloodBank");
const { exec } = require("child_process");


exports.createBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.create({
      requestedBy: req.user.id,
      ...req.body,
    });

    const bloodGroup = req.body.bloodGroup;
    const city = req.body.city || req.user.city || "Unknown";
    const months = req.body.monthsSinceLastDonation || 3;
    const state = req.body.state || req.user.state || "Maharashtra";


    // 🔹 Run ML prediction script
    const command = `python ml/recommend_donors.py "${bloodGroup},${city},${months}"`;

    exec(command, async (err, stdout, stderr) => {
      if (err) {
        console.error("ML Script Error:", stderr);
        return res.render("bloodRequestSuccess", {
          message: "Blood request created successfully!",
          prediction: "ML model failed to predict",
          donors: [],
          requestId: request._id,
        });
      }

      console.log("🧠 ML Prediction Output:", stdout);
      const prediction = stdout.trim();

      // 🔹 Find top 3 matching donors
      const donors = await Donor.find({
          bloodGroup,
          isAvailable: true,
          $or: [
            { "address.city": { $regex: city, $options: "i" } },
            { "address.state": { $regex: state || "Maharashtra", $options: "i" } },
          ],
        })
          .sort({ donationCount: -1, lastDonationDate: 1 })
          .limit(3);

      // Save donor recommendations to the request
      await BloodRequest.findByIdAndUpdate(request._id, {
        mlPrediction: prediction,
        recommendedDonors: donors.map(d => d._id),
      });

      // Render success page with prediction + donors
      return res.render("bloodRequestSuccess", {
        message: "Blood request created successfully!",
        prediction,
        donors,
        requestId: request._id,
      });
    });
  } catch (err) {
    console.error("Error creating blood request:", err);
    return res.redirect("/hospital-dashboard?error=Failed to create request");
  }
};


exports.getBloodRequests = async (req, res) => {
  try {
    const { status, urgency } = req.query;
    const query = {};

    if (status) query.status = status;
    if (urgency) query.urgency = urgency;

    const requests = await BloodRequest.find(query)
      .populate("requestedBy", "name phone address")
      .populate("fulfilledBy", "name phone")
      .sort("-createdAt");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all blood requests for blood bank dashboard
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate("requestedBy", "name phone address")
      .populate("fulfilledBy", "name phone")
      .sort("-createdAt");

    res.render("all-requests", {
      user: req.user,
      requests: requests || [],
      success: req.query.success,
      error: req.query.error,
    });
  } catch (err) {
    console.error("Error fetching all requests:", err);
    res.render("all-requests", {
      user: req.user,
      requests: [],
      error: "Failed to load requests",
    });
  }
};

exports.updateBloodRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.body;
    const { id } = req.params;
    const request_id = requestId || id;
    const { status, notes } = req.body;

    const updateData = { status, notes };

    // Get the original request
    const originalRequest = await BloodRequest.findById(request_id);
    if (!originalRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Handle inventory deduction if fulfilled
    if (status === "fulfilled") {
      updateData.fulfilledBy = req.user.id;
      updateData.fulfilledAt = new Date();

      const bank = await bloodBank.findById(req.user.id);
      if (bank) {
        const inventoryItem = bank.inventory.find(
          (inv) => inv.bloodGroup === originalRequest.bloodGroup
        );

        if (
          inventoryItem &&
          inventoryItem.quantity >= originalRequest.unitsRequired
        ) {
          inventoryItem.quantity -= originalRequest.unitsRequired;
          inventoryItem.lastUpdated = new Date();
          await bank.save();
        } else {
          return res.status(400).json({ message: "Insufficient inventory" });
        }
      }
    }

    const request = await BloodRequest.findByIdAndUpdate(
      request_id,
      updateData,
      { new: true }
    )
      .populate("requestedBy")
      .populate("fulfilledBy");

    return res.redirect(
      "/bloodbank-dashboard?success=Request status updated successfully"
    );
  } catch (err) {
    console.error("Error updating request status:", err);
    return res.redirect(
      "/bloodbank-dashboard?error=Failed to update request status"
    );
  }
};

// Delete blood request
exports.deleteBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.redirect("/hospital-dashboard?error=Request not found");
    }

    // Check if the request belongs to the logged-in hospital
    if (request.requestedBy.toString() !== req.user.id.toString()) {
      return res.redirect("/hospital-dashboard?error=Unauthorized to delete this request");
    }

    // Only allow deletion of pending or rejected requests
    if (request.status === "fulfilled" || request.status === "approved") {
      return res.redirect("/hospital-dashboard?error=Cannot delete approved or fulfilled requests");
    }

    await BloodRequest.findByIdAndDelete(id);
    return res.redirect("/hospital-dashboard?success=Request deleted successfully");
  } catch (err) {
    console.error("Error deleting request:", err);
    return res.redirect("/hospital-dashboard?error=Failed to delete request");
  }
};

// Get donor recommendations for a request
exports.getDonorRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await BloodRequest.findById(id)
      .populate("recommendedDonors", "fullName phone bloodGroup address donationCount lastDonationDate");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // If no recommendations stored, generate them
    let donors = request.recommendedDonors || [];
    let prediction = request.mlPrediction || "No prediction available";

    if (donors.length === 0) {
      const city = request.city || "Unknown";
      const state = request.state || "Maharashtra";
      
      donors = await Donor.find({
        bloodGroup: request.bloodGroup,
        isAvailable: true,
        $or: [
          { "address.city": { $regex: city, $options: "i" } },
          { "address.state": { $regex: state, $options: "i" } },
        ],
      })
        .sort({ donationCount: -1, lastDonationDate: 1 })
        .limit(3);
    }

    res.render("donorRecommendations", {
      user: req.user,
      request,
      donors,
      prediction,
    });
  } catch (err) {
    console.error("Error fetching donor recommendations:", err);
    res.redirect("/hospital-dashboard?error=Failed to load recommendations");
  }
};