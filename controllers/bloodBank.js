const { bloodBank } = require("../model/bloodBank");

// Add a new blood bank
async function addBloodBank(req, res) {
  try {
    const {
      name,
      registrationNumber,
      phone,
      email,
      address,
      inventory,
      operatingHours,
      isVerified,
    } = req.body;

    // Check required fields
    if (!name || !registrationNumber || !phone || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if a blood bank with the same registrationNumber already exists
    const existingBank = await bloodBank.findOne({ registrationNumber });
    if (existingBank) {
      return res.status(409).json({ message: "Blood bank already exists" });
    }

    const newBank = new bloodBank({
      name,
      registrationNumber,
      phone,
      email,
      address,
      inventory,
      operatingHours,
      isVerified,
    });

    const savedBank = await newBank.save();
    res.status(201).json(savedBank);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

// get all bood banks
async function getAllBloodBanks(req, res) {
  try {
    const bloodBanks = await bloodBank.find(); // await the query
    
    // Render view for browser requests
    res.render("all-blood-banks", {
      user: req.user,
      bloodBanks: bloodBanks || [],
    });
  } catch (error) {
    console.error(error);
    res.render("all-blood-banks", {
      user: req.user,
      bloodBanks: [],
      error: "Failed to load blood banks"
    });
  }
}

// Get inventory of a specific blood bank by ID
async function getBloodBankInventory(req, res) {
  try {
    const { id } = req.params;
    const bank = await bloodBank.findById(id);

    if (!bank) {
      return res.status(404).render('404', { message: 'Blood bank not found' });
    }

    // Render the inventory view
    res.render('bloodBankDetails', { bank });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Server Error' });
  }
}

// GET blood banks filtered by blood group
async function getBloodBanksByBloodGroup(req, res) {
  try {
    const { bloodGroup } = req.query; 

    if (!bloodGroup) {
      return res.status(400).json({ message: 'Please provide a bloodGroup query parameter' });
    }

    // Validate blood group
    const validGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    // Find blood banks that have this blood group with quantity > 0
    const banks = await bloodBank.find({
      inventory: {
        $elemMatch: { bloodGroup: bloodGroup, quantity: { $gt: 0 } }
      }
    });

    res.json(banks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


//blood bank profile
const updateBloodBankProfile = async (req, res) => {
  try {
    const { id } = req.params; // blood bank ID from URL
    const updateData = req.body;

    // Optional: sanitize fields to avoid overwriting unwanted fields
    const allowedFields = [
      "name",
      "registrationNumber",
      "phone",
      "email",
      "address",
      "inventory",
      "operatingHours",
      "isVerified",
    ];

    const filteredData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    const updatedBank = await bloodBank.findByIdAndUpdate(
      id,
      { $set: filteredData },
      { new: true, runValidators: true }
    );

    if (!updatedBank) {
      return res.status(404).json({ message: "Blood bank not found" });
    }

    res.json({
      message: "Profile updated successfully",
      data: updatedBank,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Update inventory for a specific blood bank
async function updateInventory(req, res) {
  try {
    const { id } = req.params;
    const { bloodGroup, quantity, operation } = req.body; // operation: 'add' or 'remove'

    if (!bloodGroup || !quantity || !operation) {
      return res.status(400).json({ message: "Missing required fields: bloodGroup, quantity, operation" });
    }

    if (!['add', 'remove', 'set'].includes(operation)) {
      return res.status(400).json({ message: "Invalid operation. Must be 'add', 'remove', or 'set'" });
    }

    const validGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: "Invalid blood group" });
    }

    const bank = await bloodBank.findById(id);
    if (!bank) {
      return res.status(404).json({ message: "Blood bank not found" });
    }

    // Find existing inventory item
    let inventoryItem = bank.inventory.find(item => item.bloodGroup === bloodGroup);

    if (operation === 'set') {
      // Set exact quantity
      if (inventoryItem) {
        inventoryItem.quantity = Math.max(0, quantity);
        inventoryItem.lastUpdated = new Date();
      } else {
        bank.inventory.push({
          bloodGroup,
          quantity: Math.max(0, quantity),
          lastUpdated: new Date()
        });
      }
    } else if (operation === 'add') {
      // Add to existing quantity
      if (inventoryItem) {
        inventoryItem.quantity += quantity;
        inventoryItem.lastUpdated = new Date();
      } else {
        bank.inventory.push({
          bloodGroup,
          quantity: quantity,
          lastUpdated: new Date()
        });
      }
    } else if (operation === 'remove') {
      // Remove from existing quantity
      if (!inventoryItem) {
        return res.status(400).json({ message: "No existing inventory for this blood group" });
      }
      inventoryItem.quantity = Math.max(0, inventoryItem.quantity - quantity);
      inventoryItem.lastUpdated = new Date();
    }

    await bank.save();

    res.json({
      message: `Inventory ${operation} operation successful`,
      inventory: bank.inventory
    });
  } catch (error) {
    console.error("Update Inventory Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Bulk update inventory
async function bulkUpdateInventory(req, res) {
  try {
    const { id } = req.params;
    const { inventoryUpdates } = req.body; // Array of { bloodGroup, quantity }

    if (!inventoryUpdates || !Array.isArray(inventoryUpdates)) {
      return res.status(400).json({ message: "Invalid inventory updates data" });
    }

    const bank = await bloodBank.findById(id);
    if (!bank) {
      return res.status(404).json({ message: "Blood bank not found" });
    }

    const validGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    inventoryUpdates.forEach(update => {
      if (!validGroups.includes(update.bloodGroup)) {
        throw new Error(`Invalid blood group: ${update.bloodGroup}`);
      }

      let inventoryItem = bank.inventory.find(item => item.bloodGroup === update.bloodGroup);
      
      if (inventoryItem) {
        inventoryItem.quantity = Math.max(0, update.quantity);
        inventoryItem.lastUpdated = new Date();
      } else {
        bank.inventory.push({
          bloodGroup: update.bloodGroup,
          quantity: Math.max(0, update.quantity),
          lastUpdated: new Date()
        });
      }
    });

    await bank.save();

    res.json({
      message: "Bulk inventory update successful",
      inventory: bank.inventory
    });
  } catch (error) {
    console.error("Bulk Update Inventory Error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}

module.exports = { 
  getAllBloodBanks, 
  getBloodBankInventory, 
  addBloodBank, 
  getBloodBanksByBloodGroup, 
  updateBloodBankProfile,
  updateInventory,
  bulkUpdateInventory
};
