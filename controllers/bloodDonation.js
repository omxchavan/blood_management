// controllers/donationController.js
const { Donation } = require("../model/bloodDonation");
const { Donor } = require("../model/donor");
const { bloodBank } = require("../model/bloodBank");

exports.scheduleDonation = async (req, res) => {
  try {
    const { 
      bloodBank: bloodBankId, 
      bloodGroup, 
      quantity,
      fullName,
      phone,
      email,
      dateOfBirth,
      gender,
      street,
      city,
      state,
      pincode,
      lastDonationDate,
      medicalConditions,
      medications,
      allergies,
      donationDate,
      notes
    } = req.body;

    console.log("Scheduling donation for:", fullName, "Blood Bank:", bloodBankId);

    // Validate required fields
    if (!bloodBankId || !bloodGroup || !fullName || !phone || !dateOfBirth || !gender) {
      return res.redirect("/?error=Please fill in all required fields");
    }

    // Validate blood bank exists
    const bankExists = await bloodBank.findById(bloodBankId);
    if (!bankExists) {
      return res.redirect("/?error=Selected blood bank not found");
    }

    // Check if donor with this phone already exists
    let donor = await Donor.findOne({ phone: phone.trim() });

    if (donor) {
      console.log("Updating existing donor:", donor._id);
      // Update existing donor
      donor.fullName = fullName.trim();
      donor.email = email ? email.trim() : donor.email;
      donor.bloodGroup = bloodGroup;
      donor.dateOfBirth = new Date(dateOfBirth);
      donor.gender = gender;

      // Update address
      if (street || city || state || pincode) {
        donor.address = {
          street: street ? street.trim() : donor.address?.street,
          city: city ? city.trim() : donor.address?.city,
          state: state ? state.trim() : donor.address?.state,
          pincode: pincode ? pincode.trim() : donor.address?.pincode
        };
      }

      // Update medical history
      if (medicalConditions || medications || allergies) {
        donor.medicalHistory = {
          diseases: medicalConditions ? medicalConditions.split(',').map(item => item.trim()).filter(item => item) : donor.medicalHistory?.diseases || [],
          medications: medications ? medications.split(',').map(item => item.trim()).filter(item => item) : donor.medicalHistory?.medications || [],
          allergies: allergies ? allergies.split(',').map(item => item.trim()).filter(item => item) : donor.medicalHistory?.allergies || []
        };
      }

      if (lastDonationDate) {
        donor.lastDonationDate = new Date(lastDonationDate);
      }

      await donor.save();
    } else {
      console.log("Creating new donor");
      // Create new donor
      const donorData = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : undefined,
        bloodGroup: bloodGroup,
        dateOfBirth: new Date(dateOfBirth),
        gender: gender,
        isAvailable: true,
        address: {},
        medicalHistory: {}
      };

      // Add optional address fields
      if (street) donorData.address.street = street.trim();
      if (city) donorData.address.city = city.trim();
      if (state) donorData.address.state = state.trim();
      if (pincode) donorData.address.pincode = pincode.trim();

      // Add medical history
      if (medicalConditions) {
        donorData.medicalHistory.diseases = medicalConditions.split(',').map(item => item.trim()).filter(item => item);
      }
      if (medications) {
        donorData.medicalHistory.medications = medications.split(',').map(item => item.trim()).filter(item => item);
      }
      if (allergies) {
        donorData.medicalHistory.allergies = allergies.split(',').map(item => item.trim()).filter(item => item);
      }

      // Add last donation date if provided
      if (lastDonationDate) {
        donorData.lastDonationDate = new Date(lastDonationDate);
      }

      donor = await Donor.create(donorData);
      console.log("Created new donor with ID:", donor._id);
    }

    // Create donation appointment
    const donationData = {
      donor: donor._id,
      bloodBank: bloodBankId,
      bloodGroup: bloodGroup,
      quantity: quantity || 1,
      donationDate: donationDate ? new Date(donationDate) : new Date(),
      status: "scheduled",
      notes: notes ? notes.trim() : "",
    };

    const donation = await Donation.create(donationData);
    console.log("Created donation with ID:", donation._id);

    // Redirect with success message
    res.redirect("/?message=Thank you! Your blood donation has been scheduled successfully. The blood bank will contact you soon with further details.");
  } catch (err) {
    console.error("Error scheduling donation:", err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errorMessages = Object.values(err.errors).map(e => e.message);
      return res.redirect("/?error=" + encodeURIComponent(errorMessages.join(', ')));
    }
    
    // Handle duplicate key errors (like phone number)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.redirect("/?error=" + encodeURIComponent(`This ${field} is already registered. Please use a different ${field} or contact support.`));
    }
    
    res.redirect("/?error=Failed to schedule donation. Please try again or contact support if the problem persists.");
  }
};

