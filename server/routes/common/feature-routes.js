const express = require("express");
const {
  addFeatureImage,
  getFeatureImages,
  deleteFeatureImage, // Import the delete function
} = require("../../controllers/common/feature-controller");

const router = express.Router();

// Route to add a feature image
router.post("/add", addFeatureImage);

// Route to get all feature images
router.get("/get", getFeatureImages);

// Route to delete a feature image by ID
router.delete("/delete/:id", deleteFeatureImage); // New route for deleting by ID

module.exports = router;

