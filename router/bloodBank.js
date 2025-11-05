const express = require('express');
const router = express.Router();
const {getAllBloodBanks,getBloodBankInventory,updateBloodBankProfile,addBloodBank,getBloodBanksByBloodGroup,updateInventory,bulkUpdateInventory} = require('../controllers/bloodBank');

// Blood bank management routes
router.post('/addBank',addBloodBank);
router.get('/allBanks',getAllBloodBanks);
router.get('/filter',getBloodBanksByBloodGroup);
router.get('/profile',updateBloodBankProfile);

// Inventory management routes
router.get('/:id/inventory',getBloodBankInventory);
router.put('/:id/inventory',updateInventory);
router.put('/:id/inventory/bulk',bulkUpdateInventory);

module.exports = router;