exports.getDonationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id)
      .populate("donor")
      .populate("bloodBank", "name phone address");

    if (!donation) {
      return res.status(404).json({ 
        success: false,
        message: "Donation not found" 
      });
    }

    res.json({
      success: true,
      donation: donation
    });
  } catch (err) {
    console.error("Error fetching donation details:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching donation details",
      error: err.message 
    });
  }
};

exports.getDonations = async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};

    if (role === "donor") {
      query.donor = req.user.id;
    } else if (role === "bloodbank") {
      query.bloodBank = req.user.id;
    }
    
    console.log(`Donations Querying for ${role} ID: ${req.user.id}`);
    
    const donations = await Donation.find(query)
      .populate("donor", "fullName phone bloodGroup")
      .populate("bloodBank", "name phone address")
      .sort("-createdAt");

    console.log(`Found ${donations.length} donations`);
    res.json(donations);
  } catch (err) {
    console.error("Error fetching donations:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateDonationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, testResults } = req.body;

    const donation = await Donation.findById(id)
      .populate("donor")
      .populate("bloodBank");

    if (!donation) {
      if (req.method === 'POST') {
        return res.redirect("/bloodbank-dashboard?error=Donation not found");
      }
      return res.status(404).json({ message: "Donation not found" });
    }

    const oldStatus = donation.status;
    console.log(`Updating donation ${id} status from ${oldStatus} to ${status}`);

    // Update donation status
    const updateData = { status };
    if (testResults) updateData.testResults = testResults;
    
    const updatedDonation = await Donation.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("donor")
      .populate("bloodBank");

    // If completed, update inventory and donor last donation date
    if (status === "completed" && oldStatus !== "completed" && updatedDonation.bloodBank) {
      const donor = await Donor.findById(donation.donor);
      if (donor) {
        donor.lastDonationDate = new Date();
        donor.donationCount = (donor.donationCount || 0) + 1;
        await donor.save();
        console.log(`Updated donor ${donor._id} donation count to ${donor.donationCount}`);
      }

      // Update blood bank inventory
      const bank = await bloodBank.findById(updatedDonation.bloodBank);
      if (bank) {
        let inventoryItem = bank.inventory.find(
          (inv) => inv.bloodGroup === updatedDonation.bloodGroup
        );

        if (inventoryItem) {
          inventoryItem.quantity += updatedDonation.quantity || 1;
          inventoryItem.lastUpdated = new Date();
        } else {
          bank.inventory.push({
            bloodGroup: updatedDonation.bloodGroup,
            quantity: updatedDonation.quantity || 1,
            lastUpdated: new Date(),
          });
        }

        await bank.save();
        console.log(`Updated blood bank ${bank._id} inventory for ${updatedDonation.bloodGroup}`);
      }
    }

    if (req.method === 'POST') {
      return res.redirect("/bloodbank-dashboard?success=Donation status updated successfully");
    }

    res.json({
      message: "Donation status updated successfully",
      donation: updatedDonation,
    });
  } catch (err) {
    console.error("Error updating donation status:", err);
    if (req.method === 'POST') {
      return res.redirect("/bloodbank-dashboard?error=Failed to update donation status");
    }
    res.status(500).json({ message: err.message });
  }
};