// routes bloodRequest.js
const express = require("express");
const router = express.Router();
const {
  getBloodRequests,
  createBloodRequest,
  deleteBloodRequest,
  getDonorRecommendations,
  updateBloodRequestStatus,
  getAllRequests,
} = require("../controllers/bloodRequest");
const authenticate = require("../middleware/auth");

router.post("/createRequest", authenticate, createBloodRequest);
router.get("/allRequests", authenticate, getAllRequests);
router.get("/allRequets", getBloodRequests); // Keep for backward compatibility
router.put("/requestStatus", authenticate, updateBloodRequestStatus);
router.post("/requestStatus", authenticate, updateBloodRequestStatus); // Also support POST for forms
// Delete blood request (only for hospitals, only pending/rejected requests)
router.post('/:id/delete', 
  authenticate, 
deleteBloodRequest
);

// Get donor recommendations for a specific request
router.get('/:id/donors', 
  authenticate, getDonorRecommendations
);

module.exports = router;
