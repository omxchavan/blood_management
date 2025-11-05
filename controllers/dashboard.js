const { BloodRequest } = require("../model/bloodRequest");
const { Donation } = require("../model/bloodDonation");
const { bloodBank } = require("../model/bloodBank");
const { Donor } = require("../model/donor");
const { Hospital } = require("../model/hospital");

// Get hospital dashboard data
async function getHospitalDashboard(req, res) {
  try {
    const hospitalId = req.user.id;
    const success = req.query.success || null;
    const error = req.query.error || null;

    // Get all blood requests for this hospital
    const requests = await BloodRequest.find({ requestedBy: hospitalId })
      .populate("fulfilledBy", "name")
      .sort("-createdAt");

    res.render("hospital-dashboard", {
      user: req.user,
      requests: requests || [],
      success: success,
      error: error,
    });
  } catch (err) {
    console.error("Error fetching hospital dashboard:", err);
    res.render("hospital-dashboard", {
      user: req.user,
      requests: [],
      success: null,
      error: null,
    });
  }
}

// Get blood bank dashboard data
async function getBloodBankDashboard(req, res) {
  try {
    const bankId = req.user.id;
    const success = req.query.success || null;
    const error = req.query.error || null;

    console.log("Loading dashboard for blood bank:", bankId);

    // Get bank inventory and info
    const bank = await bloodBank.findById(bankId);
    const inventory = bank?.inventory || [];

    // Get all donation requests for this blood bank with better error handling
    let donations = [];
    try {
      donations = await Donation.find({ bloodBank: bankId })
        .populate({
          path: "donor",
          select: "fullName bloodGroup phone email"
        })
        .sort("-createdAt")
        .lean(); // Use lean() for better performance
      
      console.log(`Found ${donations.length} donations for blood bank ${bankId}`);
    } catch (donationErr) {
      console.error("Error fetching donations:", donationErr);
    }
    const donorCount = await Donor.countDocuments({});

    // Get all blood requests (hospitals requesting blood)
    const requests = await BloodRequest.find({
      status: { $in: ["pending", "approved"] },
    })
      .populate("requestedBy", "name")
      .sort("-createdAt");

    // Get all donors (not just those with user accounts)
    const donors = await Donor.find()
      .select("fullName phone bloodGroup donationCount lastDonationDate")
      .sort("-createdAt")
      .lean();

    console.log(`Total donors in system: ${donorCount}`);
    console.log(`Total donations: ${donations.length}`);

    res.render("bloodbank-dashboard", {
      user: req.user,
      bank: bank,
      inventory: inventory,
      donations: donations,
      registeredDonorsCount: donorCount,
      requests: requests || [],
      donors: donors,
      success: success,
      error: error,
    });
  } catch (err) {
    console.error("Error fetching blood bank dashboard:", err);
    res.render("bloodbank-dashboard", {
      user: req.user,
      bank: null,
      inventory: [],
      donations: [],
      requests: [],
      donors: [],
      success: null,
      error: err.message,
    });
  }
}

module.exports = {
  getHospitalDashboard,
  getBloodBankDashboard,
};